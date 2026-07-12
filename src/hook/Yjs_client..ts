// src/hook/Yjs_client..ts
//
// Thin generic CRDT layer, sits UNDER useBoardSync — does not talk to sockets
// or React itself. useBoardSync wires it to your existing /board namespace.
//
// One YjsBoardStore = one Y.Doc = one (projectId, phase) room, matching the
// exact room key you already use in boardsocket.js: `board:<projectId>:<boardType>`
//
// Structure inside the doc:
//   doc.getMap(toolKey)                    -> Y.Map<itemId, Y.Map<field, value>>
//   item's "text" field (if the item has one) -> stored as Y.Text, not a string
//
// Y.Text is the actual fix for "two people typing in the same box": Yjs merges
// concurrent character inserts/deletes deterministically, instead of one
// user's full save overwriting the other's.

import * as Y from "yjs";

export type PlainItem = Record<string, any> & { id: string };

export class YjsBoardStore {
  doc = new Y.Doc();

  private itemsMap(toolKey: string): Y.Map<Y.Map<any>> {
    return this.doc.getMap(toolKey);
  }

  private toPlain(itemMap: Y.Map<any>): PlainItem {
    const obj: PlainItem = { id: "" };
    itemMap.forEach((value, key) => {
      obj[key] = value instanceof Y.Text ? value.toString() : value;
    });
    return obj;
  }

  // Current array for one toolKey (e.g. "notes"). Cheap — call from render.
  
  getArray(toolKey: string): PlainItem[] {
  const out: PlainItem[] = [];
  this.itemsMap(toolKey).forEach((itemMap) => {
    const plain = this.toPlain(itemMap);
    if (plain.id) out.push(plain);   // drop anything still missing an id
  });
  return out;
}
  // Fires on ANY change under a toolKey: item added/removed, a field changed,
  // or a Y.Text edit (including remote keystrokes from another user).
  subscribe(toolKey: string, cb: () => void): () => void {
    const map = this.itemsMap(toolKey);
    map.observeDeep(cb);
    return () => map.unobserveDeep(cb);
  }

  // Create/update an item's non-text fields (x, y, width, fill, ...).
  // Deliberately skips "text" — that's owned by getOrCreateText/bindTextareaToYText
  // so a stale full-object save can never clobber someone's live typing.
  upsertItem(toolKey: string, id: string, fields: Record<string, any>) {
    const map = this.itemsMap(toolKey);
    this.doc.transact(() => {
      let itemMap = map.get(id);
      if (!itemMap) {
        itemMap = new Y.Map();
        itemMap.set("id", id); 
        map.set(id, itemMap);
      
      }
      itemMap.set("id", id); 
      for (const [key, value] of Object.entries(fields)) {
        if (key === "text") continue;
       
      }
    });
  }

  // Returns the item's Y.Text, creating it (seeded with `initial`) only if it
  // doesn't exist yet. Never overwrites an existing Y.Text — that's what
  // keeps concurrent typing safe.
  
  getOrCreateText(toolKey: string, id: string, initial = ""): Y.Text {
    const map = this.itemsMap(toolKey);
    let itemMap = map.get(id);
    if (!itemMap) {
      itemMap = new Y.Map();
        itemMap.set("id", id); 
      map.set(id, itemMap);
    }
    let ytext = itemMap.get("text");
    if (!(ytext instanceof Y.Text)) {
      ytext = new Y.Text(initial);
      itemMap.set("text", ytext);
    }
    return ytext;
  }

  removeItem(toolKey: string, id: string) {
    this.itemsMap(toolKey).delete(id);
  }

  destroy() {
    this.doc.destroy();
  }
}

// Diff a plain-array write (what board.tsx already produces via setNotes/setTextCards/...)
// against the current CRDT state, and apply only the deltas — never a wholesale
// replace. This is what makes syncPatch safe to keep calling exactly as it does today.
export function diffAndApplyToYjs(store: YjsBoardStore, toolKey: string, items: PlainItem[]) {
  const existingIds = new Set(store.getArray(toolKey).map((i) => i.id));
  const nextIds = new Set(items.map((i) => i.id));

  for (const item of items) {
    store.upsertItem(toolKey, item.id, item);
    if (typeof item.text === "string") {
      store.getOrCreateText(toolKey, item.id, item.text); // no-op if Y.Text already exists
    }
  }
  for (const id of existingIds) {
    if (!nextIds.has(id)) store.removeItem(toolKey, id);
  }
}
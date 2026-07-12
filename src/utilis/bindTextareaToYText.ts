// src/utilis/bindTextareaToYText.ts
//
// Two-way binding between a native <textarea> DOM node and a Y.Text.
// This is the piece that directly solves "two people typing in the same box":
// every keystroke becomes a small insert/delete CRDT op instead of the whole
// string being sent on blur, so both users' edits merge live.
//
// No editor library needed (no ProseMirror/Quill) — same diff approach the
// Yjs docs use for plain textareas. Drop-in for your Note.tsx / TextCards.tsx
// textarea overlay.

import * as Y from "yjs";

export function bindTextareaToYText(
  textarea: HTMLTextAreaElement,
  ytext: Y.Text
): () => void {
  // Remote -> local: another user's keystrokes (or our own echoed back)
  // get reflected into the textarea without stomping the caret mid-type.
  const remoteObserver = () => {
    const value = ytext.toString();
    if (textarea.value !== value) {
      const { selectionStart, selectionEnd } = textarea;
      textarea.value = value;
      textarea.selectionStart = selectionStart;
      textarea.selectionEnd = selectionEnd;
    }
  };
  ytext.observe(remoteObserver);

  // Local -> CRDT: diff old vs new value, apply only the changed range.
  const onInput = () => {
    const newValue = textarea.value;
    const oldValue = ytext.toString();
    if (newValue === oldValue) return;

    let start = 0;
    while (
      start < oldValue.length &&
      start < newValue.length &&
      oldValue[start] === newValue[start]
    ) start++;

    let oldEnd = oldValue.length;
    let newEnd = newValue.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      oldValue[oldEnd - 1] === newValue[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    ytext.doc?.transact(() => {
      if (oldEnd > start) ytext.delete(start, oldEnd - start);
      if (newEnd > start) ytext.insert(start, newValue.slice(start, newEnd));
    });
  };
  textarea.addEventListener("input", onInput);

  // Seed with whatever's already in the CRDT (e.g. the other user's
  // in-progress edit) instead of overwriting it with local note.text.
  textarea.value = ytext.toString();

  return () => {
    ytext.unobserve(remoteObserver);
    textarea.removeEventListener("input", onInput);
  };
}
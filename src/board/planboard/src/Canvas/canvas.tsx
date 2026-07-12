

// canvas.tsx
import { MdDownload } from "react-icons/md"
import jsPDF from "jspdf";
import { Stage, Layer } from "react-konva";
import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuid } from "uuid";
import BottomToolbar from "../Sidebar/buttombar";
import FlowchartToolbar from "../Sidebar/FlowchartToolbar";
import FlowNodes from "./FlowNodes";
import type { FlowNodeType, FlowEdgeType, NoteType, CommentThread, TextCardType } from "./types";
import { getDynamicSize } from "./dynamicSize";
import Note from "./Note";
import CommentModule from "./CommentWindow";
import TextModule from "./TextCards";
import ImageModule, { type ImageCard } from "./imgModule";
import ImageBottomBar from "../Sidebar/imgButtomBar";
import React from "react";
import type { DraggableAIElement } from "../Sidebar/AI/chatModule";


// ── Constants ─────────────────────────────────────────────────────────────────
const EDGE_PADDING = 300;
const GROW_AMOUNT = 400;
const SPAWN_OFFSET = 40;
const COLLISION_MARGIN = 20;
const MAX_NUDGE = 12;

// ── Layout constants ─────────────────────────────────────────────────────────
// AI_PANEL_VW / AI_GAP_VW are kept for SPAWN_MAX_X calc which must leave room
// for the right sidebar that is still fixed-position inside the canvas region.
const AI_PANEL_VW = 0;      // panel is now outside our flex column — not subtracted
const AI_GAP_VW = 0;      // gap is a flex spacer in App — not subtracted here

// Width of the canvas viewport in pixels.
// The canvas scroll container fills its flex slot; window.innerWidth is the
// full viewport width, so we subtract the panel + gap to get our share.
const PANEL_AND_GAP_VW = 0.265; // 26vw panel + 0.5vw gap ≈ 26.5vw
const vw = (): number => {
  if (typeof window === "undefined") return 940;
  return window.innerWidth * (1 - PANEL_AND_GAP_VW);
};
const vh = () => (typeof window !== "undefined" ? window.innerHeight : 800);

// ── Safe-zone boundaries for spawned items ────────────────────────────────────
// SPAWN_MIN_X = 0: stage x:0 IS the canvas left edge; AI panel is already excluded.
// SPAWN_MAX_X: canvas width minus right-sidebar (110px) and 0.5vw extra gap.
const SPAWN_MIN_X = () => 0;
const SIDEBAR_FOOTPRINT = 110; // 20 px margin + 90 px min-width
const SPAWN_MAX_X = (w: number) =>
  Math.max(0, vw() - SIDEBAR_FOOTPRINT - window.innerWidth * AI_GAP_VW - w);

// ── Types ─────────────────────────────────────────────────────────────────────
interface BBox { x: number; y: number; width: number; height: number; }

interface CanvasProps {
  notes: NoteType[];
  setNotes: React.Dispatch<React.SetStateAction<NoteType[]>>;
  textCards: TextCardType[];
  setTextCards: React.Dispatch<React.SetStateAction<TextCardType[]>>;
  flowNodes: FlowNodeType[];
  setFlowNodes: React.Dispatch<React.SetStateAction<FlowNodeType[]>>;
  connections: FlowEdgeType[];
  setConnections: React.Dispatch<React.SetStateAction<FlowEdgeType[]>>;
  imageCards: ImageCard[];
  setImageCards: React.Dispatch<React.SetStateAction<ImageCard[]>>;
  commentThreads: CommentThread[];
  setCommentThreads: React.Dispatch<React.SetStateAction<CommentThread[]>>;
  activeTool: string | null;
  currentUser: string;
  currentUserId?: string;
  presence?: { userId: string; name: string; color: string }[];
  typingUsers?: Record<string, { userId: string; name: string }[]>;
  emitCommentTyping?: (threadId: string) => void;
  emitCommentStopTyping?: (threadId: string) => void;
   emitCommentRead?: (threadId: string, commentId: string) => void;
}

// ── Collision helpers ─────────────────────────────────────────────────────────
function overlaps(a: BBox, b: BBox, margin = COLLISION_MARGIN) {
  return (
    a.x < b.x + b.width + margin &&
    a.x + a.width > b.x - margin &&
    a.y < b.y + b.height + margin &&
    a.y + a.height > b.y - margin
  );
}

// Nudges the candidate until it doesn't overlap any existing bbox.
// Tries right-of-hit first; wraps to a new row when approaching the right edge.
// Final position is clamped to the safe zone so nothing slides under either sidebar.
function resolveCollision(candidate: BBox, existing: BBox[]): { x: number; y: number } {
  let { x, y } = candidate;
  const minX = SPAWN_MIN_X();
  const maxX = SPAWN_MAX_X(candidate.width);
  for (let i = 0; i < MAX_NUDGE; i++) {
    const box: BBox = { x, y, width: candidate.width, height: candidate.height };
    const hit = existing.find((e) => overlaps(box, e));
    if (!hit) break;
    x = hit.x + hit.width + COLLISION_MARGIN;
    if (x > maxX) {
      x = minX;
      y = hit.y + hit.height + COLLISION_MARGIN;
    }
  }
  // Hard clamp — always enforce safe zone regardless of nudge path
  x = Math.max(minX, Math.min(maxX, x));
  return { x, y };
}

export default function Canvas({
  notes, setNotes,
  textCards, setTextCards,
  flowNodes, setFlowNodes,
  connections, setConnections,
  imageCards, setImageCards,
  commentThreads, setCommentThreads,
  activeTool,
  currentUser,
  currentUserId,       // NEW
  presence,            // NEW
  typingUsers,         // NEW
  emitCommentTyping,   // NEW
  emitCommentStopTyping,
  emitCommentRead,
}: CanvasProps) {
  const stageRef = useRef<any>(null);
  const prevToolRef = useRef<string | null>(null);
  const [commentMode, setCommentMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Track the last-placed bbox (any type) so new items spawn adjacent to it
  const lastPlacedRef = useRef<BBox | null>(null);

  const SCROLL_ZONE = 80;
  const SCROLL_SPEED = 18;

  const autoScrollStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !isDragging.current) return;
    const { x, y } = pointerRef.current;
    const W = vw(), H = vh();
    let dx = 0, dy = 0;
    if (x > W - SCROLL_ZONE) dx = Math.ceil(SCROLL_SPEED * ((x - (W - SCROLL_ZONE)) / SCROLL_ZONE));
    if (x < SCROLL_ZONE) dx = -Math.ceil(SCROLL_SPEED * ((SCROLL_ZONE - x) / SCROLL_ZONE));
    if (y > H - SCROLL_ZONE) dy = Math.ceil(SCROLL_SPEED * ((y - (H - SCROLL_ZONE)) / SCROLL_ZONE));
    if (y < SCROLL_ZONE) dy = -Math.ceil(SCROLL_SPEED * ((SCROLL_ZONE - y) / SCROLL_ZONE));
    if (dx) el.scrollLeft += dx;
    if (dy) el.scrollTop += dy;
    rafRef.current = requestAnimationFrame(autoScrollStep);
  }, []);

  const startAutoScroll = useCallback(() => {
    if (isDragging.current) return;
    isDragging.current = true;
    rafRef.current = requestAnimationFrame(autoScrollStep);
  }, [autoScrollStep]);

  const stopAutoScroll = useCallback(() => {
    isDragging.current = false;
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => { pointerRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const [stageSize, setStageSize] = useState({ width: vw() * 2, height: vh() * 2 });

  useEffect(() => {
    const onResize = () =>
      setStageSize((p) => ({
        width: Math.max(p.width, vw() * 2),
        height: Math.max(p.height, vh() * 2),
      }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── UI-only state ─────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"text" | "flowchart" | "note" | "image" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [connectionStartId, setConnectionStartId] = useState<string | null>(null);
  const [activeSubTool, setActiveSubTool] = useState<"select" | "connector">("select");

  //const currentUser = "You";

  // Returns bounding boxes for every element currently on the canvas
  const getAllBBoxes = useCallback((): BBox[] => [
    ...flowNodes.map((n) => ({ x: n.x, y: n.y, width: n.width, height: n.height })),
    ...imageCards.map((c) => ({ x: c.x, y: c.y, width: c.width, height: c.height })),
    ...textCards.map((t) => ({ x: t.x, y: t.y, width: t.width ?? 200, height: (t as any).height ?? 40 })),
    ...notes.map((n) => ({ x: n.x, y: n.y, width: n.width, height: n.height })),
  ], [flowNodes, imageCards, textCards, notes]);

  // Auto-expand stage when any element approaches an edge
  useEffect(() => {
    const boxes = getAllBBoxes();
    if (!boxes.length) return;
    const maxRight = Math.max(...boxes.map((b) => b.x + b.width));
    const maxBottom = Math.max(...boxes.map((b) => b.y + b.height));
    setStageSize((prev) => {
      const needW = maxRight + EDGE_PADDING > prev.width - EDGE_PADDING;
      const needH = maxBottom + EDGE_PADDING > prev.height - EDGE_PADDING;
      if (!needW && !needH) return prev;
      return {
        width: needW ? Math.max(prev.width, maxRight + GROW_AMOUNT) : prev.width,
        height: needH ? Math.max(prev.height, maxBottom + GROW_AMOUNT) : prev.height,
      };
    });
  }, [getAllBBoxes]);

  // ── Smart spawn ───────────────────────────────────────────────────────────
  // Priority:
  //   1. Try placing right of the globally last-placed item (any type)
  //   2. If no last item, centre of visible viewport
  //   3. resolveCollision nudges the candidate until it is clear of everything
  // All x values are clamped inside [SPAWN_MIN_X, SPAWN_MAX_X] so no item can
  // slide under the AI chat panel on the left or the tool sidebar on the right.
  const getSpawnPosition = useCallback((
    width: number, height: number,
  ): { x: number; y: number } => {
    const minX = SPAWN_MIN_X();
    const maxX = SPAWN_MAX_X(width);
    let x: number, y: number;

    if (lastPlacedRef.current) {
      const last = lastPlacedRef.current;
      x = last.x + last.width + SPAWN_OFFSET;
      y = last.y;
      // If placing to the right would exceed the safe right edge, wrap to a new row
      if (x > maxX) {
        x = minX;
        y = last.y + last.height + SPAWN_OFFSET;
      }
    } else {
      // Very first element — centre in the visible viewport, clamped to safe zone
      x = vw() / 2 - width / 2;
      y = vh() / 2 - height / 2;
    }

    // Hard clamp before passing to resolveCollision
    x = Math.max(minX, Math.min(maxX, x));

    // Nudge until the candidate doesn't overlap any existing element
    return resolveCollision({ x, y, width, height }, getAllBBoxes());
  }, [stageSize.width, getAllBBoxes]);

  // ── AI drop sink ─────────────────────────────────────────────────────────
  // chatModule.tsx has always dispatched "ai-element-drop" (drag/tap) and set
  // "application/json" on native HTML5 drags, but nothing here ever listened
  // for either — so dropping an AI response silently did nothing. This wires
  // both paths into the same converter, reusing the exact node/text shapes
  // the toolbar buttons above already create.
  const spawnAIElement = useCallback((element: DraggableAIElement, dropX: number, dropY: number) => {
    if (!element || element.type !== "ai_element") return;

    const NODE_W = 150, NODE_H = 70, GAP_X = 60, GAP_Y = 50, COLS = 3;

    if (element.elementType === "diagram" || element.elementType === "mindmap") {
      const nodes = element.structure.nodes ?? [];
      if (!nodes.length) return;

      const cols = Math.min(COLS, nodes.length);
      const rows = Math.ceil(nodes.length / cols);
      const totalW = cols * NODE_W + (cols - 1) * GAP_X;
      const totalH = rows * NODE_H + (rows - 1) * GAP_Y;
      const anchor = (dropX || dropY)
        ? { x: dropX - totalW / 2, y: dropY - totalH / 2 }
        : getSpawnPosition(totalW, totalH);

      const idMap: Record<string, string> = {};
      const newNodes: FlowNodeType[] = nodes.map((n, i) => {
        const id = uuid();
        idMap[n.id] = id;
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          id, shape: "rect",
          x: anchor.x + col * (NODE_W + GAP_X),
          y: anchor.y + row * (NODE_H + GAP_Y),
          width: NODE_W, height: NODE_H,
          rotation: 0, text: n.label, comments: [],
        };
      });

      const newEdges: FlowEdgeType[] = (element.structure.connections ?? [])
        .filter((c) => idMap[c.from] && idMap[c.to])
        .map((c) => ({ id: uuid(), from: idMap[c.from], to: idMap[c.to], bidirectional: false }));

      setFlowNodes((prev) => [...prev, ...newNodes]);
      setConnections((prev) => [...prev, ...newEdges]);
      lastPlacedRef.current = { x: anchor.x, y: anchor.y, width: totalW, height: totalH };
      return;
    }

    // text / list / heading — drop as a single text card
    const bodyText = element.structure.hierarchy
      ? element.structure.hierarchy.map((h) => (h.type === "bullet" ? `• ${h.text}` : h.text)).join("\n")
      : element.rawText;

    const W = 260, H = Math.max(60, Math.min(400, bodyText.split("\n").length * 24 + 24));
    const pos = (dropX || dropY) ? { x: dropX - W / 2, y: dropY - H / 2 } : getSpawnPosition(W, H);

    const newText: TextCardType = {
      id: uuid(), ...pos, text: bodyText, fontSize: 16,
      color: "#000000", fontWeight: "normal", fontStyle: "normal",
      width: W, height: H,
    };
    setTextCards((prev) => [...prev, newText]);
    lastPlacedRef.current = { x: pos.x, y: pos.y, width: W, height: H };
  }, [getSpawnPosition, setFlowNodes, setConnections, setTextCards]);

  // Tap-to-canvas fallback (touch/keyboard) — chatModule dispatches this directly.
  useEffect(() => {
    const onAIDrop = (e: Event) => {
      const detail = (e as CustomEvent<{ element: DraggableAIElement; dropX: number; dropY: number }>).detail;
      if (!detail) return;
      spawnAIElement(detail.element, detail.dropX, detail.dropY);
    };
    window.addEventListener("ai-element-drop", onAIDrop);
    return () => window.removeEventListener("ai-element-drop", onAIDrop);
  }, [spawnAIElement]);

  // Native HTML5 drag from the chat panel — needs an explicit drop zone.
  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    let element: DraggableAIElement;
    try { element = JSON.parse(raw); } catch { return; }

    const container = scrollRef.current;
    const dropX = container
      ? e.clientX - container.getBoundingClientRect().left + container.scrollLeft
      : 0;
    const dropY = container
      ? e.clientY - container.getBoundingClientRect().top + container.scrollTop
      : 0;

    spawnAIElement(element, dropX, dropY);
  }, [spawnAIElement]);

  // ── Tool activation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeTool) return;
    if (activeTool === prevToolRef.current) return;
    prevToolRef.current = activeTool;

    if (activeTool === "comments") { setCommentMode(true); return; }
    if (["summarize", "pin", "flowchart", "shapes", "connector"].includes(activeTool)) return;

    if (activeTool === "notes") {
      const W = 280, H = 160;
      const pos = getSpawnPosition(W, H);
      const newNote: NoteType = { id: uuid(), ...pos, width: W, height: H, text: "", fill: "#FFEB3B" };
      setNotes((prev) => [...prev, newNote]);
      lastPlacedRef.current = { x: pos.x, y: pos.y, width: W, height: H };
      setSelectedId(newNote.id);
      setSelectedType("note");
      prevToolRef.current = null;
      return;
    }

    if (activeTool === "text") {
      const W = 200, H = 40;
      const pos = getSpawnPosition(W, H);
      const newText: TextCardType = {
        id: uuid(), ...pos, text: "", fontSize: 18,
        color: "#000000", fontWeight: "normal", fontStyle: "normal",
      };
      setTextCards((prev) => [...prev, newText]);
      lastPlacedRef.current = { x: pos.x, y: pos.y, width: W, height: H };
      setSelectedId(newText.id);
      setSelectedType("text");
      setEditingId(newText.id);
      setTempText("");
      return;
    }

    if (activeTool === "image") {
      const W = 240, H = 160;
      const pos = getSpawnPosition(W, H);
      const nextZ = imageCards.length > 0 ? Math.max(...imageCards.map((c) => c.zIndex)) + 1 : 0;
      const newImage: ImageCard = { id: uuid(), ...pos, width: W, height: H, src: "", zIndex: nextZ };
      setImageCards((prev) => [...prev, newImage]);
      lastPlacedRef.current = { x: pos.x, y: pos.y, width: W, height: H };
      setSelectedId(newImage.id);
      setSelectedType("image");
      prevToolRef.current = null;
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // ── Comment helpers ───────────────────────────────────────────────────────
  const handleCommentClick = (targetId: string) => {
    setCommentThreads((prev) => {
      const existing = prev.find((t) => t.targetId === targetId);
      if (existing) { setActiveThreadId(existing.id); return prev; }
      const newId = uuid();
      setActiveThreadId(newId);
      return [...prev, { id: newId, targetId, comments: [] }];
    });
    if (commentMode) { setCommentMode(false); prevToolRef.current = null; }
  };

  const handleCommentAttached = () => { setCommentMode(false); prevToolRef.current = null; };

  const getCommentCount = (targetId: string) =>
    commentThreads.find((t) => t.targetId === targetId)?.comments.length ?? 0;

  // ── Flowchart shape ───────────────────────────────────────────────────────
  const addFlowShape = (shapeType: "rect" | "circle" | "diamond" | "parallelogram") => {
    const W = 120, H = 70;
    const pos = getSpawnPosition(W, H);
    const newNode: FlowNodeType = {
      id: uuid(), shape: shapeType, ...pos,
      width: W, height: H, text: "New Step", rotation: 0, comments: [],
    };
    setFlowNodes((prev) => [...prev, newNode]);
    lastPlacedRef.current = { x: pos.x, y: pos.y, width: W, height: H };
    setSelectedId(newNode.id);
    setSelectedType("flowchart");
    setEditingId(null);
  };

  const handleStageClick = (e: any) => {
    if (e.target !== e.target.getStage()) return;
    setSelectedId(null); setSelectedType(null);
    setEditingId(null); setConnectionStartId(null);
  };

  // ── Copy ─────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    if (selectedType === "flowchart") {
      const node = flowNodes.find((n) => n.id === selectedId); if (!node) return;
      const pos = resolveCollision({ x: node.x + SPAWN_OFFSET, y: node.y + SPAWN_OFFSET, width: node.width, height: node.height }, getAllBBoxes());
      setFlowNodes((prev) => { const n = { ...node, id: uuid(), ...pos }; setSelectedId(n.id); lastPlacedRef.current = { ...pos, width: node.width, height: node.height }; return [...prev, n]; });
    } else if (selectedType === "text") {
      const t = textCards.find((c) => c.id === selectedId); if (!t) return;
      const pos = resolveCollision({ x: t.x + SPAWN_OFFSET, y: t.y + SPAWN_OFFSET, width: t.width ?? 200, height: (t as any).height ?? 40 }, getAllBBoxes());
      setTextCards((prev) => { const n = { ...t, id: uuid(), ...pos }; setSelectedId(n.id); lastPlacedRef.current = { ...pos, width: t.width ?? 200, height: (t as any).height ?? 40 }; return [...prev, n]; });
    } else if (selectedType === "note") {
      const note = notes.find((n) => n.id === selectedId); if (!note) return;
      const pos = resolveCollision({ x: note.x + SPAWN_OFFSET, y: note.y + SPAWN_OFFSET, width: note.width, height: note.height }, getAllBBoxes());
      setNotes((prev) => { const n: NoteType = { ...note, id: uuid(), ...pos }; setSelectedId(n.id); lastPlacedRef.current = { ...pos, width: note.width, height: note.height }; return [...prev, n]; });
    } else if (selectedType === "image") {
      const img = imageCards.find((c) => c.id === selectedId); if (!img) return;
      const maxZ = Math.max(...imageCards.map((c) => c.zIndex), 0);
      const pos = resolveCollision({ x: img.x + SPAWN_OFFSET, y: img.y + SPAWN_OFFSET, width: img.width, height: img.height }, getAllBBoxes());
      setImageCards((prev) => { const n = { ...img, id: uuid(), ...pos, zIndex: maxZ + 1 }; setSelectedId(n.id); lastPlacedRef.current = { ...pos, width: img.width, height: img.height }; return [...prev, n]; });
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (selectedType === "text") setTextCards((prev) => prev.filter((t) => t.id !== selectedId));
    else if (selectedType === "flowchart") {
      setFlowNodes((prev) => prev.filter((n) => n.id !== selectedId));
      setConnections((prev) => prev.filter((c) => c.from !== selectedId && c.to !== selectedId));
    } else if (selectedType === "note") setNotes((prev) => prev.filter((n) => n.id !== selectedId));
    else if (selectedType === "image") setImageCards((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(null); setSelectedType(null); setEditingId(null);
  };

  // ── FlowNode select ───────────────────────────────────────────────────────
  const handleFlowNodeSelect = (id: string | null) => {
    if (!id) { setSelectedId(null); return; }
    if (commentMode) { handleCommentClick(id); return; }
    if (activeSubTool === "connector") {
      if (!connectionStartId) { setConnectionStartId(id); }
      else if (connectionStartId !== id) {
        setConnections((prev) => [...prev, { id: uuid(), from: connectionStartId, to: id, bidirectional: false }]);
        setConnectionStartId(null);
      }
      return;
    }
    setSelectedId(id); setSelectedType("flowchart");
  };

  const activeFlowEditNode = flowNodes.find((n) => n.id === editingId) ?? null;
  const selectedImage = selectedType === "image" ? imageCards.find((c) => c.id === selectedId) ?? null : null;
 const handleExport = (): Promise<void> => {
  return new Promise((resolve) => {
    const stage = stageRef.current;
    if (!stage) { resolve(); return; }

    const boxes = getAllBBoxes();
    let cropX = 0, cropY = 0, cropW = window.innerWidth, cropH = window.innerHeight;

    if (boxes.length > 0) {
      const minX = Math.max(0, Math.min(...boxes.map(b => b.x)) - 40);
      const minY = Math.max(0, Math.min(...boxes.map(b => b.y)) - 40);
      const maxX = Math.max(...boxes.map(b => b.x + b.width)) + 40;
      const maxY = Math.max(...boxes.map(b => b.y + b.height)) + 40;
      cropX = minX; cropY = minY;
      cropW = maxX - minX; cropH = maxY - minY;
    }

    const dataURL = stage.toDataURL({
      pixelRatio: 1.5,
      x: cropX, y: cropY,
      width: cropW, height: cropH,
    });

    const pdf = new jsPDF({
      orientation: cropW > cropH ? "landscape" : "portrait",
      unit: "px",
      format: [cropW, cropH],
    });

    pdf.addImage(dataURL, "PNG", 0, 0, cropW, cropH);
    pdf.save(`aetherflow-board-${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.pdf`);
    resolve();
  });
};

 
  return (
    //this part is for export funtion,
    
    <div
    ref={scrollRef}
    onDragOver={handleCanvasDragOver}
    onDrop={handleCanvasDrop}
    style={{
      width: "100%",
      height: "100%",
      overflow: "auto",
      background: "#f5f5f5",
    }}
  >
    {/* ── Export Button ── */}
    <div style={{
      position: "sticky",
      top: 16,
      marginLeft: "auto",
      width: "fit-content",
      paddingRight: 16,
      zIndex: 3000,
      pointerEvents: "none",
    }}>
      <div style={{ pointerEvents: "auto" }}>
        <ExportButton onClick={handleExport} />
      </div>
    </div>

    {/* ── Canvas content ── */}
    <div style={{ width: stageSize.width, height: stageSize.height, position: "relative" }}>
  
         <Stage
          ref={stageRef}
          style={{ cursor: commentMode ? "crosshair" : "default", display: "block" }}
          width={stageSize.width} height={stageSize.height}
          onClick={handleStageClick}
          onDragStart={startAutoScroll} onDragEnd={stopAutoScroll}
        >
          <Layer>
            <ImageModule
              imageCards={imageCards} setImageCards={setImageCards}
              selectedId={selectedId}
              setSelectedId={(id) => { setSelectedId(id); setSelectedType("image"); }}
              commentThreads={commentThreads}
              handleCommentClick={handleCommentClick}
              activeTool={activeTool ?? ""} commentMode={commentMode}
            />

            {notes.map((n) => (
              <Note
                key={n.id} note={n}
                isSelected={selectedId === n.id}
                isEditing={editingId === n.id}
                onSelect={() => {
                  if (commentMode) { handleCommentClick(n.id); return; }
                  setSelectedId(n.id); setSelectedType("note");
                }}
                onEdit={() => { setEditingId(n.id); setSelectedType("note"); }}
                onFinishEdit={() => setEditingId(null)}
                onChange={(updated) => setNotes((prev) => prev.map((nt) => nt.id === updated.id ? updated : nt))}
                commentCount={getCommentCount(n.id)}
                onCommentClick={() => handleCommentClick(n.id)}
              />
            ))}

            <FlowNodes
              nodes={flowNodes} lines={connections}
              setNodes={setFlowNodes} setLines={setConnections}
              selectedId={selectedId} editingId={editingId}
              setActiveThreadId={setActiveThreadId}
              setSelectedId={handleFlowNodeSelect}
              activeSubTool={activeSubTool}
              connectionStartId={connectionStartId}
              setConnectionStartId={setConnectionStartId}
              onAddShape={addFlowShape}
              commentThreads={commentThreads} setCommentThreads={setCommentThreads}
              onNodeDblClick={(id, text) => { setEditingId(id); setTempText(text); setSelectedType("flowchart"); }}
              handleCommentClick={handleCommentClick}
              activeTool={activeTool ?? ""}
            />

            <TextModule
              textCards={textCards} setTextCards={setTextCards}
              selectedId={selectedId}
              setSelectedId={(id) => { setSelectedId(id); setSelectedType("text"); }}
              editingId={editingId} setEditingId={setEditingId}
              tempText={tempText} setTempText={setTempText}
              commentThreads={commentThreads}
              handleElementClickForComment={handleCommentClick}
              activeTool={activeTool ?? ""} stageRef={stageRef}
            />
          </Layer>
        </Stage>

        {/* ── Overlay UI ── */}
        {selectedImage && (
          <ImageBottomBar
            card={selectedImage} allCards={imageCards}
            onUpdate={(updated) => setImageCards((prev) => prev.map((c) => c.id === updated.id ? updated : c))}
            onCopy={handleCopy} onDelete={handleDelete}
            onComment={() => handleCommentClick(selectedImage.id)}
          />
        )}

        {selectedId && (selectedType === "note" || selectedType === "text") && (
          <BottomToolbar
            activeType={selectedType as "note" | "text"}
            element={
              selectedType === "note"
                ? notes.find((n) => n.id === selectedId)
                : textCards.find((t) => t.id === selectedId)
            }
            onUpdate={(updated: any) => {
              if (selectedType === "note") setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
              else setTextCards((prev) => prev.map((t) => t.id === updated.id ? updated : t));
            }}
            onDelete={handleDelete} onCopy={handleCopy}
          />
        )}

        {(selectedType === "flowchart" || activeTool === "flowchart" || activeTool === "shapes") && (
          <FlowchartToolbar
            onAddShape={addFlowShape} onCopy={handleCopy} onDelete={handleDelete}
            activeSubTool={activeSubTool} setActiveSubTool={setActiveSubTool}
          />
        )}

        {editingId && activeFlowEditNode && (
          <textarea
            autoFocus value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={() => {
              const node = flowNodes.find((n) => n.id === editingId);
              if (node) {
                const { width, height } = getDynamicSize(tempText, node.shape);
                setFlowNodes((prev) => prev.map((n) => n.id === editingId ? { ...n, text: tempText, width, height } : n));
              }
              setEditingId(null); setTempText("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) e.currentTarget.blur();
              if (e.key === "Escape") { setEditingId(null); setTempText(""); }
            }}
            style={{
              position: "absolute",
              top: activeFlowEditNode.y, left: activeFlowEditNode.x,
              width: activeFlowEditNode.width || 140, height: activeFlowEditNode.height || 70,
              background: "rgba(255,255,255,0.9)", border: "1px dashed #4A90E2",
              outline: "none", padding: "10px", resize: "none", textAlign: "center",
              fontFamily: "sans-serif", fontSize: "14px", zIndex: 2000,
              overflow: "hidden", boxSizing: "border-box",
            }}
          />
        )}
         <CommentModule
  activeThreadId={activeThreadId}
  commentThreads={commentThreads}
  setCommentThreads={setCommentThreads}
  setActiveThreadId={setActiveThreadId}
  currentUser={currentUser}
  currentUserId={currentUserId ?? ""}
  activeTool={activeTool ?? ""}
  onCommentAttached={handleCommentAttached}
  othersOnline={(presence ?? []).some(p => p.userId !== currentUserId)}
  typingUsers={activeThreadId ? (typingUsers?.[activeThreadId] ?? []) : []}
  onTyping={() => activeThreadId && emitCommentTyping?.(activeThreadId)}
  onStopTyping={() => activeThreadId && emitCommentStopTyping?.(activeThreadId)}
  // ...existing props from the last fix
  onCommentRead={(commentId: string) => activeThreadId && emitCommentRead?.(activeThreadId, commentId)}

/>
    {  /*  <CommentModule
          activeThreadId={activeThreadId} commentThreads={commentThreads}
          setCommentThreads={setCommentThreads} setActiveThreadId={setActiveThreadId}
          currentUser={currentUser} activeTool={activeTool ?? ""}
          onCommentAttached={handleCommentAttached} currentUserId={""}        />*/}
      </div>
    </div>
  );
}
function ExportButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
 const handleClick = async () => {
  setExporting(true);
  try {
  await onClick();
  } finally {
    setTimeout(() => setExporting(false), 800);
  }
};
 

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={exporting}
      title="Export board as PDF"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 16px 8px 12px",
        background: hovered ? "#0a2a5e" : "#00112e",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 12,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: exporting ? "default" : "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        transition: "all 0.18s ease",
        transform: hovered && !exporting ? "scale(1.04)" : "scale(1)",
        opacity: exporting ? 0.7 : 1,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <MdDownload size={18} color={exporting ? "#9ab" : "#7eb3ff"} />
      {exporting ? "Exporting…" : "Export PDF"}
    </button>
  );
}



import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import LeftSidebar, { type Tool, ICON_LIBRARY } from "./LeftSideBar";
import CardEditor from "./CardEditior";
import BottomBar, { type CanvasElement, type SelectionType } from "./ButtomBar";
import logoSvg from "../../../assets/logo.svg";
//import logoSvg from " assets/logo.svg";

import NavbarElement, {
     DEFAULT_NAVBAR_CFG,
     type NavbarConfig,
} from "./NavbarElement";

type ElementType =
     | "rect" | "circle" | "ellipse" | "square" | "diamond" | "line" | "text"
     | "sketch" | "checkbox" | "slider" | "card" | "progress" | "icon" | "image"
     | "imagebox" | "navbar";

interface AIMessage { role: "user" | "assistant"; content: string; }

const NAVY = "#0f1f3d";
const NAVY2 = "#162847";
const NAVY3 = "#1e3a5f";
const ACCENT = "#3b82f6";
const WHITE = "#ffffff";
const GRAY = "#e2e8f0";
const GRAY2 = "#94a3b8";

const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const renderIconPaths = (iconName: string) => {
     const entry = ICON_LIBRARY[iconName];
     if (entry) return entry.paths.map((d, i) => <path key={i} d={d} />);
     return <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
};

export interface CarouselSlide {
     id: string;
     type: "image" | "video" | "color";
     src: string;
     color: string;
     title: string;
     caption: string;
     objectFit: "cover" | "contain" | "fill" | "none";
     objectPositionX: number;
     objectPositionY: number;
     mediaScale: number;
}

const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
     { id: "s1", type: "color", src: "", color: "#1e3a5f", title: "Slide One", caption: "Add an image or video to this slide", objectFit: "cover", objectPositionX: 50, objectPositionY: 50, mediaScale: 1 },
     { id: "s2", type: "color", src: "", color: "#3b1f5f", title: "Slide Two", caption: "Double-click the slider to edit slides", objectFit: "cover", objectPositionX: 50, objectPositionY: 50, mediaScale: 1 },
     { id: "s3", type: "color", src: "", color: "#1f4a3b", title: "Slide Three", caption: "Supports images and video URLs", objectFit: "cover", objectPositionX: 50, objectPositionY: 50, mediaScale: 1 },
];

interface TextEditState {
     id: string;
     x: number;
     y: number;
     width: number;
     height: number;
     fontSize: number;
     fontFamily: string;
     fontWeight: string;
     fontStyle: string;
     fill: string;
     text: string;
}

// ─── FIX 5: Checkbox sub-renderers ───────────────────────────────────────────
// Each renderer returns SVG content for the given selectionType.
// All share: el (canvas element), isEditingThis (label edit mode), handlers.

function renderCheckboxControl(el: any, onToggle: () => void) {
     const sType: SelectionType = el.selectionType || "checkbox";
     const checked = !!el.checked;
     const accentColor = el.fill || ACCENT;

     if (sType === "checkbox" || sType === "checkbox-round") {
          const rx = sType === "checkbox-round" ? 9 : 3;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <rect
                         x={0} y={0} width={18} height={18} rx={rx}
                         fill={checked ? accentColor : "transparent"}
                         stroke={checked ? accentColor : (el.stroke || "#555")}
                         strokeWidth={el.strokeWidth || 1.5}
                    />
                    {checked && (
                         <path d="M3 9l4 4L15 5" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
               </g>
          );
     }

     if (sType === "radio") {
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <circle cx={9} cy={9} r={8}
                         fill="transparent"
                         stroke={checked ? accentColor : (el.stroke || "#555")}
                         strokeWidth={el.strokeWidth || 1.5}
                    />
                    {checked && (
                         <circle cx={9} cy={9} r={4} fill={accentColor} />
                    )}
               </g>
          );
     }

     if (sType === "toggle") {
          const trackW = 36;
          const trackH = 20;
          const knobSize = 14;
          const knobX = checked ? trackW - knobSize - 3 : 3;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    {/* Track */}
                    <rect
                         x={0} y={0} width={trackW} height={trackH} rx={trackH / 2}
                         fill={checked ? accentColor : (el.stroke || "#94a3b8")}
                         stroke="none"
                    />
                    {/* Knob */}
                    <rect
                         x={knobX} y={3} width={knobSize} height={knobSize} rx={knobSize / 2}
                         fill="white"
                         stroke="none"
                    />
               </g>
          );
     }

     if (sType === "dropdown") {
          const boxW = Math.max(el.width - 4, 80);
          const boxH = 26;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <rect x={0} y={0} width={boxW} height={boxH} rx={6}
                         fill="transparent"
                         stroke={el.stroke || "#555"}
                         strokeWidth={el.strokeWidth || 1.5}
                    />
                    <text x={10} y={17} fontSize={12} fontFamily="DM Sans" fill={NAVY2}>
                         {el.checked ? (el.text || "Option") : "Select…"}
                    </text>
                    {/* chevron */}
                    <path
                         d={`M${boxW - 18} 10 L${boxW - 12} 16 L${boxW - 6} 10`}
                         fill="none" stroke={GRAY2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                    />
                    {/* Dropdown open state */}
                    {el.checked && (
                         <g>
                              <rect x={0} y={boxH + 2} width={boxW} height={24} rx={5}
                                   fill={WHITE} stroke={el.stroke || "#e2e8f0"} strokeWidth={1} />
                              <text x={10} y={boxH + 17} fontSize={11} fontFamily="DM Sans" fill={NAVY2}>
                                   {el.text || "Option"}
                              </text>
                         </g>
                    )}
               </g>
          );
     }

     return null;
}

// Returns the control width so the label can be offset correctly
function getControlWidth(el: any): number {
     const sType: SelectionType = el.selectionType || "checkbox";
     if (sType === "toggle") return 42;
     if (sType === "dropdown") return Math.max(el.width - 4, 80) + 4;
     return 24; // checkbox / radio
}

//export default function DesignPhase() {
// ── New props added for board sync ───────────────────────────────────────────
// projectId       — passed from board.tsx, used for future API calls if needed
// initialElements — loaded from DB by useBoardSync, replaces empty []
// onElementsChange — called whenever elements change, triggers syncPatch in board.tsx
interface DesignPhaseProps {
     onBack?:           () => void;
     projectId?:        string;
     initialElements?:  CanvasElement[];
     onElementsChange?: (updater: React.SetStateAction<CanvasElement[]>) => void;
     currentUser?:      string
}

export default function DesignPhase({ onBack, projectId, initialElements, onElementsChange,currentUser = "U", }: DesignPhaseProps){

     const [fullscreen, setFullscreen] = useState(false);
     const [activeTool, setActiveTool] = useState<Tool>("select");
     // ── CHANGE: initialise from prop if provided (loaded from DB) ──────────
     const [elements, setElements] = useState<CanvasElement[]>(initialElements ?? []);
     const [selected, setSelected] = useState<string[]>([]);
     const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
     const [drawing, setDrawing] = useState(false);
     const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
     const [currentSketch, setCurrentSketch] = useState<{ x: number; y: number }[]>([]);
     const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
     const [showAI, setShowAI] = useState(true);
     const [aiTab, setAiTab] = useState<"layout" | "generate" | "components">("layout");
     const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
     const [aiInput, setAiInput] = useState("");
     const [aiLoading, setAiLoading] = useState(false);
     const [zoom, setZoom] = useState(1);
     const [pan, setPan] = useState({ x: 0, y: 0 });
     const [isPanning, setIsPanning] = useState(false);

     // ── CHANGE: when board data loads from DB after mount, hydrate elements ─
     // useBoardSync fetches async — initialElements may arrive after first render
     useEffect(() => {
          if (initialElements && initialElements.length > 0) {
               setElements(initialElements);
               setHistory([initialElements]);
               setHistoryIndex(0);
          }
     }, [initialElements]);
     const [panStart, setPanStart] = useState({ x: 0, y: 0 });
     const [shiftHeld, setShiftHeld] = useState(false);
     const [editingCardId, setEditingCardId] = useState<string | null>(null);
     const [editingSliderEl, setEditingSliderEl] = useState<any | null>(null);

     const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
     const textareaRef = useRef<HTMLTextAreaElement>(null);

     const [checkboxEdit, setCheckboxEdit] = useState<{ id: string } | null>(null);

     const [history, setHistory] = useState<CanvasElement[][]>([[]]);
     const [historyIndex, setHistoryIndex] = useState(0);
     const isUndoAvailable = historyIndex > 0;
     const isRedoAvailable = historyIndex < history.length - 1;

     const pushHistory = (newElements: CanvasElement[]) => {
          setHistory(prev => {
               const trimmed = prev.slice(0, historyIndex + 1);
               return [...trimmed, newElements].slice(-50);
          });
          setHistoryIndex(prev => Math.min(prev + 1, 49));
          // ── CHANGE: notify board.tsx so it can syncPatch + autosave ────────
          onElementsChange?.(newElements);
     };

     const undo = () => {
          if (!isUndoAvailable) return;
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          setElements(history[newIdx]);
          setSelected([]);
     };

     const redo = () => {
          if (!isRedoAvailable) return;
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          setElements(history[newIdx]);
          setSelected([]);
     };

     const [resizing, setResizing] = useState<{
          id: string; handle: string;
          startX: number; startY: number;
          origX: number; origY: number;
          origW: number; origH: number;
          aspectRatio: number;
     } | null>(null);

     const [rotating, setRotating] = useState<{
          id: string; cx: number; cy: number;
          startAngle: number; origRotation: number;
     } | null>(null);

     const canvasRef = useRef<SVGSVGElement>(null);
     const aiChatRef = useRef<HTMLDivElement>(null);

     const selectedEl = elements.find(e => selected.length === 1 && e.id === selected[0]) ?? null;
     const bottomBarVisible = selected.length > 0;

     useEffect(() => {
          if (textEdit && textareaRef.current) {
               textareaRef.current.focus();
               textareaRef.current.select();
          }
     }, [textEdit?.id]);

     useEffect(() => {
          if (aiChatRef.current) aiChatRef.current.scrollTop = aiChatRef.current.scrollHeight;
     }, [aiMessages]);

     useEffect(() => {
          const down = (e: KeyboardEvent) => {
               if (e.key === "Shift") setShiftHeld(true);
               if (textEdit) {
                    if (e.key === "Escape") commitTextEdit();
                    return;
               }
               if (checkboxEdit && e.key === "Escape") { setCheckboxEdit(null); return; }
               if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
                    const tag = (e.target as HTMLElement).tagName;
                    if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
                         e.preventDefault(); undo(); return;
                    }
               }
               if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                    const tag = (e.target as HTMLElement).tagName;
                    if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
                         e.preventDefault(); redo(); return;
                    }
               }
               if (e.key === "Escape") {
                    if (editingCardId) { setEditingCardId(null); return; }
                    setSelected([]); setResizing(null); setRotating(null);
               }
               if ((e.key === "Delete" || e.key === "Backspace") && selected.length > 0) {
                    const tag = (e.target as HTMLElement).tagName;
                    if (tag !== "INPUT" && tag !== "TEXTAREA" && !(e.target as HTMLElement).isContentEditable) {
                         setElements(prev => {
                              const next = prev.filter(el => !selected.includes(el.id));
                              pushHistory(next);
                              return next;
                         });
                         setSelected([]);
                    }
               }
          };
          const up = (e: KeyboardEvent) => { if (e.key === "Shift") setShiftHeld(false); };
          window.addEventListener("keydown", down);
          window.addEventListener("keyup", up);
          return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
     }, [editingCardId, selected, historyIndex, history, textEdit, checkboxEdit]);

     const updateElement = (id: string, patch: Partial<CanvasElement>) =>
          setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

     const updateElementWithHistory = (id: string, patch: Partial<CanvasElement>) => {
          setElements(prev => {
               const next = prev.map(e => e.id === id ? { ...e, ...patch } : e);
               pushHistory(next);
               return next;
          });
     };

     const deleteElement = (id: string) => {
          setElements(prev => {
               const next = prev.filter(e => e.id !== id);
               pushHistory(next);
               return next;
          });
          setSelected([]); setResizing(null); setRotating(null);
     };

     const getCanvasPos = (e: React.MouseEvent) => {
          const svg = canvasRef.current;
          if (!svg) return { x: 0, y: 0 };
          const rect = svg.getBoundingClientRect();
          return {
               x: (e.clientX - rect.left - pan.x) / zoom,
               y: (e.clientY - rect.top - pan.y) / zoom,
          };
     };

     const commitTextEdit = useCallback(() => {
          if (!textEdit) return;
          updateElement(textEdit.id, { text: textEdit.text } as any);
          pushHistory(elements.map(e => e.id === textEdit.id ? { ...e, text: textEdit.text } as any : e));
          setTextEdit(null);
     }, [textEdit, elements]);

     const openTextEdit = (el: any) => {
          setTextEdit({
               id: el.id, x: el.x, y: el.y,
               width: Math.max(el.width, 120), height: Math.max(el.height, 40),
               fontSize: el.fontSize || 20, fontFamily: el.fontFamily || "DM Sans",
               fontWeight: el.fontWeight || "400", fontStyle: el.fontStyle || "normal",
               fill: el.fill || NAVY, text: el.text || "",
          });
     };

     const handleIconPick = (iconName: string) => {
          const el: any = {
               id: uid(), type: "icon",
               x: 200 + Math.random() * 80, y: 180 + Math.random() * 80,
               width: 48, height: 48, rotation: 0,
               fill: NAVY, stroke: "none", strokeWidth: 0, opacity: 1, iconName,
          };
          setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
          setSelected([el.id]);
          setActiveTool("select");
     };

     const handleImageAdd = (src: string) => {
          const el: any = {
               id: uid(), type: "image",
               x: 100 + Math.random() * 80, y: 100 + Math.random() * 80,
               width: 320, height: 220, rotation: 0,
               fill: "#e8edf4", stroke: GRAY, strokeWidth: 1.5, opacity: 1,
               imageUrl: src, borderRadius: 8,
          };
          setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
          setSelected([el.id]);
          setActiveTool("select");
     };

     const handleNavbarCfgChange = (newCfg: NavbarConfig) => {
          if (!selectedEl || (selectedEl as any).type !== "navbar") return;
          updateElement(selectedEl.id, { navbarConfig: newCfg, height: newCfg.height } as any);
     };

     const handleCanvasMouseDown = (e: React.MouseEvent) => {
          if (e.button === 1) {
               setIsPanning(true);
               setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
               return;
          }
          if (textEdit) { commitTextEdit(); return; }
          if (checkboxEdit) setCheckboxEdit(null);
          setContextMenu(null);
          if (editingCardId) setEditingCardId(null);
          setSelected([]); setResizing(null); setRotating(null);
          const pos = getCanvasPos(e);
          if (activeTool === "select") return;
          if (activeTool === "sketch") { setDrawing(true); setCurrentSketch([pos]); return; }
          if (activeTool === "image") return;
          setDrawStart(pos); setDrawing(true);
     };

     const handleSvgMouseMove = (e: React.MouseEvent) => {
          if (isPanning) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
          if (rotating) {
               const pos = getCanvasPos(e);
               const mouseAngle = Math.atan2(pos.y - rotating.cy, pos.x - rotating.cx) * (180 / Math.PI);
               const angleDelta = mouseAngle - rotating.startAngle;
               let newRot = rotating.origRotation + angleDelta;
               if (shiftHeld) newRot = Math.round(newRot / 15) * 15;
               updateElement(rotating.id, { rotation: newRot } as any);
               return;
          }
          if (resizing) {
               const pos = getCanvasPos(e);
               const dx = pos.x - resizing.startX;
               const dy = pos.y - resizing.startY;
               const { handle, origX, origY, origW, origH, aspectRatio } = resizing;
               const MIN = 20;
               let nx = origX, ny = origY, nw = origW, nh = origH;
               if (handle.includes("e")) nw = origW + dx;
               if (handle.includes("s")) nh = origH + dy;
               if (handle.includes("w")) { nw = origW - dx; nx = origX + origW - nw; }
               if (handle.includes("n")) { nh = origH - dy; ny = origY + origH - nh; }
               if (shiftHeld && handle.length === 2) {
                    const wDelta = Math.abs(nw - origW), hDelta = Math.abs(nh - origH);
                    if (wDelta > hDelta) { nh = nw / aspectRatio; if (handle.includes("n")) ny = origY + origH - nh; }
                    else { nw = nh * aspectRatio; if (handle.includes("w")) nx = origX + origW - nw; }
               }
               if (nw < MIN) { nw = MIN; if (handle.includes("w")) nx = origX + origW - MIN; }
               if (nh < MIN) { nh = MIN; if (handle.includes("n")) ny = origY + origH - MIN; }
               updateElement(resizing.id, { x: nx, y: ny, width: nw, height: nh } as any);
               return;
          }
          if (dragging) {
               const pos = getCanvasPos(e);
               updateElement(dragging.id, { x: pos.x - dragging.ox, y: pos.y - dragging.oy } as any);
               return;
          }
          if (!drawing) return;
          if (activeTool === "sketch") setCurrentSketch(prev => [...prev, getCanvasPos(e)]);
     };

     const handleSvgMouseUp = (e: React.MouseEvent) => {
          const wasDragging = !!dragging;
          const wasResizing = !!resizing;
          const wasRotating = !!rotating;
          setIsPanning(false); setResizing(null); setRotating(null); setDragging(null);
          if (wasDragging || wasResizing || wasRotating) {
               setElements(prev => { pushHistory(prev); return prev; });
          }
          if (!drawing) return;
          const pos = getCanvasPos(e);
          if (activeTool === "sketch" && currentSketch.length > 1) {
               const el: any = {
                    id: uid(), type: "sketch",
                    x: Math.min(...currentSketch.map(p => p.x)),
                    y: Math.min(...currentSketch.map(p => p.y)),
                    width: 0, height: 0, rotation: 0,
                    fill: "none", stroke: NAVY, strokeWidth: 2, opacity: 1,
                    sketchPoints: [currentSketch],
               };
               setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
               setCurrentSketch([]);
          } else if (drawStart && activeTool !== "sketch" && activeTool !== "select" && activeTool !== "image") {
               const w = Math.max(Math.abs(pos.x - drawStart.x), 40);
               const h = Math.max(Math.abs(pos.y - drawStart.y), 30);
               const x = Math.min(pos.x, drawStart.x);
               const y = Math.min(pos.y, drawStart.y);

               const extras: Record<string, Partial<CanvasElement>> = {
                    text: { text: "Text here", fontSize: 20, fontFamily: "DM Sans", fontWeight: "400", fill: NAVY, stroke: "none" } as any,
                    // FIX 5: checkbox gets a default selectionType of "checkbox"
                    checkbox: { text: "Option", checked: false, fill: "transparent", stroke: "#555", strokeWidth: 1.5, selectionType: "checkbox" } as any,
                    slider: {
                         sliderValue: 0, fill: ACCENT,
                         carouselSlides: DEFAULT_CAROUSEL_SLIDES.map(s => ({ ...s })),
                    } as any,
                    card: { fill: WHITE, stroke: GRAY, strokeWidth: 1, borderRadius: 12, shadow: true, cardTitle: "Card Title", cardBody: "Add a description here. Double-click to edit." } as any,
                    progress: { progressValue: 60, fill: ACCENT } as any,
                    icon: { iconName: "home", fill: NAVY, stroke: "none" } as any,
                    circle: { fill: "#ef4444" },
                    ellipse: { fill: ACCENT },
                    square: { fill: ACCENT },
                    diamond: { fill: "#a855f7" },
                    line: { fill: "none", stroke: NAVY, strokeWidth: 2 },
                    imagebox: { fill: "#dde6f0", stroke: "#b0c4d8", strokeWidth: 1.5, imageUrl: "" } as any,
               };

               const newEl: any = {
                    id: uid(), type: activeTool as ElementType,
                    x, y, width: w, height: h, rotation: 0,
                    fill: ACCENT, stroke: "none", strokeWidth: 1, opacity: 1,
                    ...(extras[activeTool] ?? {}),
               };
               setElements(prev => { const next = [...prev, newEl]; pushHistory(next); return next; });
               setSelected([newEl.id]);
          }
          setDrawing(false); setDrawStart(null); setActiveTool("select");
     };

     const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
          e.stopPropagation();
          if (resizing) return;
          if (textEdit && textEdit.id !== id) commitTextEdit();
          if (checkboxEdit && checkboxEdit.id !== id) setCheckboxEdit(null);
          if (editingCardId && editingCardId !== id) setEditingCardId(null);
          if (editingCardId === id) return;
          const el = elements.find(el => el.id === id) as any;
          if (!el || el.locked) return;
          const pos = getCanvasPos(e);
          setSelected([id]);
          setDragging({ id, ox: pos.x - el.x, oy: pos.y - el.y });
     };

     const handleElementDoubleClick = (e: React.MouseEvent, id: string) => {
          e.stopPropagation();
          const el = elements.find(el => el.id === id) as any;
          if (!el) return;
          if (el.type === "card") {
               setEditingCardId(id); setSelected([id]); setDragging(null); return;
          }
          if (el.type === "text") {
               setDragging(null); setSelected([id]); openTextEdit(el); return;
          }
          // FIX 3 + FIX 5: checkbox label editing works for all selectionTypes
          if (el.type === "checkbox") {
               setDragging(null); setSelected([id]); setCheckboxEdit({ id }); return;
          }
          if (el.type === "slider") {
               setEditingSliderEl({ ...el }); setSelected([id]); setDragging(null);
          }
     };

     const handleSliderTabClick = (elId: string, tabIndex: number) => {
          const el = elements.find(e => e.id === elId) as any;
          if (!el) return;
          const slides: CarouselSlide[] = el.carouselSlides || DEFAULT_CAROUSEL_SLIDES;
          const safeIdx = ((tabIndex % slides.length) + slides.length) % slides.length;
          updateElement(elId, { sliderValue: safeIdx } as any);
     };

     const handleElementRightClick = (e: React.MouseEvent, id: string) => {
          e.preventDefault(); e.stopPropagation();
          setSelected([id]);
          setContextMenu({ x: e.clientX, y: e.clientY, id });
     };

     const contextAction = (action: string) => {
          if (!contextMenu) return;
          const { id } = contextMenu;
          if (action === "delete") deleteElement(id);
          if (action === "duplicate") {
               const el = elements.find(e => e.id === id) as any;
               if (el) {
                    const copy = { ...el, id: uid(), x: el.x + 20, y: el.y + 20 };
                    setElements(prev => { const next = [...prev, copy]; pushHistory(next); return next; });
                    setSelected([copy.id]);
               }
          }
          if (action === "lock") updateElement(id, { locked: !(elements.find(e => e.id === id) as any)?.locked } as any);
          if (action === "bringFront") updateElement(id, { zIndex: 999 } as any);
          if (action === "sendBack") updateElement(id, { zIndex: -1 } as any);
          setContextMenu(null);
     };

     const sendAIMessage = async () => {
          if (!aiInput.trim() || aiLoading) return;
          const userMsg = aiInput.trim();
          setAiInput("");
          setAiMessages(prev => [...prev, { role: "user", content: userMsg }]);
          setAiLoading(true);
          try {
               const tabLabel = { layout: "layout suggestions", generate: "generating UI from natural language", components: "component & color advice" }[aiTab];
               const res = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                         model: "claude-sonnet-4-20250514", max_tokens: 1000,
                         system: `You are an AI design assistant in a UI/UX canvas tool. Canvas has ${elements.length} elements. Help with: ${tabLabel}. Be concise and practical.`,
                         messages: [...aiMessages.map(m => ({ role: m.role, content: m.content })), { role: "user", content: userMsg }],
                    }),
               });
               const data = await res.json();
               const reply = data.content?.map((b: any) => b.text || "").join("") || "No response.";
               setAiMessages(prev => [...prev, { role: "assistant", content: reply }]);
          } catch {
               setAiMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
          }
          setAiLoading(false);
     };

     const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: string) => {
          e.stopPropagation(); e.preventDefault();
          const el = elements.find(el => el.id === id) as any;
          if (!el) return;
          const pos = getCanvasPos(e);
          setDragging(null); setRotating(null);
          setResizing({ id, handle, startX: pos.x, startY: pos.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, aspectRatio: el.width / el.height });
     };

     const handleRotateMouseDown = (e: React.MouseEvent, id: string) => {
          e.stopPropagation(); e.preventDefault();
          const el = elements.find(el => el.id === id) as any;
          if (!el) return;
          const pos = getCanvasPos(e);
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          const startAngle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI);
          setDragging(null); setResizing(null);
          setRotating({ id, cx, cy, startAngle, origRotation: el.rotation || 0 });
     };

     const handleToolSelect = (tool: Tool) => {
          if (tool === "navbar") {
               const canvasWidth = canvasRef.current?.getBoundingClientRect().width ?? 900;
               const navEl: any = {
                    id: uid(), type: "navbar",
                    x: 40, y: 60,
                    width: Math.min(canvasWidth - 80, 860),
                    height: DEFAULT_NAVBAR_CFG.height,
                    rotation: 0, opacity: 1,
                    fill: DEFAULT_NAVBAR_CFG.bg, stroke: "none", strokeWidth: 0,
                    navbarConfig: { ...DEFAULT_NAVBAR_CFG },
               };
               setElements(prev => { const next = [...prev, navEl]; pushHistory(next); return next; });
               setSelected([navEl.id]);
               setActiveTool("select");
               return;
          }
          setActiveTool(tool);
     };

     const HANDLES = [
          { id: "nw", cx: 0, cy: 0, cursor: "nw-resize" },
          { id: "n", cx: 0.5, cy: 0, cursor: "n-resize" },
          { id: "ne", cx: 1, cy: 0, cursor: "ne-resize" },
          { id: "e", cx: 1, cy: 0.5, cursor: "e-resize" },
          { id: "se", cx: 1, cy: 1, cursor: "se-resize" },
          { id: "s", cx: 0.5, cy: 1, cursor: "s-resize" },
          { id: "sw", cx: 0, cy: 1, cursor: "sw-resize" },
          { id: "w", cx: 0, cy: 0.5, cursor: "w-resize" },
     ];

     // ─── Element renderer ─────────────────────────────────────────────────────
     const renderElement = (el: any) => {
          const isResizing = resizing?.id === el.id;
          const isRotating = rotating?.id === el.id;
          const rot = el.rotation || 0;
          const transform = `translate(${el.x}, ${el.y}) rotate(${rot}, ${el.width / 2}, ${el.height / 2})`;
          const filter = el.shadow ? "drop-shadow(0 4px 14px rgba(0,0,0,0.18))" : undefined;
          const gradId = `grad-${el.id}`;
          const fillVal = el.gradient ? `url(#${gradId})` : el.fill;

          const isBeingTextEdited = textEdit?.id === el.id;

          const commonProps = {
               key: el.id,
               onMouseDown: (e: React.MouseEvent) => handleElementMouseDown(e, el.id),
               onDoubleClick: (e: React.MouseEvent) => handleElementDoubleClick(e, el.id),
               onContextMenu: (e: React.MouseEvent) => handleElementRightClick(e, el.id),
               style: {
                    cursor: el.locked ? "not-allowed"
                         : isRotating ? "crosshair"
                              : isResizing ? "crosshair"
                                   : dragging?.id === el.id ? "grabbing"
                                        : "grab",
                    pointerEvents: "all" as const,
                    opacity: isBeingTextEdited ? 0 : 1,
               },
          };

          const GD = () => el.gradient ? (
               <defs>
                    <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                         <stop offset="0%" stopColor={el.fill} />
                         <stop offset="100%" stopColor={el.gradientColor || "#a855f7"} />
                    </linearGradient>
               </defs>
          ) : null;

          if (el.type === "sketch") return (
               <g {...commonProps}>
                    {el.sketchPoints?.map((pts: any[], i: number) => (
                         <polyline key={i} points={pts.map((p: any) => `${p.x},${p.y}`).join(" ")}
                              fill="none" stroke={el.stroke || NAVY} strokeWidth={el.strokeWidth}
                              strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} />
                    ))}
               </g>
          );

          return (
               <g {...commonProps} transform={transform} filter={filter} opacity={el.opacity}>
                    <GD />

                    {el.type === "rect" && (
                         <rect width={el.width} height={el.height} fill={fillVal}
                              stroke={el.stroke} strokeWidth={el.strokeWidth} rx={el.borderRadius || 0} />
                    )}
                    {el.type === "square" && (
                         <rect width={el.width} height={el.height} fill={fillVal}
                              stroke={el.stroke} strokeWidth={el.strokeWidth} rx={el.borderRadius || 0} />
                    )}
                    {(el.type === "circle" || el.type === "ellipse") && (
                         <ellipse cx={el.width / 2} cy={el.height / 2} rx={el.width / 2} ry={el.height / 2}
                              fill={fillVal} stroke={el.stroke} strokeWidth={el.strokeWidth} />
                    )}
                    {el.type === "diamond" && (
                         <polygon points={`${el.width / 2},0 ${el.width},${el.height / 2} ${el.width / 2},${el.height} 0,${el.height / 2}`}
                              fill={fillVal} stroke={el.stroke} strokeWidth={el.strokeWidth} />
                    )}
                    {el.type === "line" && (
                         <line x1={0} y1={el.height / 2} x2={el.width} y2={el.height / 2}
                              stroke={el.stroke || NAVY} strokeWidth={el.strokeWidth || 2} strokeLinecap="round" />
                    )}

                    {el.type === "text" && (
                         <g>
                              <text x={0} y={el.fontSize || 20} fontSize={el.fontSize || 18}
                                   fontFamily={el.fontFamily || "DM Sans"} fontWeight={el.fontWeight || "400"}
                                   fontStyle={el.fontStyle} fill={el.fill || NAVY} textAnchor="start">
                                   {el.text || "Text here"}
                              </text>
                              <rect width={Math.max(el.width, 80)} height={el.fontSize ? el.fontSize + 8 : 28}
                                   fill="transparent" style={{ cursor: "text" }} />
                         </g>
                    )}

                    {/* ── FIX 5: Checkbox — renders based on selectionType ── */}
                    {el.type === "checkbox" && (() => {
                         const isEditingThis = checkboxEdit?.id === el.id;
                         const sType: SelectionType = el.selectionType || "checkbox";
                         const ctrlW = getControlWidth(el);
                         // For dropdown, vertically center the control at row midpoint
                         const ctrlY = sType === "dropdown" ? 0 : Math.max(0, (el.height - 18) / 2);
                         const labelX = sType === "dropdown" ? 0 : ctrlW + 4;
                         const labelY = el.height / 2 + 5;

                         return (
                              <>
                                   {/* Control — offset vertically for non-dropdown types */}
                                   <g transform={`translate(0, ${ctrlY})`}>
                                        {renderCheckboxControl(el, () => {
                                             updateElement(el.id, { checked: !el.checked } as any);
                                        })}
                                   </g>

                                   {/* Label — not shown for dropdown (label is inside the box) */}
                                   {sType !== "dropdown" && (
                                        isEditingThis ? (
                                             <foreignObject x={labelX} y={ctrlY} width={Math.max(el.width - labelX - 4, 80)} height={22}>
                                                  <input
                                                       // @ts-ignore
                                                       xmlns="http://www.w3.org/1999/xhtml"
                                                       autoFocus
                                                       defaultValue={el.text}
                                                       onBlur={e => {
                                                            updateElement(el.id, { text: e.target.value } as any);
                                                            setCheckboxEdit(null);
                                                       }}
                                                       onKeyDown={e => {
                                                            if (e.key === "Enter" || e.key === "Escape") {
                                                                 updateElement(el.id, { text: (e.target as HTMLInputElement).value } as any);
                                                                 setCheckboxEdit(null);
                                                            }
                                                            e.stopPropagation();
                                                       }}
                                                       onClick={e => e.stopPropagation()}
                                                       style={{
                                                            background: "rgba(255,255,255,0.95)",
                                                            border: `1.5px solid ${ACCENT}`,
                                                            borderRadius: 4,
                                                            color: NAVY,
                                                            fontSize: 12,
                                                            fontFamily: "DM Sans, sans-serif",
                                                            padding: "1px 5px",
                                                            outline: "none",
                                                            width: "100%",
                                                            boxSizing: "border-box" as const,
                                                            boxShadow: `0 0 0 3px ${ACCENT}33`,
                                                       }}
                                                  />
                                             </foreignObject>
                                        ) : (
                                             <text x={labelX} y={labelY} fontSize={13} fontFamily="DM Sans" fill={NAVY}>
                                                  {el.text}
                                             </text>
                                        )
                                   )}

                                   {/* Invisible hit area covering the whole element bounding box */}
                                   <rect width={el.width} height={el.height} fill="transparent" style={{ cursor: "grab" }} />
                              </>
                         );
                    })()}

                    {/* Navbar */}
                    {el.type === "navbar" && (() => {
                         const cfg: NavbarConfig = { ...DEFAULT_NAVBAR_CFG, ...(el.navbarConfig || {}) };
                         return (
                              <foreignObject x={0} y={0} width={el.width} height={cfg.height}
                                   style={{ overflow: "visible" }}>
                                   {/* @ts-ignore */}
                                   <div xmlns="http://www.w3.org/1999/xhtml"
                                        style={{ width: el.width, height: cfg.height }}>
                                        <NavbarElement cfg={cfg} width={el.width} />
                                   </div>
                              </foreignObject>
                         );
                    })()}

                    {/* Carousel Slider */}
                    {el.type === "slider" && (() => {
                         const slides: CarouselSlide[] = el.carouselSlides || DEFAULT_CAROUSEL_SLIDES;
                         const activeIdx: number = el.sliderValue || 0;
                         const W = el.width;
                         const H = el.height;
                         const BR = el.borderRadius || 12;
                         const accentColor = el.fill || ACCENT;
                         const cur = slides[activeIdx] || slides[0];
                         const prevIdx = ((activeIdx - 1) + slides.length) % slides.length;
                         const nextIdx = (activeIdx + 1) % slides.length;

                         return (
                              <g>
                                   <defs>
                                        <clipPath id={`carousel-clip-${el.id}`}>
                                             <rect width={W} height={H} rx={BR} />
                                        </clipPath>
                                   </defs>
                                   <rect width={W} height={H} rx={BR}
                                        fill={cur.color || "#1e3a5f"}
                                        clipPath={`url(#carousel-clip-${el.id})`} />
                                   <foreignObject x={0} y={0} width={W} height={H}
                                        clipPath={`url(#carousel-clip-${el.id})`}
                                        style={{ overflow: "hidden" }}>
                                        {/* @ts-ignore */}
                                        <div xmlns="http://www.w3.org/1999/xhtml"
                                             style={{ width: W, height: H, position: "relative", overflow: "hidden", background: cur.color || "#1e3a5f", borderRadius: BR, userSelect: "none" }}>
                                             {cur.type === "image" && cur.src && (
                                                  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                                                       <img src={cur.src} alt={cur.title} style={{ position: "absolute", width: "100%", height: "100%", objectFit: cur.objectFit || "cover", objectPosition: `${cur.objectPositionX ?? 50}% ${cur.objectPositionY ?? 50}%`, pointerEvents: "none", display: "block" }} />
                                                  </div>
                                             )}
                                             {cur.type === "video" && cur.src && (
                                                  <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                                                       <video src={cur.src} autoPlay muted loop playsInline style={{ position: "absolute", width: "100%", height: "100%", objectFit: cur.objectFit || "cover", pointerEvents: "none", display: "block" }} />
                                                  </div>
                                             )}
                                             {(cur.type === "color" || !cur.src) && (
                                                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.45 }}>
                                                       <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" /></svg>
                                                  </div>
                                             )}
                                             <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)", pointerEvents: "none" }} />
                                             {(cur.title || cur.caption) && (
                                                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: `${Math.max(10, H * 0.05)}px ${Math.max(12, W * 0.04)}px`, pointerEvents: "none" }}>
                                                       {cur.title && <div style={{ color: "#fff", fontSize: Math.max(12, Math.min(22, W * 0.048)), fontWeight: 700, fontFamily: "DM Sans, sans-serif", lineHeight: 1.3, textShadow: "0 1px 6px rgba(0,0,0,0.5)", marginBottom: 3 }}>{cur.title}</div>}
                                                       {cur.caption && <div style={{ color: "rgba(255,255,255,0.78)", fontSize: Math.max(9, Math.min(13, W * 0.03)), fontFamily: "DM Sans, sans-serif", lineHeight: 1.4 }}>{cur.caption}</div>}
                                                  </div>
                                             )}
                                             <div style={{ position: "absolute", top: 10, left: 12, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: Math.max(8, Math.min(11, W * 0.025)), fontFamily: "DM Sans, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>
                                                  {cur.type === "video" ? "▶ Video" : cur.type === "image" ? "🖼 Image" : "◼ Color"}
                                             </div>
                                             <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: Math.max(8, Math.min(11, W * 0.025)), fontFamily: "DM Sans, sans-serif", pointerEvents: "none" }}>
                                                  {activeIdx + 1} / {slides.length}
                                             </div>
                                             {slides.length > 1 && (
                                                  <>
                                                       <button onClick={(e) => { e.stopPropagation(); handleSliderTabClick(el.id, prevIdx); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: Math.max(28, W * 0.07), height: Math.max(28, W * 0.07), borderRadius: "50%", background: "rgba(0,0,0,0.42)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", fontSize: Math.max(10, W * 0.025), lineHeight: 1, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.7)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.42)"}>‹</button>
                                                       <button onClick={(e) => { e.stopPropagation(); handleSliderTabClick(el.id, nextIdx); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: Math.max(28, W * 0.07), height: Math.max(28, W * 0.07), borderRadius: "50%", background: "rgba(0,0,0,0.42)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", fontSize: Math.max(10, W * 0.025), lineHeight: 1, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.7)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.42)"}>›</button>
                                                  </>
                                             )}
                                             <div style={{ position: "absolute", bottom: Math.max(8, H * 0.06 + (cur.title ? H * 0.12 : 0)), left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center", pointerEvents: "none" }}>
                                                  {slides.map((_, i) => (
                                                       <div key={i} style={{ width: i === activeIdx ? Math.max(16, W * 0.04) : Math.max(6, W * 0.015), height: Math.max(6, W * 0.015), borderRadius: 99, background: i === activeIdx ? accentColor : "rgba(255,255,255,0.45)", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }} />
                                                  ))}
                                             </div>
                                             <div style={{ position: "absolute", bottom: 6, right: 12, fontSize: Math.max(8, Math.min(10, W * 0.022)), color: "rgba(255,255,255,0.45)", fontFamily: "DM Sans, sans-serif", pointerEvents: "none" }}>↵ dbl-click to edit</div>
                                        </div>
                                   </foreignObject>
                              </g>
                         );
                    })()}

                    {el.type === "card" && (() => {
                         const isEditingThis = editingCardId === el.id;
                         const titleHtml = el.cardTitle ?? "Card Title";
                         const bodyHtml = el.cardBody ?? "Add a description...";
                         return isEditingThis ? (
                              <CardEditor
                                   id={el.id} width={el.width} height={el.height}
                                   cardTitle={titleHtml} cardBody={bodyHtml}
                                   fill={el.fill || WHITE} stroke={el.stroke || GRAY}
                                   strokeWidth={el.strokeWidth || 1}
                                   borderRadius={(el as any).borderRadius || 12}
                                   shadow={(el as any).shadow}
                                   zoom={zoom}
                                   onChange={patch => updateElement(el.id, patch as any)}
                                   onExitEdit={() => setEditingCardId(null)}
                              />
                         ) : (
                              <>
                                   <rect width={el.width} height={el.height}
                                        rx={(el as any).borderRadius || 12}
                                        fill={el.fill || WHITE} stroke={el.stroke || GRAY} strokeWidth={el.strokeWidth || 1} />
                                   <foreignObject x={0} y={0} width={el.width} height={el.height}
                                        style={{ overflow: "hidden", pointerEvents: "none" }}>
                                        {/* @ts-ignore */}
                                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", padding: "14px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, fontFamily: "DM Sans, sans-serif", overflow: "hidden", userSelect: "none" }}>
                                             <div dangerouslySetInnerHTML={{ __html: titleHtml }} style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.4 }} />
                                             <div style={{ height: 1, background: GRAY, flexShrink: 0 }} />
                                             <div dangerouslySetInnerHTML={{ __html: bodyHtml }} style={{ fontSize: 12, color: "#334155", lineHeight: 1.65 }} />
                                             <style>{`a{color:${ACCENT};text-decoration:underline;}strong,b{font-weight:700;}em,i{font-style:italic;}`}</style>
                                        </div>
                                   </foreignObject>
                                   <rect width={el.width} height={el.height} rx={(el as any).borderRadius || 12}
                                        fill="transparent" style={{ cursor: "text" }} />
                                   <foreignObject x={el.width - 88} y={el.height - 22} width={80} height={18} style={{ pointerEvents: "none", opacity: 0.5 }}>
                                        {/* @ts-ignore */}
                                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 9, color: GRAY2, fontFamily: "DM Sans, sans-serif", textAlign: "right", paddingRight: 8 }}>↵ dbl-click</div>
                                   </foreignObject>
                              </>
                         );
                    })()}

                    {el.type === "progress" && (
                         <>
                              <rect width={el.width} height={el.height} rx={el.height / 2} fill={GRAY} />
                              <rect width={(el.progressValue || 60) / 100 * el.width} height={el.height}
                                   rx={el.height / 2} fill={ACCENT} />
                              <text x={el.width / 2} y={el.height / 2 + 4} fontSize={10} fontFamily="DM Sans"
                                   fill={WHITE} textAnchor="middle">{el.progressValue || 60}%</text>
                         </>
                    )}
                    {el.type === "icon" && (
                         <svg width={el.width} height={el.height} viewBox="0 0 24 24" fill="none"
                              stroke={el.fill || NAVY} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              {renderIconPaths(el.iconName || "home")}
                         </svg>
                    )}
                    {(el.type === "image" || el.type === "imagebox") && (
                         <>
                              <defs>
                                   <clipPath id={`imgclip-${el.id}`}>
                                        <rect width={el.width} height={el.height} rx={el.borderRadius || 6} />
                                   </clipPath>
                              </defs>
                              <rect width={el.width} height={el.height} fill={el.fill || "#dde6f0"} stroke={el.stroke || "#b0c4d8"} strokeWidth={el.strokeWidth || 1.5} rx={el.borderRadius || 6} />
                              {el.imageUrl ? (
                                   <image href={el.imageUrl} x={0} y={0} width={el.width} height={el.height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#imgclip-${el.id})`} />
                              ) : (
                                   <g opacity={0.45}>
                                        <line x1={el.width * 0.2} y1={el.height * 0.7} x2={el.width / 2} y2={el.height * 0.33} stroke={GRAY2} strokeWidth={1.5} strokeLinecap="round" />
                                        <line x1={el.width / 2} y1={el.height * 0.33} x2={el.width * 0.8} y2={el.height * 0.7} stroke={GRAY2} strokeWidth={1.5} strokeLinecap="round" />
                                        <line x1={el.width * 0.12} y1={el.height * 0.7} x2={el.width * 0.88} y2={el.height * 0.7} stroke={GRAY2} strokeWidth={1.5} strokeLinecap="round" />
                                        <circle cx={el.width * 0.72} cy={el.height * 0.35} r={Math.max(4, el.width * 0.065)} fill="none" stroke={GRAY2} strokeWidth={1.5} />
                                        <text x={el.width / 2} y={el.height * 0.88} textAnchor="middle" fontSize={Math.max(9, Math.min(13, el.width * 0.08))} fontFamily="DM Sans" fill={GRAY2}>Image</text>
                                   </g>
                              )}
                         </>
                    )}
               </g>
          );
     };

     // ─── Selection overlay ────────────────────────────────────────────────────
     const renderOverlay = (el: any) => {
          if (el.type === "sketch") return null;
          if (!selected.includes(el.id)) return null;
          if (editingCardId === el.id) return null;
          if (textEdit?.id === el.id) return null;

          const w = el.width;
          const h = el.height;
          const R = 5;
          const rot = el.rotation || 0;
          const cx = w / 2;
          const isActiveResize = resizing?.id === el.id;
          const isActiveRotate = rotating?.id === el.id;
          const ROT_OFFSET = 28 / zoom;
          const rotHandleR = 6 / zoom;

          return (
               <g key={`overlay-${el.id}`}
                    transform={`translate(${el.x}, ${el.y}) rotate(${rot}, ${cx}, ${h / 2})`}>
                    <rect x={-2} y={-2} width={w + 4} height={h + 4} fill="none"
                         stroke={isActiveRotate ? "#a855f7" : ACCENT}
                         strokeWidth={(isActiveResize || isActiveRotate ? 2 : 1.5) / zoom}
                         strokeDasharray={isActiveResize || isActiveRotate ? "none" : `${5 / zoom} ${3 / zoom}`}
                         rx={2} style={{ pointerEvents: "none" }} />
                    <line x1={cx} y1={-2} x2={cx} y2={-ROT_OFFSET + rotHandleR}
                         stroke={isActiveRotate ? "#a855f7" : ACCENT}
                         strokeWidth={1.5 / zoom}
                         strokeDasharray={`${3 / zoom} ${2 / zoom}`}
                         style={{ pointerEvents: "none" }} />
                    <circle cx={cx} cy={-ROT_OFFSET} r={rotHandleR}
                         fill={isActiveRotate ? "#a855f7" : WHITE}
                         stroke={isActiveRotate ? "#a855f7" : ACCENT}
                         strokeWidth={1.5 / zoom}
                         style={{ cursor: "crosshair", pointerEvents: "all" }}
                         onMouseDown={ev => handleRotateMouseDown(ev, el.id)} />
                    <text x={cx} y={-ROT_OFFSET + 4 / zoom} textAnchor="middle"
                         fontSize={8 / zoom} fill={isActiveRotate ? WHITE : ACCENT}
                         style={{ pointerEvents: "none", userSelect: "none" }}>↻</text>
                    {isActiveRotate && (
                         <g style={{ pointerEvents: "none" }}>
                              <rect x={cx - 28 / zoom} y={-ROT_OFFSET - 24 / zoom} width={56 / zoom} height={18 / zoom} rx={4 / zoom} fill="#a855f7" />
                              <text x={cx} y={-ROT_OFFSET - 12 / zoom} textAnchor="middle" fontSize={10 / zoom} fontFamily="DM Sans" fill={WHITE}>
                                   {Math.round(((rot % 360) + 360) % 360)}°
                              </text>
                         </g>
                    )}
                    {isActiveResize && (
                         <g style={{ pointerEvents: "none" }}>
                              <rect x={cx - 60 / zoom} y={h + 8 / zoom} width={120 / zoom} height={18 / zoom} rx={4 / zoom} fill={NAVY2} opacity={0.9} />
                              <text x={cx} y={h + 19 / zoom} textAnchor="middle" fontSize={9.5 / zoom} fontFamily="DM Sans" fill={WHITE}>
                                   {shiftHeld ? "⇧ Aspect ratio locked" : "Hold ⇧ to lock ratio"}
                              </text>
                         </g>
                    )}
                    {HANDLES.map(h2 => (
                         <rect key={h2.id}
                              x={h2.cx * w - R / zoom} y={h2.cy * h - R / zoom}
                              width={R * 2 / zoom} height={R * 2 / zoom} rx={2 / zoom}
                              fill={isActiveResize && resizing?.handle === h2.id ? ACCENT : WHITE}
                              stroke={ACCENT} strokeWidth={1.5 / zoom}
                              style={{ cursor: h2.cursor, pointerEvents: "all" }}
                              onMouseDown={ev => handleResizeMouseDown(ev, el.id, h2.id)} />
                    ))}
               </g>
          );
     };

     // ─── Text edit overlay ────────────────────────────────────────────────────
     const renderTextEditOverlay = () => {
          if (!textEdit || !canvasRef.current) return null;
          const svg = canvasRef.current;
          const rect = svg.getBoundingClientRect();
          const screenX = rect.left + pan.x + textEdit.x * zoom;
          const screenY = rect.top + pan.y + textEdit.y * zoom;
          const screenW = Math.max(textEdit.width * zoom, 160);
          const screenH = Math.max(textEdit.height * zoom + 20, 48);
          return (
               <div
                    style={{ position: "fixed", left: screenX, top: screenY, zIndex: 9000, pointerEvents: "all" }}
                    onMouseDown={e => e.stopPropagation()}
               >
                    <textarea
                         ref={textareaRef}
                         value={textEdit.text}
                         onChange={e => setTextEdit(prev => prev ? { ...prev, text: e.target.value } : null)}
                         onBlur={commitTextEdit}
                         onKeyDown={e => {
                              if (e.key === "Escape") commitTextEdit();
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitTextEdit(); }
                              e.stopPropagation();
                         }}
                         style={{
                              minWidth: screenW, minHeight: screenH,
                              fontSize: (textEdit.fontSize || 20) * zoom,
                              fontFamily: textEdit.fontFamily || "DM Sans",
                              fontWeight: textEdit.fontWeight || "400",
                              fontStyle: textEdit.fontStyle || "normal",
                              color: textEdit.fill || NAVY,
                              background: "rgba(255,255,255,0.97)",
                              border: `2px solid ${ACCENT}`, borderRadius: 6,
                              padding: "4px 8px", outline: "none", resize: "both",
                              lineHeight: 1.4,
                              boxShadow: `0 0 0 4px ${ACCENT}33, 0 8px 32px rgba(0,0,0,0.18)`,
                              transition: "box-shadow 0.15s ease",
                              caretColor: ACCENT, boxSizing: "border-box",
                         }}
                    />
                    <div style={{
                         position: "absolute", top: -22, left: 0,
                         background: NAVY2, color: GRAY2, fontSize: 10,
                         fontFamily: "DM Sans, sans-serif", padding: "2px 8px",
                         borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none",
                         boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}>
                         Enter to save · Esc to cancel
                    </div>
               </div>
          );
     };

     const LAYOUT_PROMPTS = [
          { label: "Dashboard Layout", desc: "KPI cards + charts grid" },
          { label: "Landing Page", desc: "Hero + features + CTA" },
          { label: "Login Screen", desc: "Email + password + social" },
          { label: "Profile Page", desc: "Avatar + stats + feed" },
     ];
     const COMPONENT_PROMPTS = [
          "Suggest a color palette for a fintech app",
          "What typography pairs work for a healthcare UI?",
          "Identify UI patterns for e-commerce checkout",
          "How to improve accessibility in my design?",
     ];

     const svgEvents = {
          onMouseDown: handleCanvasMouseDown,
          onMouseMove: handleSvgMouseMove,
          onMouseUp: handleSvgMouseUp,
          onMouseLeave: handleSvgMouseUp,
          onWheel: (e: React.WheelEvent) => {
               e.preventDefault();
               if (e.ctrlKey) setZoom(z => clamp(+(z - e.deltaY * 0.001).toFixed(2), 0.25, 4));
               else setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
          },
     };

     return (
          <div style={{ display: "flex", width: "100vw", height: "100vh", fontFamily: "DM Sans, sans-serif", background: NAVY, overflow: "hidden", position: "relative" }}>
               <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=Space+Mono&family=Outfit:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
                    * { box-sizing: border-box; }
                    ::-webkit-scrollbar { width: 4px; }
                    ::-webkit-scrollbar-thumb { background: ${GRAY}; border-radius: 4px; }
                    button:focus { outline: none; }
                    input:focus { outline: none; }
                    @keyframes fadeUp    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes dotBounce { from{transform:translateY(0)} to{transform:translateY(-5px)} }
                    @keyframes slideIn   { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
                    @keyframes textEditPop { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
                    button { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease, opacity 0.15s ease; }
                    input, select, textarea { transition: border-color 0.15s ease, box-shadow 0.15s ease; }
                    .ctx-menu { animation: slideIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both; }
                    .ai-msg { animation: fadeUp 0.2s ease both; }
                    .text-edit-overlay textarea { animation: textEditPop 0.15s cubic-bezier(0.34,1.56,0.64,1) both; }
               `}</style>
   
             
   {/* ── TOP NAV ── */}
               <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 52, background: NAVY2, display: "flex", alignItems: "center", paddingInline: 16, gap: 12, zIndex: 100, borderBottom: `1px solid ${NAVY3}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                         <Link to="/dashboard" style={{ textDecoration: "none" }}>
                        
    <img src={logoSvg} width="28" height="28" alt="logo" style={{ display: "block" }} />
                            
                         </Link>
                         <span style={{ color: WHITE, fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>Design Project</span>
                         <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={GRAY2} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
                    </div>
                    
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                         <button onClick={() => setShowAI(!showAI)}
                              style={{ padding: "5px 16px", borderRadius: 20, cursor: "pointer", background: showAI ? ACCENT : "transparent", color: showAI ? WHITE : ACCENT, border: `1.5px solid ${showAI ? ACCENT : ACCENT + "66"}`, fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, boxShadow: showAI ? `0 0 14px ${ACCENT}55` : "none" }}>
                              ✦ AI Assist
                         </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                         <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <button onClick={() => setZoom(z => clamp(+(z - 0.1).toFixed(1), 0.25, 4))} style={{ width: 24, height: 24, borderRadius: 5, background: "transparent", border: `1px solid ${NAVY3}`, color: GRAY2, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                              <span style={{ color: GRAY2, fontSize: 11, width: 42, textAlign: "center", fontFamily: "Space Mono" }}>{Math.round(zoom * 100)}%</span>
                              <button onClick={() => setZoom(z => clamp(+(z + 0.1).toFixed(1), 0.25, 4))} style={{ width: 24, height: 24, borderRadius: 5, background: "transparent", border: `1px solid ${NAVY3}`, color: GRAY2, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                         </div>
                         <div style={{ width: 1, height: 24, background: NAVY3 }} />
                         {[
                              { action: undo, disabled: !isUndoAvailable, title: "Undo (Ctrl+Z)", path: "M9 14L4 9l5-5M4 9h11a4 4 0 010 8h-1" },
                              { action: redo, disabled: !isRedoAvailable, title: "Redo (Ctrl+Y)", path: "M15 14l5-5-5-5M19 9H8a4 4 0 000 8h1" },
                         ].map((btn, i) => (
                              <button key={i} onClick={btn.action} disabled={btn.disabled} title={btn.title}
                                   style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${btn.disabled ? NAVY3 + "80" : NAVY3}`, color: btn.disabled ? NAVY3 : GRAY2, cursor: btn.disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: btn.disabled ? 0.38 : 1 }}
                                   onMouseEnter={e => { if (!btn.disabled) { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = `${ACCENT}18`; } }}
                                   onMouseLeave={e => { e.currentTarget.style.borderColor = btn.disabled ? NAVY3 + "80" : NAVY3; e.currentTarget.style.color = btn.disabled ? NAVY3 : GRAY2; e.currentTarget.style.background = "transparent"; }}>
                                   <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={btn.path} /></svg>
                              </button>
                         ))}
                         <div style={{ width: 1, height: 24, background: NAVY3 }} />
                         <button style={{ padding: "5px 16px", borderRadius: 8, background: ACCENT, color: WHITE, border: "none", fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, cursor: "pointer", boxShadow: `0 2px 10px ${ACCENT}44` }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.boxShadow = `0 4px 18px ${ACCENT}66`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.boxShadow = `0 2px 10px ${ACCENT}44`; }}>
                              Export
                         </button>
                         <button title="Toggle fullscreen" onClick={() => setFullscreen(!fullscreen)}
                              style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${NAVY3}`, color: GRAY2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; e.currentTarget.style.background = `${ACCENT}18`; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = NAVY3; e.currentTarget.style.color = GRAY2; e.currentTarget.style.background = "transparent"; }}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                   {fullscreen ? <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /> : <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />}
                              </svg>
                         </button>
                         <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 10px ${ACCENT}44` }}>
                              <span style={{ color: WHITE, fontSize: 11, fontWeight: 700 }}>
                           {currentUser[0].toUpperCase()}
                           {/*{(currentUser ?? "U")[0].toUpperCase()}*/}
                              </span>

                        </div>
                    </div>
               </div>

               {/* ── MAIN LAYOUT ── */}
               <div style={{ display: "flex", flex: 1, marginTop: 52, position: "relative", overflow: "visible" }}>
                    {!fullscreen && (
                         <LeftSidebar
                              activeTool={activeTool}
                              onToolSelect={handleToolSelect}
                              onIconPick={handleIconPick}
                              onImageAdd={handleImageAdd}
                         />
                    )}

                    {/* ── CANVAS ── */}
                    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#eef2f7" }}
                         onClick={() => setContextMenu(null)}>
                         <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                              <defs>
                                   <pattern id="dotgrid" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)} width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse">
                                        <circle cx={1} cy={1} r={0.9} fill="#b8c8dc" />
                                   </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#dotgrid)" />
                         </svg>
                         <div style={{ position: "absolute", top: 14, right: 16, zIndex: 10, background: WHITE, borderRadius: 8, padding: "5px 14px", fontSize: 12, color: NAVY3, fontFamily: "DM Sans", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                              Creative Canvas
                         </div>
                         {elements.length === 0 && (
                              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", userSelect: "none" }}>
                                   <div style={{ width: 64, height: 64, borderRadius: 16, background: `${ACCENT}18`, border: `2px dashed ${ACCENT}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                                        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={1.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                                   </div>
                                   <p style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, color: NAVY3, marginBottom: 6 }}>Empty Canvas</p>
                                   <p style={{ fontFamily: "DM Sans", fontSize: 12, color: GRAY2, maxWidth: 200 }}>Pick a tool from the left sidebar to start designing</p>
                              </div>
                         )}
                         <svg ref={canvasRef} width="100%" height="100%"
                              style={{ position: "absolute", inset: 0, cursor: activeTool !== "select" ? "crosshair" : "default" }}
                              {...svgEvents}>
                              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                                   {[...elements].sort((a, b) => ((a as any).zIndex || 0) - ((b as any).zIndex || 0)).map(renderElement)}
                                   {elements.map(renderOverlay)}
                                   {drawing && activeTool === "sketch" && currentSketch.length > 1 && (
                                        <polyline points={currentSketch.map(p => `${p.x},${p.y}`).join(" ")}
                                             fill="none" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
                                   )}
                              </g>
                         </svg>

                         <div className="text-edit-overlay">
                              {renderTextEditOverlay()}
                         </div>

                         {contextMenu && (
                              <div className="ctx-menu" style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, background: WHITE, borderRadius: 10, padding: 6, zIndex: 9999, minWidth: 170, boxShadow: "0 8px 32px rgba(0,0,0,0.16)", border: `1.5px solid ${GRAY}` }}>
                                   {[
                                        { label: "✦ Duplicate", action: "duplicate" },
                                        { label: "⬆ Bring to Front", action: "bringFront" },
                                        { label: "⬇ Send to Back", action: "sendBack" },
                                        { label: (elements.find(e => e.id === contextMenu.id) as any)?.locked ? "🔓 Unlock" : "🔒 Lock", action: "lock" },
                                        { label: "🗑 Delete", action: "delete", danger: true },
                                   ].map((item: any) => (
                                        <div key={item.action} onClick={() => contextAction(item.action)}
                                             style={{ padding: "7px 14px", cursor: "pointer", borderRadius: 7, fontSize: 12, fontFamily: "DM Sans", color: item.danger ? "#ef4444" : NAVY, transition: "background 0.12s" }}
                                             onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "#ef444412" : "#f0f4f8"; }}
                                             onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                             {item.label}
                                        </div>
                                   ))}
                              </div>
                         )}

                         {bottomBarVisible && (
                              <BottomBar
                                   selectedEl={selectedEl}
                                   onUpdate={updateElement}
                                   onDelete={deleteElement}
                                   visible={true}
                                   editingCardId={editingCardId}
                              />
                         )}
                    </div>

                    {/* ── AI PANEL ── */}
                    {showAI && !fullscreen && (
                         <div style={{ width: 290, background: WHITE, borderLeft: `1px solid ${GRAY}`, display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 50 }}>
                              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${GRAY}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                             <span style={{ fontSize: 11, color: WHITE }}>✦</span>
                                        </div>
                                        <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: NAVY }}>AI Assistant</span>
                                   </div>
                                   <button onClick={() => setShowAI(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GRAY2, fontSize: 20, lineHeight: 1, padding: "2px 4px", borderRadius: 5 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "#f0f4f8"; e.currentTarget.style.color = NAVY; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = GRAY2; }}>×</button>
                              </div>
                              <div style={{ display: "flex", borderBottom: `1px solid ${GRAY}`, paddingInline: 12 }}>
                                   {(["layout", "generate", "components"] as const).map(tab => (
                                        <button key={tab} onClick={() => setAiTab(tab)}
                                             style={{ padding: "9px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Sans", fontWeight: aiTab === tab ? 600 : 400, color: aiTab === tab ? ACCENT : GRAY2, borderBottom: `2px solid ${aiTab === tab ? ACCENT : "transparent"}` }}>
                                             {tab === "layout" ? "Suggest Layout" : tab === "generate" ? "Generate" : "Components"}
                                        </button>
                                   ))}
                              </div>
                              <div ref={aiChatRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                   {aiMessages.length === 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                             {aiTab === "layout" && LAYOUT_PROMPTS.map(opt => (
                                                  <div key={opt.label} onClick={() => setAiInput(`Suggest a ${opt.label} layout`)}
                                                       style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${GRAY}`, cursor: "pointer", transition: "all 0.15s" }}
                                                       onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${ACCENT}`; e.currentTarget.style.background = `${ACCENT}08`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                                       onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${GRAY}`; e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "none"; }}>
                                                       <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, fontFamily: "DM Sans" }}>{opt.label}</div>
                                                       <div style={{ fontSize: 10, color: GRAY2, marginTop: 2, fontFamily: "DM Sans" }}>{opt.desc}</div>
                                                  </div>
                                             ))}
                                             {aiTab === "generate" && (
                                                  <div style={{ padding: 14, borderRadius: 10, background: `${ACCENT}08`, border: `1.5px solid ${ACCENT}33` }}>
                                                       <p style={{ fontSize: 12, color: NAVY3, fontFamily: "DM Sans", lineHeight: 1.6 }}>Describe your UI in plain English and I'll generate a layout structure.</p>
                                                       <p style={{ fontSize: 11, color: GRAY2, fontFamily: "DM Sans", marginTop: 8, fontStyle: "italic" }}>e.g. "A login screen with email, password and Google sign-in"</p>
                                                  </div>
                                             )}
                                             {aiTab === "components" && COMPONENT_PROMPTS.map(s => (
                                                  <div key={s} onClick={() => setAiInput(s)}
                                                       style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${GRAY}`, fontSize: 11, fontFamily: "DM Sans", color: NAVY, cursor: "pointer", transition: "all 0.15s" }}
                                                       onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${ACCENT}`; e.currentTarget.style.transform = "translateY(-1px)"; }}
                                                       onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${GRAY}`; e.currentTarget.style.transform = "none"; }}>
                                                       ✦ {s}
                                                  </div>
                                             ))}
                                        </div>
                                   )}
                                   {aiMessages.map((msg, i) => (
                                        <div key={i} className="ai-msg" style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                             <div style={{ maxWidth: "88%", padding: "9px 12px", borderRadius: 11, background: msg.role === "user" ? ACCENT : "#f0f4f8", color: msg.role === "user" ? WHITE : NAVY, fontSize: 12, lineHeight: 1.55, fontFamily: "DM Sans", borderBottomRightRadius: msg.role === "user" ? 2 : 11, borderBottomLeftRadius: msg.role === "assistant" ? 2 : 11, boxShadow: msg.role === "user" ? `0 2px 10px ${ACCENT}33` : "none" }}>
                                                  {msg.content}
                                             </div>
                                        </div>
                                   ))}
                                   {aiLoading && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "#f0f4f8", width: "fit-content" }}>
                                             {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, animation: `dotBounce 0.6s ${i * 0.12}s infinite alternate` }} />)}
                                        </div>
                                   )}
                              </div>
                              <div style={{ padding: 12, borderTop: `1px solid ${GRAY}`, display: "flex", gap: 8 }}>
                                   <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && sendAIMessage()}
                                        placeholder="Ask the AI assistant…"
                                        style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", color: NAVY }}
                                        onFocus={e => { e.target.style.border = `1.5px solid ${ACCENT}`; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; }}
                                        onBlur={e => { e.target.style.border = `1.5px solid ${GRAY}`; e.target.style.boxShadow = "none"; }} />
                                   <button onClick={sendAIMessage} disabled={aiLoading}
                                        style={{ width: 36, height: 36, borderRadius: 10, background: ACCENT, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: aiLoading ? 0.6 : 1, boxShadow: `0 2px 8px ${ACCENT}44` }}
                                        onMouseEnter={e => { if (!aiLoading) { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "scale(1.06)"; } }}
                                        onMouseLeave={e => { e.currentTarget.style.background = ACCENT; e.currentTarget.style.transform = "none"; }}>
                                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                   </button>
                              </div>
                         </div>
                    )}
               </div>

               {/* ── SLIDER / CAROUSEL EDITOR MODAL ── */}
               {editingSliderEl && (() => {
                    const slides: CarouselSlide[] = editingSliderEl.carouselSlides || DEFAULT_CAROUSEL_SLIDES;
                    const setSlides = (updated: CarouselSlide[]) =>
                         setEditingSliderEl((prev: any) => ({ ...prev, carouselSlides: updated }));
                    const save = () => {
                         updateElement(editingSliderEl.id, { carouselSlides: slides } as any);
                         setEditingSliderEl(null);
                    };
                    const addSlide = (type: "image" | "video" | "color") => {
                         const colors = ["#2d4a7a", "#4a2d7a", "#2d7a4a", "#7a4a2d", "#2d6e7a", "#7a2d4a", "#4a7a2d"];
                         setSlides([...slides, { id: uid(), type, src: "", color: colors[slides.length % colors.length], title: `Slide ${slides.length + 1}`, caption: "", objectFit: "cover", objectPositionX: 50, objectPositionY: 50, mediaScale: 1 }]);
                    };
                    const removeSlide = (idx: number) => { if (slides.length <= 1) return; setSlides(slides.filter((_, i) => i !== idx)); };
                    const updateSlide = (idx: number, patch: Partial<CarouselSlide>) => setSlides(slides.map((s, i) => i === idx ? { ...s, ...patch } : s));
                    const handleSlideFileUpload = (idx: number, file: File) => {
                         const reader = new FileReader();
                         reader.onload = (ev) => { const src = ev.target?.result as string; if (src) updateSlide(idx, { src, type: file.type.startsWith("video") ? "video" : "image" }); };
                         reader.readAsDataURL(file);
                    };

                    return (
                         <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(10,18,35,0.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", animation: "fadeUp 0.2s ease both" }} onClick={save}>
                              <div style={{ background: WHITE, borderRadius: 20, width: "min(680px, 96vw)", height: "min(88vh, 820px)", boxShadow: "0 28px 90px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                                   <div style={{ flexShrink: 0, padding: "15px 20px", borderBottom: `1.5px solid ${GRAY}`, display: "flex", alignItems: "center", gap: 10, background: WHITE }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg,${ACCENT},#a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                             <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth={2.2} strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                        </div>
                                        <div>
                                             <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: NAVY, lineHeight: 1.2 }}>Carousel Editor</div>
                                             <div style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans" }}>{slides.length} slide{slides.length !== 1 ? "s" : ""}</div>
                                        </div>
                                        <div style={{ flex: 1 }} />
                                        <button onClick={save} style={{ padding: "7px 20px", borderRadius: 9, background: ACCENT, color: WHITE, border: "none", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 700, fontSize: 12, boxShadow: `0 2px 10px ${ACCENT}55` }}
                                             onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; }}
                                             onMouseLeave={e => { e.currentTarget.style.background = ACCENT; }}>✓ Save</button>
                                        <button onClick={() => setEditingSliderEl(null)} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: GRAY2, fontSize: 16, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 4 }}
                                             onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                                             onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; }}>×</button>
                                   </div>
                                   <div style={{ flexShrink: 0, padding: "10px 20px", borderBottom: `1px solid ${GRAY}`, background: "#f8fafc", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 11, color: GRAY2, fontFamily: "DM Sans", fontWeight: 600, marginRight: 4 }}>Add slide:</span>
                                        {(["image", "video", "color"] as const).map(t => (
                                             <button key={t} onClick={() => addSlide(t)} style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${ACCENT}`, background: `${ACCENT}10`, color: ACCENT, cursor: "pointer", fontSize: 11, fontFamily: "DM Sans", fontWeight: 600 }}
                                                  onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}22`; }}
                                                  onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}10`; }}>
                                                  {t === "image" ? "🖼" : t === "video" ? "▶" : "◼"} {t.charAt(0).toUpperCase() + t.slice(1)}
                                             </button>
                                        ))}
                                   </div>
                                   <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                        {slides.map((slide, idx) => (
                                             <div key={slide.id} style={{ border: `1.5px solid ${GRAY}`, borderRadius: 14, overflow: "hidden", background: WHITE, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", flexShrink: 0 }}>
                                                  <div style={{ padding: "11px 16px", background: slide.color, display: "flex", alignItems: "center", gap: 10 }}>
                                                       <div style={{ width: 44, height: 32, borderRadius: 6, overflow: "hidden", border: "2px solid rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                            {slide.src && slide.type === "image" ? <img src={slide.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" /></svg>}
                                                       </div>
                                                       <div>
                                                            <div style={{ fontSize: 12, fontWeight: 700, color: WHITE, fontFamily: "DM Sans" }}>Slide {idx + 1}{slide.title ? ` — ${slide.title}` : ""}</div>
                                                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "DM Sans", marginTop: 1 }}>{slide.type === "video" ? "▶ Video" : slide.type === "image" ? "🖼 Image" : "◼ Color"}{slide.src ? " · media loaded" : " · no media"}</div>
                                                       </div>
                                                       <div style={{ flex: 1 }} />
                                                       <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                                                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontFamily: "DM Sans" }}>BG</span>
                                                            <input type="color" value={slide.color} onChange={e => updateSlide(idx, { color: e.target.value })} style={{ width: 26, height: 26, border: "2px solid rgba(255,255,255,0.4)", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                                                       </label>
                                                       {slides.length > 1 && <button onClick={() => removeSlide(idx)} style={{ background: "rgba(255,255,255,0.18)", border: "none", color: WHITE, borderRadius: 7, cursor: "pointer", fontSize: 13, padding: "4px 9px", fontFamily: "DM Sans" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.55)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}>✕ Remove</button>}
                                                  </div>
                                                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                                                       <div style={{ display: "flex", gap: 6 }}>
                                                            <span style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", alignSelf: "center", marginRight: 4 }}>Type:</span>
                                                            {(["image", "video", "color"] as const).map(t => (
                                                                 <button key={t} onClick={() => updateSlide(idx, { type: t })} style={{ padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${slide.type === t ? ACCENT : GRAY}`, background: slide.type === t ? `${ACCENT}18` : "transparent", color: slide.type === t ? ACCENT : GRAY2, cursor: "pointer", fontSize: 11, fontFamily: "DM Sans", fontWeight: slide.type === t ? 600 : 400 }}>
                                                                      {t === "image" ? "🖼 Image" : t === "video" ? "▶ Video" : "◼ Color"}
                                                                 </button>
                                                            ))}
                                                       </div>
                                                       {slide.type !== "color" && (
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                                 <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 16px", border: `2px dashed ${GRAY}`, borderRadius: 10, cursor: "pointer", background: "#f8fafc" }}
                                                                      onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) handleSlideFileUpload(idx, file); }}>
                                                                      <input type="file" accept={slide.type === "image" ? "image/*" : "video/*"} style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) handleSlideFileUpload(idx, file); }} />
                                                                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${ACCENT}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg></div>
                                                                      <div><div style={{ fontSize: 12, fontWeight: 600, color: NAVY, fontFamily: "DM Sans" }}>Upload from device</div><div style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", marginTop: 2 }}>Click to browse or drag & drop</div></div>
                                                                 </label>
                                                                 <input value={slide.src && slide.src.startsWith("data:") ? "" : slide.src} onChange={e => updateSlide(idx, { src: e.target.value })} placeholder={slide.type === "image" ? "https://example.com/photo.jpg" : "https://example.com/video.mp4"} style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", color: NAVY, outline: "none", boxSizing: "border-box" }} onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; }} onBlur={e => { e.target.style.borderColor = GRAY; e.target.style.boxShadow = "none"; }} />
                                                            </div>
                                                       )}
                                                       <div style={{ display: "flex", gap: 10 }}>
                                                            <div style={{ flex: 1 }}>
                                                                 <label style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", display: "block", marginBottom: 5 }}>Title</label>
                                                                 <input value={slide.title} onChange={e => updateSlide(idx, { title: e.target.value })} placeholder="Slide title" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", color: NAVY, outline: "none", boxSizing: "border-box" }} onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; }} onBlur={e => { e.target.style.borderColor = GRAY; e.target.style.boxShadow = "none"; }} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                 <label style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", display: "block", marginBottom: 5 }}>Caption</label>
                                                                 <input value={slide.caption} onChange={e => updateSlide(idx, { caption: e.target.value })} placeholder="Optional caption" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", color: NAVY, outline: "none", boxSizing: "border-box" }} onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.boxShadow = `0 0 0 3px ${ACCENT}22`; }} onBlur={e => { e.target.style.borderColor = GRAY; e.target.style.boxShadow = "none"; }} />
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                                   <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: `1.5px solid ${GRAY}`, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 11, color: GRAY2, fontFamily: "DM Sans" }}>{slides.length} slide{slides.length !== 1 ? "s" : ""} total</span>
                                        <div style={{ display: "flex", gap: 8 }}>
                                             <button onClick={() => setEditingSliderEl(null)} style={{ padding: "7px 18px", borderRadius: 9, border: `1.5px solid ${GRAY}`, background: "transparent", color: GRAY2, cursor: "pointer", fontFamily: "DM Sans", fontSize: 12 }}>Cancel</button>
                                             <button onClick={save} style={{ padding: "7px 24px", borderRadius: 9, background: ACCENT, color: WHITE, border: "none", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 700, fontSize: 12, boxShadow: `0 2px 10px ${ACCENT}55` }}>✓ Save Carousel</button>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    );
               })()}

               {/* ── FULLSCREEN ── */}
               {fullscreen && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#eef2f7", display: "flex" }}>
                         <div style={{ position: "absolute", left: 0, top: 52, bottom: 0, zIndex: 600, display: "flex", alignItems: "stretch" }}>
                              <LeftSidebar activeTool={activeTool} onToolSelect={handleToolSelect} onIconPick={handleIconPick} onImageAdd={handleImageAdd} />
                         </div>
                         <button onClick={() => setFullscreen(false)} style={{ position: "absolute", top: 16, right: 16, zIndex: 700, padding: "7px 16px", borderRadius: 9, background: NAVY2, color: WHITE, border: "none", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans", fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>⊡ Exit Fullscreen</button>
                         <svg width="100%" height="100%" style={{ cursor: activeTool !== "select" ? "crosshair" : "default" }} {...svgEvents}>
                              <defs>
                                   <pattern id="dotgrid2" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)} width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse">
                                        <circle cx={1} cy={1} r={0.9} fill="#b8c8dc" />
                                   </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#dotgrid2)" />
                              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                                   {[...elements].sort((a, b) => ((a as any).zIndex || 0) - ((b as any).zIndex || 0)).map(renderElement)}
                                   {elements.map(renderOverlay)}
                              </g>
                         </svg>
                         <div className="text-edit-overlay">
                              {renderTextEditOverlay()}
                         </div>
                         {bottomBarVisible && (
                              <BottomBar selectedEl={selectedEl} onUpdate={updateElement} onDelete={deleteElement} visible={true} editingCardId={editingCardId} />
                         )}
                    </div>
               )}
          </div>
     );
}

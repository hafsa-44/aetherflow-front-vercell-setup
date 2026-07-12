//this is with integrated ai component 
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getAccessToken } from '../../../api';
import api from "./apidesign";
import LeftSidebar, { type Tool, ICON_LIBRARY } from "./LeftSideBar";
import CardEditor from "./CardEditior";
import BottomBar, { type CanvasElement, type SelectionType } from "./ButtomBar";
import logoSvg from "../../../assets/logo.svg";
import type { CursorState } from "../../../hook/useBoardSync";
import LiveCursors from "../../../board/livecursorpos";
//const [showLeaveModal, setShowLeaveModal] = useState(false);
import NavbarElement, {
     DEFAULT_NAVBAR_CFG,
     type NavbarConfig,
} from "./NavbarElement";

type ElementType =
     | "rect" | "circle" | "ellipse" | "square" | "diamond" | "line" | "text"
     | "sketch" | "checkbox" | "slider" | "card" | "progress" | "icon" | "image"
     | "imagebox" | "navbar";

interface AISuggestion {
     category: "layout" | "spacing" | "color" | "typography" | "ux" | "accessibility";
     title: string;
     detail: string;
     priority: "high" | "medium" | "low";
}
interface AIMessage {
     role: "user" | "assistant";
     content: string;
     imageUrl?: string;
     suggestions?: AISuggestion[];
     generatedCount?: number;
}

const NAVY = "#0f1f3d";
const NAVY2 = "#162847";
const NAVY3 = "#1e3a5f";
const ACCENT = "#3b82f6";
const WHITE = "#ffffff";
const GRAY = "#e2e8f0";
const GRAY2 = "#94a3b8";

const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ─── Frame / Screen types ─────────────────────────────────────────────────────
interface Frame {
     id: string;
     name: string;
     width: number;
     height: number;
     x: number;
     y: number;
     device: string;
     label: string;
}

interface ScreenPreset {
     label: string;
     width: number;
     height: number;
     device: string;
     category: string;
}

const SCREEN_PRESETS: ScreenPreset[] = [
     { label: "iPhone SE", width: 375, height: 667, device: "mobile", category: "Mobile" },
     { label: "iPhone 14", width: 390, height: 844, device: "mobile", category: "Mobile" },
     { label: "iPhone 15 Pro", width: 393, height: 852, device: "mobile", category: "Mobile" },
     { label: "Samsung Galaxy S24", width: 360, height: 780, device: "mobile", category: "Mobile" },
     { label: "iPad Mini", width: 768, height: 1024, device: "tablet", category: "Tablet" },
     { label: "iPad Air", width: 820, height: 1180, device: "tablet", category: "Tablet" },
     { label: "iPad Pro", width: 1024, height: 1366, device: "tablet", category: "Tablet" },
     { label: "1280 × 720", width: 1280, height: 720, device: "web", category: "Desktop" },
     { label: "1366 × 768", width: 1366, height: 768, device: "web", category: "Desktop" },
     { label: "1440 × 900", width: 1440, height: 900, device: "web", category: "Desktop" },
     { label: "1920 × 1080", width: 1920, height: 1080, device: "web", category: "Desktop" },
     { label: "2560 × 1440", width: 2560, height: 1440, device: "web", category: "Desktop" },
     { label: "Instagram Post", width: 1080, height: 1080, device: "social", category: "Social Media" },
     { label: "Instagram Story", width: 1080, height: 1920, device: "social", category: "Social Media" },
     { label: "Facebook Post", width: 1200, height: 630, device: "social", category: "Social Media" },
     { label: "LinkedIn Post", width: 1200, height: 627, device: "social", category: "Social Media" },
     { label: "YouTube Thumbnail", width: 1280, height: 720, device: "social", category: "Social Media" },
];

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
     // FIX: track whether we're editing a shape label vs a text element
     isShapeLabel?: boolean;
}

// ─── Checkbox sub-renderers ───────────────────────────────────────────────────
function renderCheckboxControl(el: any, onToggle: () => void) {
     const sType: SelectionType = el.selectionType || "checkbox";
     const checked = !!el.checked;
     const accentColor = el.fill || ACCENT;

     if (sType === "checkbox" || sType === "checkbox-round") {
          const rx = sType === "checkbox-round" ? 9 : 3;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <rect x={0} y={0} width={18} height={18} rx={rx}
                         fill={checked ? accentColor : "transparent"}
                         stroke={checked ? accentColor : (el.stroke || "#555")}
                         strokeWidth={el.strokeWidth || 1.5} />
                    {checked && (
                         <path d="M3 9l4 4L15 5" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
               </g>
          );
     }
     if (sType === "radio") {
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <circle cx={9} cy={9} r={8} fill="transparent"
                         stroke={checked ? accentColor : (el.stroke || "#555")}
                         strokeWidth={el.strokeWidth || 1.5} />
                    {checked && <circle cx={9} cy={9} r={4} fill={accentColor} />}
               </g>
          );
     }
     if (sType === "toggle") {
          const trackW = 36; const trackH = 20; const knobSize = 14;
          const knobX = checked ? trackW - knobSize - 3 : 3;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <rect x={0} y={0} width={trackW} height={trackH} rx={trackH / 2}
                         fill={checked ? accentColor : (el.stroke || "#94a3b8")} stroke="none" />
                    <rect x={knobX} y={3} width={knobSize} height={knobSize} rx={knobSize / 2} fill="white" stroke="none" />
               </g>
          );
     }
     if (sType === "dropdown") {
          const boxW = Math.max(el.width - 4, 80); const boxH = 26;
          return (
               <g onClick={(e) => { e.stopPropagation(); onToggle(); }} style={{ cursor: "pointer" }}>
                    <rect x={0} y={0} width={boxW} height={boxH} rx={6} fill="transparent"
                         stroke={el.stroke || "#555"} strokeWidth={el.strokeWidth || 1.5} />
                    <text x={10} y={17} fontSize={12} fontFamily="DM Sans" fill={NAVY2}>
                         {el.checked ? (el.text || "Option") : "Select…"}
                    </text>
                    <path d={`M${boxW - 18} 10 L${boxW - 12} 16 L${boxW - 6} 10`}
                         fill="none" stroke={GRAY2} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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

function getControlWidth(el: any): number {
     const sType: SelectionType = el.selectionType || "checkbox";
     if (sType === "toggle") return 42;
     if (sType === "dropdown") return Math.max(el.width - 4, 80) + 4;
     return 24;
}

// ── Shape label helper — text centered on any shape ──────────────────────────
// FIX: renders label text on top of shapes. pointerEvents none so it never
// blocks clicks on the shape itself.
function ShapeLabel({ el }: { el: any }) {
     if (!el.label) return null;
     const fontSize = Math.max(10, Math.min(el.height * 0.28, 18));
     return (
          <text
               x={el.width / 2}
               y={el.height / 2}
               textAnchor="middle"
               dominantBaseline="central"
               fontSize={fontSize}
               fontFamily={el.labelFont || "DM Sans, sans-serif"}
               fontWeight={el.labelWeight || "600"}
               fill={el.labelColor || "#ffffff"}
               style={{ pointerEvents: "none", userSelect: "none" }}
          >
               {el.label}
          </text>
     );
}

// ── Board sync props ──────────────────────────────────────────────────────────
interface DesignPhaseProps {
     onBack?: () => void;
     projectId?: string;
     initialElements?: CanvasElement[];
     initialFrames?: Frame[];
     // FIX: receives both elements AND frames so board.tsx can syncPatch both
     onElementsChange?: (elements: CanvasElement[], frames?: Frame[]) => void;
     currentUser?: string;
     cursors: Record<string, CursorState>;
     emitCursor: (x: number, y: number) => void;
}

export default function DesignPhase({
     onBack,
     projectId: projectIdProp,
     initialElements,
     initialFrames,
     onElementsChange,
     currentUser,
     cursors,
     emitCursor,
}: DesignPhaseProps) {
     const { projectId: projectIdParam } = useParams<{ projectId: string }>();
     const projectId = projectIdProp ?? projectIdParam;
     const navigate = useNavigate();
     const [projectCtx, setProjectCtx] = useState<any>(null);
     // ── MERGED from Areeba's branch: theme color feeds contextForAI() so
     //    generate/modify calls stay visually consistent with the project ──
     const [themeColor, setThemeColor] = useState<string | null>(null);
     useEffect(() => {
          if (projectCtx?.color && !themeColor) setThemeColor(projectCtx.color);
     }, [projectCtx, themeColor]);

     useEffect(() => {
          if (!projectId) return;
          api.get(`/aiContext/${projectId}`)
               .then((res) => setProjectCtx(res.data))
               .catch(() => {});
     }, [projectId]);

     const [fullscreen, setFullscreen] = useState(false);
     const [activeTool, setActiveTool] = useState<Tool>("select");
     const [elements, setElements] = useState<CanvasElement[]>(initialElements ?? []);
     const [selected, setSelected] = useState<string[]>([]);
     const [dragging, setDragging] = useState<{ id: string; ox: number; oy: number } | null>(null);
     const [drawing, setDrawing] = useState(false);
     const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
     const [currentSketch, setCurrentSketch] = useState<{ x: number; y: number }[]>([]);
     const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
     const [showAI, setShowAI] = useState(true);
     const [aiPanelWidth, setAiPanelWidth] = useState(290);
     const [aiTab, setAiTab] = useState<"suggestion" | "generation" | "image">("suggestion");

     type AIModeKey = "suggestion" | "generation" | "image";
     const storageKey = (mode: AIModeKey) => `ai_chat_${mode}_${projectId || "default"}`;

     const [suggestionMessages, setSuggestionMessages] = useState<AIMessage[]>(() => {
          try { const s = localStorage.getItem(storageKey("suggestion")); return s ? JSON.parse(s) : []; } catch { return []; }
     });
     const [generationMessages, setGenerationMessages] = useState<AIMessage[]>(() => {
          try { const s = localStorage.getItem(storageKey("generation")); return s ? JSON.parse(s) : []; } catch { return []; }
     });
     const [imageMessages, setImageMessages] = useState<AIMessage[]>(() => {
          try { const s = localStorage.getItem(storageKey("image")); return s ? JSON.parse(s) : []; } catch { return []; }
     });

     const aiMessages = aiTab === "suggestion" ? suggestionMessages : aiTab === "generation" ? generationMessages : imageMessages;
     const setAiMessages: React.Dispatch<React.SetStateAction<AIMessage[]>> =
          aiTab === "suggestion" ? setSuggestionMessages : aiTab === "generation" ? setGenerationMessages : setImageMessages;

     const suggestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
     const [suggestionFading, setSuggestionFading] = useState(false);

     const [suggestionHistory, setSuggestionHistory] = useState<AIMessage[]>([]);
     const [generationHistory, setGenerationHistory] = useState<AIMessage[]>([]);
     const [imageHistory, setImageHistory] = useState<AIMessage[]>([]);
     const aiHistory = aiTab === "suggestion" ? suggestionHistory : aiTab === "generation" ? generationHistory : imageHistory;
     const setAiHistory: React.Dispatch<React.SetStateAction<AIMessage[]>> =
          aiTab === "suggestion" ? setSuggestionHistory : aiTab === "generation" ? setGenerationHistory : setImageHistory;

     const [aiInput, setAiInput] = useState("");
     const [aiLoading, setAiLoading] = useState(false);
     const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
     const [editingMsgText, setEditingMsgText] = useState("");

     useEffect(() => { try { localStorage.setItem(storageKey("suggestion"), JSON.stringify(suggestionMessages)); } catch {} }, [suggestionMessages, projectId]);
     useEffect(() => { try { localStorage.setItem(storageKey("generation"), JSON.stringify(generationMessages)); } catch {} }, [generationMessages, projectId]);
     useEffect(() => { try { localStorage.setItem(storageKey("image"), JSON.stringify(imageMessages)); } catch {} }, [imageMessages, projectId]);

     // ── FIX: Restore BOTH elements AND frames from DB on mount ───────────────
     const [frames, setFrames] = useState<Frame[]>(initialFrames ?? []);
     const [activeFrameId, setActiveFrameId] = useState<string | null>(
          initialFrames && initialFrames.length > 0 ? initialFrames[0].id : null
     );

     // ── FIX: only seed the undo/redo stack on the true first load of a board.
     // Every later change to `initialElements` (socket sync, echo of our own
     // pushHistory call bouncing back through the parent, a teammate's edit)
     // must update the live canvas WITHOUT resetting `history`/`historyIndex`,
     // otherwise undo/redo gets wiped every time collaboration data flows in.
     const didInitBoardRef = useRef(false);
     const lastLoadedProjectIdRef = useRef<string | undefined>(undefined);

     useEffect(() => {
          const isNewProject = lastLoadedProjectIdRef.current !== projectId;
          if (isNewProject) {
               didInitBoardRef.current = false;
               lastLoadedProjectIdRef.current = projectId;
          }

          if (!didInitBoardRef.current) {
               // First load for this project: seed elements, frames, AND history.
               if (initialElements && initialElements.length > 0) {
                    setElements(initialElements);
                    setHistory([initialElements]);
                    setHistoryIndex(0);
               }
               if (initialFrames && initialFrames.length > 0) {
                    setFrames(initialFrames);
                    setActiveFrameId(initialFrames[0].id);
               }
               didInitBoardRef.current = true;
          } else {
               // Subsequent syncs: keep the canvas current, leave history alone.
               if (initialElements) setElements(initialElements);
               if (initialFrames && initialFrames.length > 0) setFrames(initialFrames);
          }
     }, [initialElements, initialFrames, projectId]);

     const [zoom, setZoom] = useState(1);
     const [pan, setPan] = useState({ x: 0, y: 0 });
     const [isPanning, setIsPanning] = useState(false);
     const [panStart, setPanStart] = useState({ x: 0, y: 0 });
     const [shiftHeld, setShiftHeld] = useState(false);
     const [editingCardId, setEditingCardId] = useState<string | null>(null);
     const [editingSliderEl, setEditingSliderEl] = useState<any | null>(null);
     const [showScreenPicker, setShowScreenPicker] = useState(false);
     const [customW, setCustomW] = useState(390);
     const [customH, setCustomH] = useState(844);

     const [textEdit, setTextEdit] = useState<TextEditState | null>(null);
     const textareaRef = useRef<HTMLTextAreaElement>(null);
     // ── MERGED from Areeba's branch: separate ref so refineLast() focuses the
     //    AI chat box, not the canvas text-edit overlay (they previously shared
     //    the same ref, which meant refineLast's focus() was a silent no-op) ──
     const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
     const [checkboxEdit, setCheckboxEdit] = useState<{ id: string } | null>(null);

     const [history, setHistory] = useState<CanvasElement[][]>([[]]);
     const [historyIndex, setHistoryIndex] = useState(0);
     const isUndoAvailable = historyIndex > 0;
     const isRedoAvailable = historyIndex < history.length - 1;

     // ── FIX: Presence notifications — detect when users join or leave the room ─
     const [presenceToasts, setPresenceToasts] = useState<{ id: string; msg: string; color: string }[]>([]);
     const prevCursorKeysRef = useRef<Set<string>>(new Set());
     useEffect(() => {
          const currentKeys = new Set(Object.keys(cursors));
          const prev = prevCursorKeysRef.current;
          const joined = [...currentKeys].filter(k => !prev.has(k) && k !== currentUser);
          const left = [...prev].filter(k => !currentKeys.has(k) && k !== currentUser);
          if (joined.length === 0 && left.length === 0) { prevCursorKeysRef.current = currentKeys; return; }
          const newToasts = [
               ...joined.map(k => ({ id: `${k}-join-${Date.now()}`, msg: `${k} joined`, color: "#22c55e" })),
               ...left.map(k => ({ id: `${k}-left-${Date.now()}`, msg: `${k} left`, color: "#f97316" })),
          ];
          if (newToasts.length > 0) {
               setPresenceToasts(prev2 => [...prev2, ...newToasts]);
               setTimeout(() => setPresenceToasts(prev2 => prev2.filter(t => !newToasts.some(n => n.id === t.id))), 3500);
          }
          prevCursorKeysRef.current = currentKeys;
     }, [cursors, currentUser]);

     // ── FIX: pushHistory now saves BOTH elements and frames ──────────────────
     // This is the single function that triggers DB save + socket broadcast.
     // Passing frames is optional — if undefined, current frames state is used.
     // FIX: pushHistory strips _liveTyping markers before saving.
     // onElementsChange receives elements with _liveTyping during live typing
     // (emitted directly from the textarea onChange), but real history entries
     // and DB saves must be clean. We strip the flag here so undo/redo and
     // the DB never see partial in-flight typing state.

     const pushHistory = (newElements: CanvasElement[], newFrames?: Frame[]) => {
     const clean = newElements.map(e => { const { _liveTyping, ...rest } = e as any; return rest as CanvasElement; });
     setHistory(prev => {
          const trimmed = prev.slice(0, historyIndex + 1);
          return [...trimmed, clean].slice(-50);
     });
     setHistoryIndex(prev => Math.min(prev + 1, 49));

     // FIX: pushHistory is very often called from inside a setElements(prev => {
     // ...; pushHistory(next); return next; }) updater throughout this file.
     // Calling onElementsChange (which bubbles up through syncPatch to Board's
     // setAllPhases) SYNCHRONOUSLY inside that updater trips React's "Cannot
     // update a component while rendering a different component" warning,
     // because updater functions run during React's own render/reconciliation
     // phase. queueMicrotask lets DesignPhase finish its own update first,
     // then safely notifies Board immediately afterward — same net effect,
     // zero visible delay, no warning.
     queueMicrotask(() => onElementsChange?.(clean, newFrames ?? frames));
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
     const abortRef = useRef<AbortController | null>(null);

     const selectedEl = elements.find(e => selected.length === 1 && e.id === selected[0]) ?? null;
     const bottomBarVisible = selected.length > 0;
     const activeFrame = frames.find(f => f.id === activeFrameId) || null;

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
               if (textEdit) { if (e.key === "Escape") commitTextEdit(); return; }
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

     // ── FIX: commitTextEdit uses functional setElements to avoid stale closure;
   

   const commitTextEdit = useCallback(() => {
     if (!textEdit) return;
     const snap = textEdit;
     setTextEdit(null);
     setElements(prev => {
          const el = prev.find(e => e.id === snap.id) as any;
          const isShape = el && ["rect", "square", "circle", "ellipse", "diamond"].includes(el.type);
          const patch = isShape ? { label: snap.text } : { text: snap.text };
          const next = prev.map(e => e.id === snap.id ? { ...e, ...patch } as any : e);

          // FIX: same deferral as pushHistory — don't call cross-component
          // setState synchronously inside this updater.
          queueMicrotask(() => {
               onElementsChange?.(next, frames);
               setHistory(h => { const trimmed = h.slice(0, historyIndex + 1); return [...trimmed, next].slice(-50); });
               setHistoryIndex(i => Math.min(i + 1, 49));
          });

          return next;
     });
}, [textEdit, frames, historyIndex, onElementsChange]);
     const openTextEdit = (el: any, isShapeLabel = false) => {
          setTextEdit({
               id: el.id,
               x: el.x,
               y: el.y,
               width: Math.max(el.width, 120),
               height: Math.max(el.height, 40),
               fontSize: el.fontSize || (isShapeLabel ? Math.max(12, Math.min(el.height * 0.28, 18)) : 20),
               fontFamily: el.fontFamily || "DM Sans",
               fontWeight: el.fontWeight || (isShapeLabel ? "600" : "400"),
               fontStyle: el.fontStyle || "normal",
               fill: isShapeLabel ? (el.labelColor || "#ffffff") : (el.fill || NAVY),
               // FIX: for shapes read label not text
               text: isShapeLabel ? (el.label || "") : (el.text || ""),
               isShapeLabel,
          });
     };

     // ── Frame / Screen helpers ────────────────────────────────────────────────
     const getActiveFrameOffset = () => {
          if (!activeFrame) return { ox: 60, oy: 60 };
          return { ox: activeFrame.x + 20, oy: activeFrame.y + 40 };
     };

     const AI_REF = { mobile: { w: 390, h: 844 }, web: { w: 1200, h: 800 } };

     const scaleImageToFrame = (baseW: number, baseH: number) => {
          if (!activeFrame) return { w: baseW, h: baseH };
          const maxW = activeFrame.width * 0.75;
          const maxH = activeFrame.height * 0.55;
          const scale = Math.min(1, maxW / baseW, maxH / baseH);
          return { w: Math.round(baseW * scale), h: Math.round(baseH * scale) };
     };

     const clampToActiveFrame = (el: any): any => {
          if (!activeFrame) return el;
          const fx = activeFrame.x, fy = activeFrame.y;
          const fw = activeFrame.width, fh = activeFrame.height;
          const x = Math.max(fx, Math.min(el.x, fx + fw - 8));
          const y = Math.max(fy, Math.min(el.y, fy + fh - 8));
          return { ...el, x, y, width: Math.min(el.width, fx + fw - x), height: Math.min(el.height, fy + fh - y) };
     };

     // ── FIX: createFrame centers correctly and saves frames to DB ────────────
     const createFrame = (preset: ScreenPreset | null, cw?: number, ch?: number) => {
          const w = preset ? preset.width : (cw || 390);
          const h = preset ? preset.height : (ch || 844);
          const device = preset ? preset.device : "web";
          const label = preset ? preset.label : `${cw || 390} x ${ch || 844}`;
          const frameNum = frames.length + 1;
          const offsetX = frames.length * (w + 80) + 60;
          const newFrame: Frame = {
               id: uid(), name: `Screen ${frameNum}`,
               width: w, height: h, x: offsetX, y: 60,
               device, label,
          };
          const newFrames = [...frames, newFrame];
          setFrames(newFrames);
          setActiveFrameId(newFrame.id);
          setShowScreenPicker(false);

          // FIX: center viewport on the new frame properly
          const svg = canvasRef.current;
          if (svg) {
               const rect = svg.getBoundingClientRect();
               const targetZoom = Math.min(1, (rect.height - 160) / h, (rect.width - 120) / w);
               setZoom(targetZoom);
               setPan({
                    x: rect.width / 2 - (newFrame.x + w / 2) * targetZoom,
                    y: rect.height / 2 - (newFrame.y + h / 2) * targetZoom + 20,
               });
          }

          // FIX: persist new frame immediately to DB
          onElementsChange?.(elements, newFrames);
     };

     // ── FIX: focusFrame also centers correctly ────────────────────────────────
     const focusFrame = (f: Frame) => {
          setActiveFrameId(f.id);
          const svg = canvasRef.current;
          if (svg) {
               const rect = svg.getBoundingClientRect();
               const targetZoom = Math.min(1, (rect.height - 160) / f.height, (rect.width - 120) / f.width);
               setZoom(targetZoom);
               setPan({
                    x: rect.width / 2 - (f.x + f.width / 2) * targetZoom,
                    y: rect.height / 2 - (f.y + f.height / 2) * targetZoom + 20,
               });
          }
     };

     const mapAIElement = (raw: any, offsetX = 0, offsetY = 0): CanvasElement => ({
          id: uid(), type: raw.type || "rect",
          x: (raw.x ?? 50) + offsetX, y: (raw.y ?? 50) + offsetY,
          width: Math.max(8, raw.width ?? 200), height: Math.max(8, raw.height ?? 48),
          fill: raw.fill || themeColor || projectCtx?.color || "#3b82f6", stroke: raw.stroke || "none",
          strokeWidth: raw.strokeWidth ?? 0, opacity: raw.opacity ?? 1, rotation: raw.rotation ?? 0,
          borderRadius: raw.borderRadius ?? 0,
          ...(raw.text !== undefined ? { text: raw.text } : {}),
          ...(raw.fontSize !== undefined ? { fontSize: raw.fontSize } : {}),
          ...(raw.fontFamily !== undefined ? { fontFamily: raw.fontFamily } : {}),
          ...(raw.fontWeight !== undefined ? { fontWeight: raw.fontWeight } : {}),
          ...(raw.checked !== undefined ? { checked: raw.checked } : {}),
          ...(raw.progressValue !== undefined ? { progressValue: raw.progressValue } : {}),
          ...(raw.imageUrl !== undefined ? { imageUrl: raw.imageUrl } : {}),
          ...(raw.shadow !== undefined ? { shadow: raw.shadow } : {}),
          ...(raw.gradient !== undefined ? { gradient: raw.gradient } : {}),
          ...(raw.gradientColor !== undefined ? { gradientColor: raw.gradientColor } : {}),
     });

     const getViewportCenter = () => {
          const svg = canvasRef.current;
          if (!svg) return { cx: 400, cy: 300 };
          const rect = svg.getBoundingClientRect();
          return { cx: (rect.width / 2 - pan.x) / zoom, cy: (rect.height / 2 - pan.y) / zoom };
     };

     // ── MERGED from Areeba's branch: single source of truth for the project
     //    context sent on every AI call (chat/modify/generate) ──────────────
     const contextForAI = () => ({
          projectName: projectCtx?.projectName,
          boardSummary: projectCtx?.boardSummary,
          targetUser: projectCtx?.targetUser,
          purpose: projectCtx?.purpose,
          keyFeatures: projectCtx?.keyFeatures,
          outOfScope: projectCtx?.outOfScope,
          knownConstraints: projectCtx?.knownConstraints,
          color: themeColor || projectCtx?.color,
     });

     const aiPost = async (path: string, data: any) => {
          const { default: axios } = await import("axios");
          const rawBase: string = (api.defaults?.baseURL || "").replace(/\/+$/, "");
          const absoluteBase = rawBase.startsWith("http")
               ? rawBase : rawBase ? `${window.location.origin}${rawBase}` : "http://localhost:5000/api";
          const candidates: Array<() => Promise<any>> = [
               () => api.post(`/ai${path}`, data),
               () => axios.post(`${absoluteBase}/ai${path}`, data, { headers: { "Content-Type": "application/json" }, withCredentials: true }),
               () => axios.post(`http://localhost:5000/api/ai${path}`, data, { headers: { "Content-Type": "application/json" }, withCredentials: true }),
          ];
          let lastErr: any;
          for (const attempt of candidates) {
               try {
                    const res = await attempt();
                    if (res.status === 404) { lastErr = new Error(`404`); continue; }
                    return res;
               } catch (err: any) { lastErr = err; if (err.response && err.response.status !== 404) throw err; }
          }
          throw new Error(`Cannot reach the AI server.`);
     };

     const modifySelectedWithAI = async (instruction: string) => {
          if (!selectedEl) return false;
          const modKeywords = ["change", "update", "modify", "make", "set", "turn", "color", "round", "bold", "resize", "move", "bigger", "smaller", "darker", "lighter", "transparent", "opacity"];
          if (!modKeywords.some(k => instruction.toLowerCase().includes(k))) return false;
          const originalId = selectedEl.id;
          try {
               const res = await aiPost("/modify", { element: selectedEl, instruction, projectContext: contextForAI() });
               if (res.data?.success && res.data?.element) {
                    const patched = res.data.element as CanvasElement;
                    const updatedElements = elements.map(e => e.id === originalId ? { ...e, ...patched, id: originalId } : e);
                    setElements(updatedElements);
                    pushHistory(updatedElements);
                    setAiMessages(prev => [...prev, { role: "assistant", content: `✓ Updated the selected ${selectedEl.type} — "${instruction}"` }]);
                    return true;
               }
          } catch (err: any) {
               const msg = err?.response?.data?.error || err.message || "Modification failed.";
               setAiMessages(prev => [...prev, { role: "assistant", content: `⚠ Modify error: ${msg}` }]);
               return true;
          }
          return false;
     };

     // ── MERGED from Areeba's branch: track last generation so Regenerate/Refine
     //    can resend it without the user retyping ─────────────────────────────
     const [lastGeneration, setLastGeneration] = useState<{ prompt: string; device: "mobile" | "web" } | null>(null);

     const runLayoutGeneration = async (prompt: string, device: "mobile" | "web") => {
          setLastGeneration({ prompt, device });
          try {
               const { ox, oy } = getActiveFrameOffset();
               const canvasW = activeFrame?.width ?? (device === "mobile" ? 390 : 1280);
               const canvasH = activeFrame?.height ?? (device === "mobile" ? 844 : 720);
               const res = await aiPost("/generate", { prompt, device, canvasW, canvasH, projectContext: contextForAI() });
               if (res.data?.success && Array.isArray(res.data.elements) && res.data.elements.length > 0) {
                    const rawEls: any[] = res.data.elements;
                    const minX = Math.min(...rawEls.map((e: any) => e.x ?? 0));
                    const minY = Math.min(...rawEls.map((e: any) => e.y ?? 0));
                    const newElements = rawEls.map((raw: any) => mapAIElement(raw, ox - minX, oy - minY));
                    const nextElements = [...elements, ...newElements];
                    setElements(nextElements);
                    pushHistory(nextElements);
                    setSelected(newElements.map(e => e.id));
                    setGenerationMessages(prev => [...prev, { role: "assistant", content: `✓ Generated ${newElements.length} elements for "${prompt}".`, generatedCount: newElements.length }]);
               } else {
                    throw new Error(res.data?.error || "No elements returned.");
               }
          } catch (err: any) {
               const msg = err?.response?.data?.error || err.message || "Layout generation failed.";
               setGenerationMessages(prev => [...prev, { role: "assistant", content: `⚠ ${msg}` }]);
          }
          setAiLoading(false);
     };

     // ── MERGED from Areeba's branch: retry the same request, or prefill the
     //    input so the user can tweak the prompt instead of retyping it ──────
     const regenerateLast = () => {
          if (!lastGeneration || aiLoading) return;
          setAiLoading(true);
          setGenerationMessages(prev => [...prev, { role: "user", content: `↻ Regenerate: "${lastGeneration.prompt}"` }]);
          runLayoutGeneration(lastGeneration.prompt, lastGeneration.device);
     };

     const refineLast = () => {
          if (!lastGeneration) return;
          setAiInput(lastGeneration.prompt);
          aiTextareaRef.current?.focus();
     };

     const startSuggestionTimer = () => {
          if (suggestionTimerRef.current) clearTimeout(suggestionTimerRef.current);
          setSuggestionFading(false);
          suggestionTimerRef.current = setTimeout(() => {
               setSuggestionFading(true);
               setTimeout(() => { setSuggestionMessages(prev => prev.filter(m => !(m.role === "assistant" && m.suggestions))); setSuggestionFading(false); }, 3000);
          }, 27000);
     };

     const cancelSuggestionTimer = () => {
          if (suggestionTimerRef.current) { clearTimeout(suggestionTimerRef.current); suggestionTimerRef.current = null; }
          setSuggestionFading(false);
     };

     const sendAIMessage = async () => {
          if (!aiInput.trim() || aiLoading) return;
          const userMsg = aiInput.trim();
          setAiInput("");
          abortRef.current = new AbortController();
          setAiLoading(true);

          if (aiTab === "suggestion") {
               setSuggestionMessages(prev => [...prev, { role: "user", content: userMsg }]);
               cancelSuggestionTimer();
               const currentHistory: AIMessage[] = [...suggestionHistory, { role: "user", content: userMsg }];
               try {
                    const res = await aiPost("/chat", { messages: currentHistory, phase: "design", projectContext: contextForAI(), forcedMode: "suggestion", extras: { elementCount: elements.length, activeTab: aiTab, device: activeFrame?.device || "web", canvasW: activeFrame?.width, canvasH: activeFrame?.height } });
                    const data = res.data;
                    if (data?.success) {
                         const hasSuggestions = Array.isArray(data.suggestions) && data.suggestions.length > 0;
                         const msg: AIMessage = { role: "assistant", content: data.summary || "Here are some design suggestions:", ...(hasSuggestions ? { suggestions: data.suggestions } : {}) };
                         setSuggestionMessages(prev => [...prev, msg]);
                         setSuggestionHistory([...currentHistory, { role: "assistant", content: msg.content }]);
                         if (hasSuggestions) startSuggestionTimer();
                    } else throw new Error(data?.error || "Server error");
               } catch (err: any) {
                    const errMsg = err?.response?.data?.error || err?.message || "Suggestion failed.";
                    setSuggestionMessages(prev => [...prev, { role: "assistant", content: `⚠ ${errMsg}` }]);
               }
               setAiLoading(false);
               return;
          }

          if (aiTab === "image") {
               setImageMessages(prev => [...prev, { role: "user", content: userMsg }]);
               try {
                    const res = await aiPost("/generate-image", { prompt: userMsg });
                    if (res.data?.success && res.data?.imageUrl) {
                         const { ox, oy } = getActiveFrameOffset();
                         const { w: imgW, h: imgH } = scaleImageToFrame(360, 280);
                         const imgEl = mapAIElement({ type: "image", x: ox, y: oy, width: imgW, height: imgH, fill: "#e8edf4", stroke: "#e2e8f0", strokeWidth: 1.5, borderRadius: Math.round(imgW * 0.03), imageUrl: res.data.imageUrl });
                         const nextEls = [...elements, imgEl];
                         setElements(nextEls); pushHistory(nextEls); setSelected([imgEl.id]);
                         setImageMessages(prev => [...prev, { role: "assistant" as const, content: "✓ Image generated and added to canvas!", imageUrl: res.data.imageUrl } as any]);
                    } else throw new Error(res.data?.error || "No image returned.");
               } catch (err: any) {
                    const msg = err?.response?.data?.error || err.message || "Image generation failed.";
                    setImageMessages(prev => [...prev, { role: "assistant", content: `⚠ ${msg}` }]);
               }
               setAiLoading(false);
               return;
          }

          if (aiTab === "generation") {
               setGenerationMessages(prev => [...prev, { role: "user", content: userMsg }]);
               if (selectedEl) {
                    const lower = userMsg.toLowerCase();
                    const modKeywords = ["change", "update", "modify", "make", "set", "turn", "color", "round", "bold", "resize", "move", "bigger", "smaller", "darker", "lighter", "transparent", "opacity", "italic", "underline", "shadow", "border", "gradient"];
                    if (modKeywords.some(k => lower.includes(k))) {
                         const consumed = await modifySelectedWithAI(userMsg);
                         if (consumed) { setAiLoading(false); return; }
                    }
               }
               const device = (activeFrame?.device === "mobile" || activeFrame?.device === "tablet") ? "mobile" : "web";
               await runLayoutGeneration(userMsg, device);
               return;
          }
          setAiLoading(false);
     };

     const handleIconPick = (iconName: string) => {
          const { ox, oy } = getActiveFrameOffset();
          const iconSize = activeFrame ? Math.round(Math.min(activeFrame.width, activeFrame.height) * 0.08) : 48;
          const rawEl: any = { id: uid(), type: "icon", x: ox + Math.random() * 80, y: oy + Math.random() * 80, width: iconSize, height: iconSize, rotation: 0, fill: NAVY, stroke: "none", strokeWidth: 0, opacity: 1, iconName, frameId: activeFrameId || undefined };
          const el = clampToActiveFrame(rawEl);
          setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
          setSelected([el.id]); setActiveTool("select");
     };

     const handleImageAdd = (src: string) => {
          const { ox, oy } = getActiveFrameOffset();
          const { w: imgW, h: imgH } = scaleImageToFrame(320, 220);
          const rawEl: any = { id: uid(), type: "image", x: ox + Math.random() * 40, y: oy + Math.random() * 40, width: imgW, height: imgH, rotation: 0, fill: "#e8edf4", stroke: GRAY, strokeWidth: 1.5, opacity: 1, imageUrl: src, borderRadius: Math.round(imgW * 0.03), frameId: activeFrameId || undefined };
          const el = clampToActiveFrame(rawEl);
          setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
          setSelected([el.id]); setActiveTool("select");
     };

     const handleNavbarCfgChange = (newCfg: NavbarConfig) => {
          if (!selectedEl || (selectedEl as any).type !== "navbar") return;
          updateElement(selectedEl.id, { navbarConfig: newCfg, height: newCfg.height } as any);
     };

     const handleCanvasMouseDown = (e: React.MouseEvent) => {
          if (e.button === 1) { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }
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

     // ── FIX: handleSvgMouseMove also emits cursor for live presence ──────────
     // We split the two concerns: canvas tool logic vs cursor broadcast.
     // emitCursor uses RAW screen coords (not canvas coords) because LiveCursors
     // renders in screen-space with position:absolute over the canvas div.
     const handleSvgMouseMove = (e: React.MouseEvent) => {
          // ── Live cursor broadcast (screen-space, not canvas-space) ──────────
          const svgEl = canvasRef.current;
          if (svgEl) {
               const rect = svgEl.getBoundingClientRect();
               emitCursor(e.clientX - rect.left, e.clientY - rect.top);
          }

          // ── Existing tool logic (canvas-space via getCanvasPos) ──────────────
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
               const dx = pos.x - resizing.startX; const dy = pos.y - resizing.startY;
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
          const wasDragging = !!dragging; const wasResizing = !!resizing; const wasRotating = !!rotating;
          setIsPanning(false); setResizing(null); setRotating(null); setDragging(null);
          if (wasDragging || wasResizing || wasRotating) { setElements(prev => { pushHistory(prev); return prev; }); }
          if (!drawing) return;
          const pos = getCanvasPos(e);
          if (activeTool === "sketch" && currentSketch.length > 1) {
               const el: any = { id: uid(), type: "sketch", x: Math.min(...currentSketch.map(p => p.x)), y: Math.min(...currentSketch.map(p => p.y)), width: 0, height: 0, rotation: 0, fill: "none", stroke: NAVY, strokeWidth: 2, opacity: 1, sketchPoints: [currentSketch] };
               setElements(prev => { const next = [...prev, el]; pushHistory(next); return next; });
               setCurrentSketch([]);
          } else if (drawStart && activeTool !== "sketch" && activeTool !== "select" && activeTool !== "image") {
               const w = Math.max(Math.abs(pos.x - drawStart.x), 40);
               const h = Math.max(Math.abs(pos.y - drawStart.y), 30);
               const x = Math.min(pos.x, drawStart.x); const y = Math.min(pos.y, drawStart.y);
               const frameScale = activeFrame ? Math.min(activeFrame.width / 390, activeFrame.height / 844) : 1;
               const scaledFontSize = Math.max(10, Math.round(20 * Math.sqrt(frameScale)));
               const scaledCardRadius = Math.round(12 * Math.min(1.5, frameScale));
               const extras: Record<string, Partial<CanvasElement>> = {
                    text: { text: "Text here", fontSize: scaledFontSize, fontFamily: "DM Sans", fontWeight: "400", fill: NAVY, stroke: "none" } as any,
                    checkbox: { text: "Option", checked: false, fill: "transparent", stroke: "#555", strokeWidth: 1.5, selectionType: "checkbox" } as any,
                    slider: { sliderValue: 0, fill: ACCENT, carouselSlides: DEFAULT_CAROUSEL_SLIDES.map(s => ({ ...s })) } as any,
                    card: { fill: WHITE, stroke: GRAY, strokeWidth: 1, borderRadius: scaledCardRadius, shadow: true, cardTitle: "Card Title", cardBody: "Add a description here." } as any,
                    progress: { progressValue: 60, fill: ACCENT } as any,
                    icon: { iconName: "home", fill: NAVY, stroke: "none" } as any,
                    circle: { fill: "#ef4444" },
                    ellipse: { fill: ACCENT },
                    square: { fill: ACCENT },
                    diamond: { fill: "#a855f7" },
                    line: { fill: "none", stroke: NAVY, strokeWidth: Math.max(1, Math.round(2 * frameScale)) },
                    imagebox: { fill: "#dde6f0", stroke: "#b0c4d8", strokeWidth: 1.5, imageUrl: "" } as any,
               };
               const rawNewEl: any = { id: uid(), type: activeTool as ElementType, x, y, width: w, height: h, rotation: 0, fill: ACCENT, stroke: "none", strokeWidth: 1, opacity: 1, frameId: activeFrameId || undefined, ...(extras[activeTool] ?? {}) };
               const newEl = clampToActiveFrame(rawNewEl);
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

     // ── FIX: double-click on shapes opens label editor ────────────────────────
     const handleElementDoubleClick = (e: React.MouseEvent, id: string) => {
          e.stopPropagation();
          const el = elements.find(el => el.id === id) as any;
          if (!el) return;
          if (el.type === "card") { setEditingCardId(id); setSelected([id]); setDragging(null); return; }
          if (el.type === "text") { setDragging(null); setSelected([id]); openTextEdit(el, false); return; }
          if (el.type === "checkbox") { setDragging(null); setSelected([id]); setCheckboxEdit({ id }); return; }
          if (el.type === "slider") { setEditingSliderEl({ ...el }); setSelected([id]); setDragging(null); return; }
          // FIX: double-click any shape = add/edit text label on top of shape
          if (["rect", "square", "circle", "ellipse", "diamond"].includes(el.type)) {
               setDragging(null);
               setSelected([id]);
               openTextEdit(el, true); // isShapeLabel = true
               return;
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
               if (el) { const copy = { ...el, id: uid(), x: el.x + 20, y: el.y + 20 }; setElements(prev => { const next = [...prev, copy]; pushHistory(next); return next; }); setSelected([copy.id]); }
          }
          if (action === "lock") updateElement(id, { locked: !(elements.find(e => e.id === id) as any)?.locked } as any);
          if (action === "bringFront") updateElement(id, { zIndex: 999 } as any);
          if (action === "sendBack") updateElement(id, { zIndex: -1 } as any);
          setContextMenu(null);
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
          const cx = el.x + el.width / 2; const cy = el.y + el.height / 2;
          const startAngle = Math.atan2(pos.y - cy, pos.x - cx) * (180 / Math.PI);
          setDragging(null); setResizing(null);
          setRotating({ id, cx, cy, startAngle, origRotation: el.rotation || 0 });
     };

     const handleToolSelect = (tool: Tool) => {
          if (tool === "navbar") {
               const canvasWidth = canvasRef.current?.getBoundingClientRect().width ?? 900;
               const navEl: any = { id: uid(), type: "navbar", x: 40, y: 60, width: Math.min(canvasWidth - 80, 860), height: DEFAULT_NAVBAR_CFG.height, rotation: 0, opacity: 1, fill: DEFAULT_NAVBAR_CFG.bg, stroke: "none", strokeWidth: 0, navbarConfig: { ...DEFAULT_NAVBAR_CFG } };
               setElements(prev => { const next = [...prev, navEl]; pushHistory(next); return next; });
               setSelected([navEl.id]); setActiveTool("select"); return;
          }
          setActiveTool(tool);
     };

     const HANDLES = [
          { id: "nw", cx: 0, cy: 0, cursor: "nw-resize" }, { id: "n", cx: 0.5, cy: 0, cursor: "n-resize" },
          { id: "ne", cx: 1, cy: 0, cursor: "ne-resize" }, { id: "e", cx: 1, cy: 0.5, cursor: "e-resize" },
          { id: "se", cx: 1, cy: 1, cursor: "se-resize" }, { id: "s", cx: 0.5, cy: 1, cursor: "s-resize" },
          { id: "sw", cx: 0, cy: 1, cursor: "sw-resize" }, { id: "w", cx: 0, cy: 0.5, cursor: "w-resize" },
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
               onMouseDown: (e: React.MouseEvent) => handleElementMouseDown(e, el.id),
               onDoubleClick: (e: React.MouseEvent) => handleElementDoubleClick(e, el.id),
               onContextMenu: (e: React.MouseEvent) => handleElementRightClick(e, el.id),
               style: {
                    cursor: el.locked ? "not-allowed" : isRotating ? "crosshair" : isResizing ? "crosshair" : dragging?.id === el.id ? "grabbing" : "grab",
                    pointerEvents: "all" as const,
                    opacity: isBeingTextEdited && !textEdit?.isShapeLabel ? 0 : 1,
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
               <g key={el.id} {...commonProps}>
                    {el.sketchPoints?.map((pts: any[], i: number) => (
                         <polyline key={i} points={pts.map((p: any) => `${p.x},${p.y}`).join(" ")}
                              fill="none" stroke={el.stroke || NAVY} strokeWidth={el.strokeWidth}
                              strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} />
                    ))}
               </g>
          );

          return (
               <g key={el.id} {...commonProps} transform={transform} filter={filter} opacity={el.opacity}>
                    <GD />

                    {/* ── FIX: All shape types now render ShapeLabel on top ── */}
                    {el.type === "rect" && (
                         <>
                              <rect width={el.width} height={el.height} fill={fillVal}
                                   stroke={el.stroke} strokeWidth={el.strokeWidth} rx={el.borderRadius || 0} />
                              <ShapeLabel el={el} />
                         </>
                    )}
                    {el.type === "square" && (
                         <>
                              <rect width={el.width} height={el.height} fill={fillVal}
                                   stroke={el.stroke} strokeWidth={el.strokeWidth} rx={el.borderRadius || 0} />
                              <ShapeLabel el={el} />
                         </>
                    )}
                    {(el.type === "circle" || el.type === "ellipse") && (
                         <>
                              <ellipse cx={el.width / 2} cy={el.height / 2} rx={el.width / 2} ry={el.height / 2}
                                   fill={fillVal} stroke={el.stroke} strokeWidth={el.strokeWidth} />
                              <ShapeLabel el={el} />
                         </>
                    )}
                    {el.type === "diamond" && (
                         <>
                              <polygon points={`${el.width / 2},0 ${el.width},${el.height / 2} ${el.width / 2},${el.height} 0,${el.height / 2}`}
                                   fill={fillVal} stroke={el.stroke} strokeWidth={el.strokeWidth} />
                              <ShapeLabel el={el} />
                         </>
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

                    {el.type === "checkbox" && (() => {
                         const isEditingThis = checkboxEdit?.id === el.id;
                         const sType: SelectionType = el.selectionType || "checkbox";
                         const ctrlW = getControlWidth(el);
                         const ctrlY = sType === "dropdown" ? 0 : Math.max(0, (el.height - 18) / 2);
                         const labelX = sType === "dropdown" ? 0 : ctrlW + 4;
                         const labelY = el.height / 2 + 5;
                         return (
                              <>
                                   <g transform={`translate(0, ${ctrlY})`}>
                                        {renderCheckboxControl(el, () => updateElement(el.id, { checked: !el.checked } as any))}
                                   </g>
                                   {sType !== "dropdown" && (
                                        isEditingThis ? (
                                             <foreignObject x={labelX} y={ctrlY} width={Math.max(el.width - labelX - 4, 80)} height={22}>
                                                  <input
                                                       // @ts-ignore
                                                       xmlns="http://www.w3.org/1999/xhtml"
                                                       autoFocus defaultValue={el.text}
                                                       onBlur={e => { updateElement(el.id, { text: e.target.value } as any); setCheckboxEdit(null); }}
                                                       onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") { updateElement(el.id, { text: (e.target as HTMLInputElement).value } as any); setCheckboxEdit(null); } e.stopPropagation(); }}
                                                       onClick={e => e.stopPropagation()}
                                                       style={{ background: "rgba(255,255,255,0.95)", border: `1.5px solid ${ACCENT}`, borderRadius: 4, color: NAVY, fontSize: 12, fontFamily: "DM Sans, sans-serif", padding: "1px 5px", outline: "none", width: "100%", boxSizing: "border-box" as const, boxShadow: `0 0 0 3px ${ACCENT}33` }}
                                                  />
                                             </foreignObject>
                                        ) : (
                                             <text x={labelX} y={labelY} fontSize={13} fontFamily="DM Sans" fill={NAVY}>{el.text}</text>
                                        )
                                   )}
                                   <rect width={el.width} height={el.height} fill="transparent" style={{ cursor: "grab" }} />
                              </>
                         );
                    })()}

                    {el.type === "navbar" && (() => {
                         const cfg: NavbarConfig = { ...DEFAULT_NAVBAR_CFG, ...(el.navbarConfig || {}) };
                         // FIX: use el.height (the actual resizable element height) as the
                         // foreignObject height so bottom icons are never clipped by overflow:hidden.
                         const navH = Math.max(cfg.height, el.height);
                         return (
                              <foreignObject x={0} y={0} width={el.width} height={navH} style={{ overflow: "visible" }}>
                                   {/* @ts-ignore */}
                                   <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: el.width, height: navH }}>
                                        <NavbarElement cfg={{ ...cfg, height: navH }} width={el.width} />
                                   </div>
                              </foreignObject>
                         );
                    })()}

                    {el.type === "slider" && (() => {
                         const slides: CarouselSlide[] = el.carouselSlides || DEFAULT_CAROUSEL_SLIDES;
                         const activeIdx: number = el.sliderValue || 0;
                         const W = el.width; const H = el.height; const BR = el.borderRadius || 12;
                         const accentColor = el.fill || ACCENT;
                         const cur = slides[activeIdx] || slides[0];
                         const prevIdx = ((activeIdx - 1) + slides.length) % slides.length;
                         const nextIdx = (activeIdx + 1) % slides.length;
                         return (
                              <g>
                                   <defs><clipPath id={`carousel-clip-${el.id}`}><rect width={W} height={H} rx={BR} /></clipPath></defs>
                                   <rect width={W} height={H} rx={BR} fill={cur.color || "#1e3a5f"} clipPath={`url(#carousel-clip-${el.id})`} />
                                   <foreignObject x={0} y={0} width={W} height={H} clipPath={`url(#carousel-clip-${el.id})`} style={{ overflow: "hidden" }}>
                                        {/* @ts-ignore */}
                                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: W, height: H, position: "relative", overflow: "hidden", background: cur.color || "#1e3a5f", borderRadius: BR, userSelect: "none" }}>
                                             {cur.type === "image" && cur.src && (<div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><img src={cur.src} alt={cur.title} style={{ position: "absolute", width: "100%", height: "100%", objectFit: cur.objectFit || "cover", objectPosition: `${cur.objectPositionX ?? 50}% ${cur.objectPositionY ?? 50}%`, pointerEvents: "none", display: "block" }} /></div>)}
                                             {cur.type === "video" && cur.src && (<div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><video src={cur.src} autoPlay muted loop playsInline style={{ position: "absolute", width: "100%", height: "100%", objectFit: cur.objectFit || "cover", pointerEvents: "none", display: "block" }} /></div>)}
                                             {(cur.type === "color" || !cur.src) && (<div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.45 }}><svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" /></svg></div>)}
                                             <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)", pointerEvents: "none" }} />
                                             {(cur.title || cur.caption) && (<div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: `${Math.max(10, H * 0.05)}px ${Math.max(12, W * 0.04)}px`, pointerEvents: "none" }}>{cur.title && <div style={{ color: "#fff", fontSize: Math.max(12, Math.min(22, W * 0.048)), fontWeight: 700, fontFamily: "DM Sans, sans-serif", lineHeight: 1.3, textShadow: "0 1px 6px rgba(0,0,0,0.5)", marginBottom: 3 }}>{cur.title}</div>}{cur.caption && <div style={{ color: "rgba(255,255,255,0.78)", fontSize: Math.max(9, Math.min(13, W * 0.03)), fontFamily: "DM Sans, sans-serif", lineHeight: 1.4 }}>{cur.caption}</div>}</div>)}
                                             <div style={{ position: "absolute", top: 10, left: 12, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: Math.max(8, Math.min(11, W * 0.025)), fontFamily: "DM Sans, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, pointerEvents: "none" }}>{cur.type === "video" ? "▶ Video" : cur.type === "image" ? "🖼 Image" : "◼ Color"}</div>
                                             <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", borderRadius: 20, padding: "3px 9px", fontSize: Math.max(8, Math.min(11, W * 0.025)), fontFamily: "DM Sans, sans-serif", pointerEvents: "none" }}>{activeIdx + 1} / {slides.length}</div>
                                             {slides.length > 1 && (<><button onClick={(e) => { e.stopPropagation(); handleSliderTabClick(el.id, prevIdx); }} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: Math.max(28, W * 0.07), height: Math.max(28, W * 0.07), borderRadius: "50%", background: "rgba(0,0,0,0.42)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", fontSize: Math.max(10, W * 0.025), lineHeight: 1 }}>‹</button><button onClick={(e) => { e.stopPropagation(); handleSliderTabClick(el.id, nextIdx); }} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: Math.max(28, W * 0.07), height: Math.max(28, W * 0.07), borderRadius: "50%", background: "rgba(0,0,0,0.42)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", fontSize: Math.max(10, W * 0.025), lineHeight: 1 }}>›</button></>)}
                                             <div style={{ position: "absolute", bottom: Math.max(8, H * 0.06 + (cur.title ? H * 0.12 : 0)), left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, alignItems: "center", pointerEvents: "none" }}>{slides.map((_, i) => (<div key={i} style={{ width: i === activeIdx ? Math.max(16, W * 0.04) : Math.max(6, W * 0.015), height: Math.max(6, W * 0.015), borderRadius: 99, background: i === activeIdx ? accentColor : "rgba(255,255,255,0.45)", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }} />))}</div>
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
                              <CardEditor id={el.id} width={el.width} height={el.height} cardTitle={titleHtml} cardBody={bodyHtml} fill={el.fill || WHITE} stroke={el.stroke || GRAY} strokeWidth={el.strokeWidth || 1} borderRadius={(el as any).borderRadius || 12} shadow={(el as any).shadow} zoom={zoom} onChange={patch => updateElement(el.id, patch as any)} onExitEdit={() => setEditingCardId(null)} />
                         ) : (
                              <>
                                   <rect width={el.width} height={el.height} rx={(el as any).borderRadius || 12} fill={el.fill || WHITE} stroke={el.stroke || GRAY} strokeWidth={el.strokeWidth || 1} />
                                   <foreignObject x={0} y={0} width={el.width} height={el.height} style={{ overflow: "hidden", pointerEvents: "none" }}>
                                        {/* @ts-ignore */}
                                        <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "100%", height: "100%", padding: "14px 16px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6, fontFamily: "DM Sans, sans-serif", overflow: "hidden", userSelect: "none" }}>
                                             <div dangerouslySetInnerHTML={{ __html: titleHtml }} style={{ fontSize: 14, fontWeight: 700, color: NAVY, lineHeight: 1.4 }} />
                                             <div style={{ height: 1, background: GRAY, flexShrink: 0 }} />
                                             <div dangerouslySetInnerHTML={{ __html: bodyHtml }} style={{ fontSize: 12, color: "#334155", lineHeight: 1.65 }} />
                                             <style>{`a{color:${ACCENT};text-decoration:underline;}strong,b{font-weight:700;}em,i{font-style:italic;}`}</style>
                                        </div>
                                   </foreignObject>
                                   <rect width={el.width} height={el.height} rx={(el as any).borderRadius || 12} fill="transparent" style={{ cursor: "text" }} />
                              </>
                         );
                    })()}

                    {el.type === "progress" && (
                         <>
                              <rect width={el.width} height={el.height} rx={el.height / 2} fill={GRAY} />
                              <rect width={(el.progressValue || 60) / 100 * el.width} height={el.height} rx={el.height / 2} fill={ACCENT} />
                              <text x={el.width / 2} y={el.height / 2 + 4} fontSize={10} fontFamily="DM Sans" fill={WHITE} textAnchor="middle">{el.progressValue || 60}%</text>
                         </>
                    )}
                    {el.type === "icon" && (
                         <svg width={el.width} height={el.height} viewBox="0 0 24 24" fill="none" stroke={el.fill || NAVY} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                              {renderIconPaths(el.iconName || "home")}
                         </svg>
                    )}
                    {(el.type === "image" || el.type === "imagebox") && (
                         <>
                              <defs><clipPath id={`imgclip-${el.id}`}><rect width={el.width} height={el.height} rx={el.borderRadius || 6} /></clipPath></defs>
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
          if (textEdit?.id === el.id && !textEdit?.isShapeLabel) return null;
          const w = el.width; const h = el.height; const R = 5;
          const rot = el.rotation || 0; const cx = w / 2;
          const isActiveResize = resizing?.id === el.id;
          const isActiveRotate = rotating?.id === el.id;
          const ROT_OFFSET = 28 / zoom; const rotHandleR = 6 / zoom;
          return (
               <g key={`overlay-${el.id}`} transform={`translate(${el.x}, ${el.y}) rotate(${rot}, ${cx}, ${h / 2})`}>
                    <rect x={-2} y={-2} width={w + 4} height={h + 4} fill="none"
                         stroke={isActiveRotate ? "#a855f7" : ACCENT}
                         strokeWidth={(isActiveResize || isActiveRotate ? 2 : 1.5) / zoom}
                         strokeDasharray={isActiveResize || isActiveRotate ? "none" : `${5 / zoom} ${3 / zoom}`}
                         rx={2} style={{ pointerEvents: "none" }} />
                    <line x1={cx} y1={-2} x2={cx} y2={-ROT_OFFSET + rotHandleR} stroke={isActiveRotate ? "#a855f7" : ACCENT} strokeWidth={1.5 / zoom} strokeDasharray={`${3 / zoom} ${2 / zoom}`} style={{ pointerEvents: "none" }} />
                    <circle cx={cx} cy={-ROT_OFFSET} r={rotHandleR} fill={isActiveRotate ? "#a855f7" : WHITE} stroke={isActiveRotate ? "#a855f7" : ACCENT} strokeWidth={1.5 / zoom} style={{ cursor: "crosshair", pointerEvents: "all" }} onMouseDown={ev => handleRotateMouseDown(ev, el.id)} />
                    <text x={cx} y={-ROT_OFFSET + 4 / zoom} textAnchor="middle" fontSize={8 / zoom} fill={isActiveRotate ? WHITE : ACCENT} style={{ pointerEvents: "none", userSelect: "none" }}>↻</text>
                    {isActiveRotate && (<g style={{ pointerEvents: "none" }}><rect x={cx - 28 / zoom} y={-ROT_OFFSET - 24 / zoom} width={56 / zoom} height={18 / zoom} rx={4 / zoom} fill="#a855f7" /><text x={cx} y={-ROT_OFFSET - 12 / zoom} textAnchor="middle" fontSize={10 / zoom} fontFamily="DM Sans" fill={WHITE}>{Math.round(((rot % 360) + 360) % 360)}°</text></g>)}
                    {isActiveResize && (<g style={{ pointerEvents: "none" }}><rect x={cx - 60 / zoom} y={h + 8 / zoom} width={120 / zoom} height={18 / zoom} rx={4 / zoom} fill={NAVY2} opacity={0.9} /><text x={cx} y={h + 19 / zoom} textAnchor="middle" fontSize={9.5 / zoom} fontFamily="DM Sans" fill={WHITE}>{shiftHeld ? "⇧ Aspect ratio locked" : "Hold ⇧ to lock ratio"}</text></g>)}
                    {HANDLES.map(h2 => (
                         <rect key={h2.id} x={h2.cx * w - R / zoom} y={h2.cy * h - R / zoom} width={R * 2 / zoom} height={R * 2 / zoom} rx={2 / zoom}
                              fill={isActiveResize && resizing?.handle === h2.id ? ACCENT : WHITE} stroke={ACCENT} strokeWidth={1.5 / zoom}
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
               <div style={{ position: "fixed", left: screenX, top: screenY, zIndex: 9000, pointerEvents: "all" }} onMouseDown={e => e.stopPropagation()}>
                    <textarea
                         ref={textareaRef}
                         value={textEdit.text}
                         onChange={e => {
                              const val = e.target.value;
                              setTextEdit(prev => prev ? { ...prev, text: val } : null);
                              // FIX: broadcast live typing to all collaborators immediately —
                              // we emit a shallow patch with _liveTyping:true so board.tsx can
                              // apply it without adding to history on remote peers.
                              if (textEdit) {
                                   const el = elements.find(el2 => el2.id === textEdit.id) as any;
                                   const isShape = el && ["rect", "square", "circle", "ellipse", "diamond"].includes(el.type);
                                   const patch = isShape ? { label: val } : { text: val };
                                   const liveEls = elements.map(el2 => el2.id === textEdit.id ? { ...el2, ...patch, _liveTyping: true } as any : el2);
                                   onElementsChange?.(liveEls, frames);
                              }
                         }}
                         onBlur={commitTextEdit}
                         onKeyDown={e => { if (e.key === "Escape") commitTextEdit(); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitTextEdit(); } e.stopPropagation(); }}
                         placeholder={textEdit.isShapeLabel ? "Label text…" : ""}
                         style={{
                              minWidth: screenW, minHeight: screenH,
                              fontSize: (textEdit.fontSize || 20) * zoom,
                              fontFamily: textEdit.fontFamily || "DM Sans",
                              fontWeight: textEdit.fontWeight || "400",
                              fontStyle: textEdit.fontStyle || "normal",
                              color: textEdit.isShapeLabel ? NAVY : (textEdit.fill || NAVY),
                              background: "rgba(255,255,255,0.97)",
                              border: `2px solid ${ACCENT}`, borderRadius: 6,
                              padding: "4px 8px", outline: "none", resize: "both",
                              lineHeight: 1.4,
                              boxShadow: `0 0 0 4px ${ACCENT}33, 0 8px 32px rgba(0,0,0,0.18)`,
                              caretColor: ACCENT, boxSizing: "border-box",
                         }}
                    />
                    <div style={{ position: "absolute", top: -22, left: 0, background: NAVY2, color: GRAY2, fontSize: 10, fontFamily: "DM Sans, sans-serif", padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                         {textEdit.isShapeLabel ? "Enter label · Esc to cancel" : "Enter to save · Esc to cancel"}
                    </div>
               </div>
          );
     };

     const LAYOUT_PROMPTS = [
          { label: "Dashboard Layout", desc: "Suggest spacing, hierarchy & colour for a KPI dashboard" },
          { label: "Landing Page", desc: "Review hero section layout, CTA placement & typography" },
          { label: "Login / Auth Screen", desc: "Improve trust signals, field spacing & error states" },
          { label: "Profile Page", desc: "Advise on content hierarchy, avatar sizing & whitespace" },
     ];
     const COMPONENT_PROMPTS = [
          "Add a navigation bar with logo and links",
          "Create a pricing card with title, price and button",
          "Build a hero section with heading and CTA button",
          "Add a feature grid with icons and descriptions",
          "Create a testimonial card with avatar and quote",
          "Build a footer with links and social icons",
     ];

     // ── FIX: svgEvents no longer includes onMouseMove — we handle it inline ──
     // This prevents double-calling and keeps emitCursor separate from tool logic.
     const svgEvents = {
          onMouseDown: handleCanvasMouseDown,
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
                    button:focus { outline: none; } input:focus { outline: none; }
                    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes dotBounce { from{transform:translateY(0)} to{transform:translateY(-5px)} }
                    @keyframes slideIn { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
                    button { transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease, opacity 0.15s ease; }
                    .ctx-menu { animation: slideIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both; }
                    .ai-msg { animation: fadeUp 0.2s ease both; }

                    /* ── Responsive top nav ── collapses gracefully instead of overlapping the canvas */
                    @media (max-width: 860px) {
                         .leave-board-label { display: none; }
                         .leave-board-btn { padding: 0 8px !important; }
                    }
                    @media (max-width: 640px) {
                         .top-nav-title { display: none; }
                    }
               `}</style>

               {/* ── TOP NAV ── */}
               <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 52, background: NAVY2, display: "flex", alignItems: "center", paddingInline: 16, gap: 12, zIndex: 100, borderBottom: `1px solid ${NAVY3}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                         <Link to="/dashboard" style={{ textDecoration: "none" }}>
                              <img src={logoSvg} width="28" height="28" alt="logo" style={{ display: "block" }} />
                         </Link>
                         <span className="top-nav-title" style={{ color: WHITE, fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>Design Project</span>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                         <button onClick={() => setShowAI(!showAI)} style={{ padding: "5px 16px", borderRadius: 20, cursor: "pointer", background: showAI ? ACCENT : "transparent", color: showAI ? WHITE : ACCENT, border: `1.5px solid ${showAI ? ACCENT : ACCENT + "66"}`, fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, boxShadow: showAI ? `0 0 14px ${ACCENT}55` : "none" }}>
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
                                   style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${btn.disabled ? NAVY3 + "80" : NAVY3}`, color: btn.disabled ? NAVY3 : GRAY2, cursor: btn.disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: btn.disabled ? 0.38 : 1 }}>
                                   <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={btn.path} /></svg>
                              </button>
                         ))}
                         
                         <div style={{ width: 1, height: 24, background: NAVY3 }} />
                         <button style={{ padding: "5px 16px", borderRadius: 8, background: ACCENT, color: WHITE, border: "none", fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, cursor: "pointer" }}>Export</button>
                         <button title="Toggle fullscreen" onClick={() => setFullscreen(!fullscreen)} style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: `1px solid ${NAVY3}`, color: GRAY2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                   {fullscreen ? <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /> : <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />}
                              </svg>
                         </button>
                         <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ color: WHITE, fontSize: 11, fontWeight: 700 }}>{currentUser?.[0]?.toUpperCase() ?? "?"}</span>
                         </div>
                         
                         <div style={{ width: 1, height: 24, background: NAVY3 }} />
                         <button
                              className="leave-board-btn"
                              title="Leave board"
                              onClick={() => {
                                   if (window.confirm("Leave this board? Any unsaved changes have already been synced.")) {
                                        onBack?.(); // let the parent do any cleanup (e.g. leaving the socket room)
                                        navigate("/dashboard"); // and always actually leave the page
                                   }
                              }}
                              style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 8, background: "ORANGE", border:`1px solid black`, color: "WHITE", fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#ef444422"; e.currentTarget.style.borderColor = "#ef4444"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#ef444488"; }}
                         >
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                   <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                   <polyline points="16 17 21 12 16 7" />
                                   <line x1="21" y1="12" x2="9" y2="12" />
                              </svg>
                              <span className="leave-board-label">Leave</span>
                         </button>
                    </div>
               </div>

               {/* ── MAIN LAYOUT ── */}
               <div style={{ display: "flex", flex: 1, marginTop: 52, position: "relative", overflow: "visible" }}>
                    {!fullscreen && (
                         <LeftSidebar activeTool={activeTool} onToolSelect={handleToolSelect} onIconPick={handleIconPick} onImageAdd={handleImageAdd} />
                    )}

                    {/* ── CANVAS AREA ── */}
                    <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#eef2f7" }} onClick={() => setContextMenu(null)}>

                         {/* Dot grid background */}
                         <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                              <defs>
                                   <pattern id="dotgrid" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)} width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse">
                                        <circle cx={1} cy={1} r={0.9} fill="#b8c8dc" />
                                   </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#dotgrid)" />
                         </svg>

                         {/* Choose Screen button */}
                         <button onClick={() => setShowScreenPicker(true)} style={{ position: "absolute", top: 14, right: 16, zIndex: 10, background: WHITE, borderRadius: 8, padding: "5px 14px", fontSize: 12, color: NAVY, fontFamily: "DM Sans", fontWeight: 600, boxShadow: "0 2px 8px rgba(0,0,0,0.10)", border: `1.5px solid ${GRAY}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                              Choose Screen
                         </button>

                         {/* Frame tabs */}
                         {frames.length > 0 && (
                              <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", gap: 6, alignItems: "center" }}>
                                   {frames.map(f => (
                                        <button key={f.id} onClick={() => focusFrame(f)}
                                             style={{ padding: "4px 12px", borderRadius: 20, border: `1.5px solid ${activeFrameId === f.id ? "#f97316" : GRAY}`, background: activeFrameId === f.id ? "#fff7ed" : WHITE, color: activeFrameId === f.id ? "#ea580c" : NAVY3, fontSize: 11, fontFamily: "DM Sans", fontWeight: activeFrameId === f.id ? 700 : 500, cursor: "pointer" }}>
                                             {f.name}
                                        </button>
                                   ))}
                              </div>
                         )}

                         {/* Empty state */}
                         {frames.length === 0 && (
                              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none", userSelect: "none" }}>
                                   <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 60%, #fed7aa 100%)", borderRadius: 20, padding: "40px 48px", border: "1.5px solid #fdba74", boxShadow: "0 8px 40px rgba(249,115,22,0.10)" }}>
                                        <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 4px 20px rgba(234,88,12,0.30)" }}>
                                             <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                                        </div>
                                        <p style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 20, color: "#7c2d12", marginBottom: 8 }}>Choose Screen</p>
                                        <p style={{ fontFamily: "DM Sans", fontSize: 13, color: "#c2410c", maxWidth: 260, lineHeight: 1.55 }}>Select a screen size to start designing.</p>
                                        <div style={{ pointerEvents: "all", marginTop: 22 }}>
                                             <button onClick={() => setShowScreenPicker(true)} style={{ padding: "10px 28px", borderRadius: 10, background: "linear-gradient(135deg, #f97316, #ea580c)", color: WHITE, border: "none", fontFamily: "DM Sans", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Choose Screen</button>
                                        </div>
                                   </div>
                              </div>
                         )}

                         {/* ── Main SVG canvas ── */}
                         {/* FIX: onMouseMove is here directly, not inside svgEvents,
                              so emitCursor fires on every mouse move over the SVG.
                              svgEvents handles all tool logic; emitCursor is purely
                              for broadcasting cursor position to other users. */}
                         <svg ref={canvasRef} width="100%" height="100%"
                              style={{ position: "absolute", inset: 0, cursor: activeTool !== "select" ? "crosshair" : "default" }}
                              onMouseMove={handleSvgMouseMove}
                              {...svgEvents}>
                              <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                                   {frames.map(f => (
                                        <g key={`frame-${f.id}`} onClick={() => setActiveFrameId(f.id)}>
                                             <rect x={f.x + 4} y={f.y + 4} width={f.width} height={f.height} rx={4} fill="rgba(0,0,0,0.10)" />
                                             <rect x={f.x} y={f.y} width={f.width} height={f.height} rx={4} fill={WHITE}
                                                  stroke={activeFrameId === f.id ? "#f97316" : "#c9d8e8"}
                                                  strokeWidth={activeFrameId === f.id ? 2.5 / zoom : 1.5 / zoom} />
                                             <text x={f.x} y={f.y - 10 / zoom} fontSize={12 / zoom} fontFamily="DM Sans" fontWeight="600" fill={activeFrameId === f.id ? "#ea580c" : NAVY3}>
                                                  {f.name} — {f.label}
                                             </text>
                                             <text x={f.x} y={f.y - 10 / zoom} dx={(f.name.length + f.label.length + 5) * 4.5 / zoom} fontSize={10 / zoom} fontFamily="DM Sans" fill={GRAY2}>
                                                  {f.width} × {f.height}
                                             </text>
                                        </g>
                                   ))}
                                   {[...elements].sort((a, b) => ((a as any).zIndex || 0) - ((b as any).zIndex || 0)).map(renderElement)}
                                   {elements.map(renderOverlay)}
                                   {drawing && activeTool === "sketch" && currentSketch.length > 1 && (
                                        <polyline points={currentSketch.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.5} />
                                   )}
                              </g>
                         </svg>

                         <div className="text-edit-overlay">{renderTextEditOverlay()}</div>

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
                                             style={{ padding: "7px 14px", cursor: "pointer", borderRadius: 7, fontSize: 12, fontFamily: "DM Sans", color: item.danger ? "#ef4444" : NAVY }}
                                             onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "#ef444412" : "#f0f4f8"; }}
                                             onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                                             {item.label}
                                        </div>
                                   ))}
                              </div>
                         )}

                         {bottomBarVisible && (
                              <BottomBar selectedEl={selectedEl} onUpdate={updateElement} onDelete={deleteElement} visible={true} editingCardId={editingCardId} />
                         )}

                         {/* FIX: LiveCursors renders here — screen-space overlay over canvas div.
                              pointerEvents:none in LiveCursors means it never blocks any clicks.
                              Uses raw screen coords from emitCursor (not canvas/zoom coords)
                              so cursors stay pinned to correct screen position regardless of zoom. */}
                         <LiveCursors cursors={cursors} />
                    </div>

                    {/* ── AI PANEL ── */}
                    {showAI && !fullscreen ? (() => {
                         const MIN_PANEL = 290;
                         const MAX_PANEL = Math.round(window.innerWidth * 0.6);
                         return (
                              <div style={{ width: aiPanelWidth, minWidth: MIN_PANEL, maxWidth: MAX_PANEL, background: WHITE, borderLeft: `1px solid ${GRAY}`, display: "flex", flexDirection: "column", flexShrink: 0, zIndex: 50, position: "relative", maxHeight: "95vh", overflow: "hidden" }}>
                                   <div onMouseDown={(e) => { e.preventDefault(); const startX = e.clientX; const startW = aiPanelWidth; const onMove = (mv: MouseEvent) => { const delta = startX - mv.clientX; setAiPanelWidth(Math.min(MAX_PANEL, Math.max(MIN_PANEL, startW + delta))); }; const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); }; window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp); }} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, cursor: "ew-resize", zIndex: 10 }} />
                                   <div style={{ padding: "14px 16px", borderBottom: `1px solid ${GRAY}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                             <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 11, color: WHITE }}>✦</span></div>
                                             <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: NAVY }}>AI Assistant</span>
                                        </div>
                                        <button onClick={() => setShowAI(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GRAY2, fontSize: 20, lineHeight: 1, padding: "2px 4px", borderRadius: 5 }}>×</button>
                                   </div>
                                   <div style={{ display: "flex", borderBottom: `1px solid ${GRAY}`, paddingInline: 12 }}>
                                        {([{ key: "suggestion" as const, label: "Suggestion", icon: "💡" }, { key: "generation" as const, label: "Generation", icon: "⊕" }, { key: "image" as const, label: "Image", icon: "🖼" }]).map(tab => (
                                             <button key={tab.key} onClick={() => { setAiTab(tab.key); cancelSuggestionTimer(); }} style={{ padding: "9px 10px", border: "none", background: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Sans", fontWeight: aiTab === tab.key ? 600 : 400, color: aiTab === tab.key ? ACCENT : GRAY2, borderBottom: `2px solid ${aiTab === tab.key ? ACCENT : "transparent"}`, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                                                  <span style={{ fontSize: 12 }}>{tab.icon}</span>{tab.label}
                                             </button>
                                        ))}
                                   </div>
                                   <div ref={aiChatRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                                        {aiMessages.length === 0 && (
                                             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                                  {aiTab === "suggestion" && LAYOUT_PROMPTS.map(opt => (
                                                       <div key={opt.label} onClick={() => setAiInput(`Suggest a ${opt.label} layout`)} style={{ padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${GRAY}`, cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${ACCENT}`; }} onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${GRAY}`; }}>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, fontFamily: "DM Sans" }}>{opt.label}</div>
                                                            <div style={{ fontSize: 10, color: GRAY2, marginTop: 2, fontFamily: "DM Sans" }}>{opt.desc}</div>
                                                       </div>
                                                  ))}
                                                  {aiTab === "generation" && COMPONENT_PROMPTS.map(s => (
                                                       <div key={s} onClick={() => setAiInput(s)} style={{ padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${GRAY}`, fontSize: 11, fontFamily: "DM Sans", color: NAVY, cursor: "pointer" }} onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${ACCENT}`; }} onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${GRAY}`; }}>
                                                            ✦ {s}
                                                       </div>
                                                  ))}
                                             </div>
                                        )}
                                        {/* ── MERGED from Areeba's branch: suggestion cards + message toolbar ── */}
                                        {aiMessages.map((msg, i) => {
                                             if (msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0) {
                                                  const SUGG_CAT_META: Record<string, { icon: string; color: string }> = {
                                                       layout: { icon: "⋳", color: "#f97316" },
                                                       spacing: { icon: "↔", color: "#8b5cf6" },
                                                       color: { icon: "●", color: "#3b82f6" },
                                                       typography: { icon: "T", color: "#0891b2" },
                                                       ux: { icon: "✓", color: "#16a34a" },
                                                       accessibility: { icon: "♿", color: "#dc2626" },
                                                  };
                                                  const PRIORITY_COLOR: Record<string, string> = { high: "#ef4444", medium: "#f97316", low: "#94a3b8" };
                                                  const lastSuggIdx = aiMessages.map((m, idx) => m.suggestions ? idx : -1).filter(x => x >= 0).slice(-1)[0];
                                                  const isLastSugg = i === lastSuggIdx;
                                                  return (
                                                       <div key={i} className="ai-msg"
                                                            onClick={() => isLastSugg && cancelSuggestionTimer()}
                                                            onMouseEnter={() => isLastSugg && cancelSuggestionTimer()}
                                                            style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, opacity: isLastSugg && suggestionFading ? 0 : 1, transition: isLastSugg && suggestionFading ? "opacity 3s ease" : "none" }}>
                                                            <div style={{ fontSize: 11, color: NAVY3, fontFamily: "DM Sans", fontWeight: 600, paddingLeft: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                                                 {msg.content}
                                                                 {isLastSugg && !suggestionFading && (
                                                                      <span style={{ fontSize: 9, color: GRAY2, fontStyle: "italic", fontWeight: 400 }}>· auto-dismisses in 30s · hover to keep</span>
                                                                 )}
                                                            </div>
                                                            {msg.suggestions.map((s, si) => {
                                                                 const meta = SUGG_CAT_META[s.category] || { icon: "•", color: ACCENT };
                                                                 return (
                                                                      <div key={si} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, background: WHITE, border: `1.5px solid ${GRAY}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                                                                           <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                                                                                <div style={{ width: 20, height: 20, borderRadius: 6, background: `${meta.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: meta.color, fontWeight: 700, flexShrink: 0 }}>{meta.icon}</div>
                                                                                <span style={{ fontSize: 11, fontWeight: 700, color: NAVY, fontFamily: "DM Sans", flex: 1 }}>{s.title}</span>
                                                                                <span style={{ fontSize: 9, fontFamily: "DM Sans", fontWeight: 600, color: PRIORITY_COLOR[s.priority] || GRAY2, background: `${PRIORITY_COLOR[s.priority] || GRAY2}18`, padding: "1px 6px", borderRadius: 10 }}>{s.priority}</span>
                                                                           </div>
                                                                           <div style={{ fontSize: 11, color: NAVY3, fontFamily: "DM Sans", lineHeight: 1.55, paddingLeft: 27 }}>{s.detail}</div>
                                                                      </div>
                                                                 );
                                                            })}
                                                       </div>
                                                  );
                                             }

                                             return (
                                                  <div key={i} className="ai-msg" style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}
                                                       onMouseEnter={e => { const toolbar = e.currentTarget.querySelector<HTMLElement>('.msg-toolbar'); if (toolbar) toolbar.style.opacity = "1"; }}
                                                       onMouseLeave={e => { const toolbar = e.currentTarget.querySelector<HTMLElement>('.msg-toolbar'); if (toolbar) toolbar.style.opacity = "0"; }}>
                                                       {editingMsgIdx === i && msg.role === "user" ? (
                                                            <div style={{ maxWidth: "88%", width: "88%", display: "flex", flexDirection: "column", gap: 5 }}>
                                                                 <textarea
                                                                      autoFocus
                                                                      value={editingMsgText}
                                                                      onChange={e => setEditingMsgText(e.target.value)}
                                                                      onKeyDown={e => {
                                                                           if (e.key === "Escape") setEditingMsgIdx(null);
                                                                           if (e.key === "Enter" && !e.shiftKey) {
                                                                                e.preventDefault();
                                                                                if (editingMsgText.trim()) setAiMessages(prev => prev.map((m, idx) => idx === i ? { ...m, content: editingMsgText.trim() } : m));
                                                                                setEditingMsgIdx(null);
                                                                           }
                                                                      }}
                                                                      rows={2}
                                                                      style={{ padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${ACCENT}`, fontSize: 12, fontFamily: "DM Sans", outline: "none", resize: "none" }} />
                                                                 <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                                                      <button onClick={() => setEditingMsgIdx(null)} style={{ padding: "3px 10px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 11, fontFamily: "DM Sans", cursor: "pointer", color: GRAY2 }}>Cancel</button>
                                                                      <button onClick={() => { if (editingMsgText.trim()) setAiMessages(prev => prev.map((m, idx) => idx === i ? { ...m, content: editingMsgText.trim() } : m)); setEditingMsgIdx(null); }} style={{ padding: "3px 10px", borderRadius: 6, border: "none", background: ACCENT, fontSize: 11, fontFamily: "DM Sans", cursor: "pointer", color: WHITE }}>Save</button>
                                                                 </div>
                                                            </div>
                                                       ) : (
                                                            <div style={{ maxWidth: "88%", padding: "9px 12px", borderRadius: 11, background: msg.role === "user" ? ACCENT : "#f0f4f8", color: msg.role === "user" ? WHITE : NAVY, fontSize: 12, lineHeight: 1.55, fontFamily: "DM Sans", borderBottomRightRadius: msg.role === "user" ? 2 : 11, borderBottomLeftRadius: msg.role === "assistant" ? 2 : 11, boxShadow: msg.role === "user" ? `0 2px 10px ${ACCENT}33` : "none" }}>
                                                                 {msg.content}
                                                                 {msg.imageUrl && (
                                                                      <div style={{ marginTop: 8 }}>
                                                                           <img src={msg.imageUrl} alt="AI generated" style={{ width: "100%", maxWidth: 220, borderRadius: 8, display: "block", border: `1.5px solid ${GRAY}`, boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }} />
                                                                           <div style={{ fontSize: 10, color: GRAY2, marginTop: 4, fontStyle: "italic" }}>Added to canvas ↗</div>
                                                                      </div>
                                                                 )}
                                                                 {msg.generatedCount !== undefined && (
                                                                      <div style={{ marginTop: 5, fontSize: 10, color: msg.role === "user" ? "rgba(255,255,255,0.7)" : GRAY2, fontStyle: "italic" }}>
                                                                           ✓ {msg.generatedCount} element{msg.generatedCount !== 1 ? "s" : ""} added to canvas
                                                                      </div>
                                                                 )}
                                                            </div>
                                                       )}
                                                       {/* Action toolbar — fades in on hover */}
                                                       <div className="msg-toolbar" style={{ display: "flex", gap: 3, marginTop: 3, opacity: 0, transition: "opacity 0.15s", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                                            {msg.role === "user" ? (
                                                                 <>
                                                                      <button title="Edit message" onClick={() => { setEditingMsgIdx(i); setEditingMsgText(msg.content); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: "pointer", color: GRAY2 }}
                                                                           onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                                                                           onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; }}>
                                                                           Edit
                                                                      </button>
                                                                      <button title="Delete message" onClick={() => setAiMessages(prev => prev.filter((_, idx) => idx !== i))} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: "pointer", color: GRAY2 }}
                                                                           onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                                                                           onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; e.currentTarget.style.background = WHITE; }}>
                                                                           Delete
                                                                      </button>
                                                                 </>
                                                            ) : (
                                                                 <>
                                                                      <button title="Copy response" onClick={() => { navigator.clipboard.writeText(msg.content); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: "pointer", color: GRAY2 }}
                                                                           onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                                                                           onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; }}>
                                                                           Copy
                                                                      </button>
                                                                      {aiTab === "generation" && lastGeneration && i === aiMessages.map((m, idx) => m.role === "assistant" ? idx : -1).filter(x => x >= 0).slice(-1)[0] && (
                                                                           msg.content.startsWith("⚠") ? (
                                                                                <button title="Retry the same request" onClick={regenerateLast} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid #fca5a5`, background: "#fef2f2", fontSize: 10, fontFamily: "DM Sans", cursor: aiLoading ? "default" : "pointer", color: "#dc2626" }}>
                                                                                     ↻ Try again
                                                                                </button>
                                                                           ) : msg.generatedCount !== undefined ? (
                                                                                <>
                                                                                     <button title="Generate again with the same prompt" onClick={regenerateLast} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: aiLoading ? "default" : "pointer", color: GRAY2 }}
                                                                                          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                                                                                          onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; }}>
                                                                                          ↻ Regenerate
                                                                                     </button>
                                                                                     <button title="Edit the prompt and re-send" onClick={refineLast} disabled={aiLoading} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: aiLoading ? "default" : "pointer", color: GRAY2 }}
                                                                                          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                                                                                          onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; }}>
                                                                                          ✎ Refine
                                                                                     </button>
                                                                                </>
                                                                           ) : null
                                                                      )}
                                                                      <button title="Delete response" onClick={() => setAiMessages(prev => prev.filter((_, idx) => idx !== i))} style={{ display: "flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, border: `1px solid ${GRAY}`, background: WHITE, fontSize: 10, fontFamily: "DM Sans", cursor: "pointer", color: GRAY2 }}
                                                                           onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                                                                           onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY2; e.currentTarget.style.background = WHITE; }}>
                                                                           Delete
                                                                      </button>
                                                                 </>
                                                            )}
                                                       </div>
                                                  </div>
                                             );
                                        })}
                                        {aiLoading && (
                                             <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 10, background: "#f0f4f8", width: "fit-content" }}>
                                                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, animation: `dotBounce 0.6s ${i * 0.12}s infinite alternate` }} />)}
                                             </div>
                                        )}
                                   </div>
                                   {/* MERGED from Areeba's branch: Copy/Delete toolbar for the selected element */}
                                   {selectedEl && (
                                        <div style={{ padding: "8px 12px", borderTop: `1px solid ${GRAY}`, display: "flex", gap: 6, background: "#f8fafc" }}>
                                             <span style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", alignSelf: "center", flex: 1 }}>
                                                  Selected: <b style={{ color: NAVY }}>{(selectedEl as any).type}</b>
                                             </span>
                                             <button
                                                  title="Copy element JSON"
                                                  onClick={() => { navigator.clipboard.writeText(JSON.stringify(selectedEl, null, 2)); setAiMessages(prev => [...prev, { role: "assistant", content: "✓ Element JSON copied to clipboard." }]); }}
                                                  style={{ padding: "4px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, background: WHITE, color: NAVY, fontSize: 11, fontFamily: "DM Sans", cursor: "pointer" }}
                                                  onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                                                  onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = NAVY; }}>
                                                  ⎘ Copy
                                             </button>
                                             <button
                                                  title="Delete selected element"
                                                  onClick={() => { deleteElement(selectedEl.id); setAiMessages(prev => [...prev, { role: "assistant", content: "🗑 Element deleted." }]); }}
                                                  style={{ padding: "4px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, background: WHITE, color: "#ef4444", fontSize: 11, fontFamily: "DM Sans", cursor: "pointer" }}
                                                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                                                  onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.background = WHITE; }}>
                                                  🗑 Delete
                                             </button>
                                        </div>
                                   )}
                                   <div style={{ padding: "10px 12px 14px", background: WHITE, borderTop: `2px solid ${GRAY}`, display: "flex", gap: 8, alignItems: "flex-end" }}>
                                        <textarea ref={aiTextareaRef} value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !aiLoading) { e.preventDefault(); sendAIMessage(); } }} placeholder="Describe what to generate…" rows={1} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", color: NAVY, background: "#f8fafc", outline: "none", resize: "none", lineHeight: 1.5, minHeight: 38, boxSizing: "border-box" as const }} />
                                        <button onClick={sendAIMessage} disabled={!aiInput.trim()} style={{ width: 38, height: 38, borderRadius: 10, background: aiInput.trim() ? ACCENT : "#e2e8f0", border: "none", cursor: aiInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                             <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={aiInput.trim() ? "white" : "#94a3b8"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                                        </button>
                                   </div>
                              </div>
                         );
                    })() : null}
               </div>

               {/* ── Carousel Editor Modal ── */}
               {editingSliderEl && (() => {
                    const slides: CarouselSlide[] = editingSliderEl.carouselSlides || DEFAULT_CAROUSEL_SLIDES;
                    const setSlides = (updated: CarouselSlide[]) => setEditingSliderEl((prev: any) => ({ ...prev, carouselSlides: updated }));
                    const save = () => { updateElement(editingSliderEl.id, { carouselSlides: slides } as any); setEditingSliderEl(null); };
                    const addSlide = (type: "image" | "video" | "color") => { const colors = ["#2d4a7a", "#4a2d7a", "#2d7a4a", "#7a4a2d"]; setSlides([...slides, { id: uid(), type, src: "", color: colors[slides.length % colors.length], title: `Slide ${slides.length + 1}`, caption: "", objectFit: "cover", objectPositionX: 50, objectPositionY: 50, mediaScale: 1 }]); };
                    const removeSlide = (idx: number) => { if (slides.length <= 1) return; setSlides(slides.filter((_, i) => i !== idx)); };
                    const updateSlide = (idx: number, patch: Partial<CarouselSlide>) => setSlides(slides.map((s, i) => i === idx ? { ...s, ...patch } : s));
                    const handleSlideFileUpload = (idx: number, file: File) => { const reader = new FileReader(); reader.onload = (ev) => { const src = ev.target?.result as string; if (src) updateSlide(idx, { src, type: file.type.startsWith("video") ? "video" : "image" }); }; reader.readAsDataURL(file); };
                    return (
                         <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(10,18,35,0.75)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }} onClick={save}>
                              <div style={{ background: WHITE, borderRadius: 20, width: "min(680px, 96vw)", maxHeight: "88vh", boxShadow: "0 28px 90px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                                   <div style={{ flexShrink: 0, padding: "15px 20px", borderBottom: `1.5px solid ${GRAY}`, display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, color: NAVY }}>Carousel Editor</span>
                                        <div style={{ flex: 1 }} />
                                        <button onClick={save} style={{ padding: "7px 20px", borderRadius: 9, background: ACCENT, color: WHITE, border: "none", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 700, fontSize: 12 }}>✓ Save</button>
                                        <button onClick={() => setEditingSliderEl(null)} style={{ background: "#f1f5f9", border: "none", cursor: "pointer", color: GRAY2, fontSize: 16, width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                                   </div>
                                   <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                                        {slides.map((slide, idx) => (
                                             <div key={slide.id} style={{ border: `1.5px solid ${GRAY}`, borderRadius: 14, overflow: "hidden" }}>
                                                  <div style={{ padding: "11px 16px", background: slide.color, display: "flex", alignItems: "center", gap: 10 }}>
                                                       <span style={{ fontSize: 12, fontWeight: 700, color: WHITE, fontFamily: "DM Sans" }}>Slide {idx + 1}</span>
                                                       <div style={{ flex: 1 }} />
                                                       <label><input type="color" value={slide.color} onChange={e => updateSlide(idx, { color: e.target.value })} style={{ width: 26, height: 26, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} /></label>
                                                       {slides.length > 1 && <button onClick={() => removeSlide(idx)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: WHITE, borderRadius: 7, cursor: "pointer", fontSize: 12, padding: "3px 8px" }}>✕</button>}
                                                  </div>
                                                  <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                                                       {slide.type !== "color" && (
                                                            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: `2px dashed ${GRAY}`, borderRadius: 8, cursor: "pointer" }}>
                                                                 <input type="file" accept={slide.type === "image" ? "image/*" : "video/*"} style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) handleSlideFileUpload(idx, file); }} />
                                                                 <span style={{ fontSize: 11, color: NAVY, fontFamily: "DM Sans" }}>Upload {slide.type}</span>
                                                            </label>
                                                       )}
                                                       <div style={{ display: "flex", gap: 8 }}>
                                                            <input value={slide.title} onChange={e => updateSlide(idx, { title: e.target.value })} placeholder="Title" style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", outline: "none" }} />
                                                            <input value={slide.caption} onChange={e => updateSlide(idx, { caption: e.target.value })} placeholder="Caption" style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, fontSize: 12, fontFamily: "DM Sans", outline: "none" }} />
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                                   <div style={{ flexShrink: 0, padding: "12px 20px", borderTop: `1.5px solid ${GRAY}`, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                        {(["image", "video", "color"] as const).map(t => <button key={t} onClick={() => addSlide(t)} style={{ padding: "6px 14px", borderRadius: 9, border: `1.5px solid ${ACCENT}`, background: `${ACCENT}10`, color: ACCENT, cursor: "pointer", fontSize: 11, fontFamily: "DM Sans", fontWeight: 600 }}>{t === "image" ? "🖼" : t === "video" ? "▶" : "◼"} {t}</button>)}
                                        <button onClick={save} style={{ padding: "7px 24px", borderRadius: 9, background: ACCENT, color: WHITE, border: "none", cursor: "pointer", fontFamily: "DM Sans", fontWeight: 700, fontSize: 12 }}>✓ Save</button>
                                   </div>
                              </div>
                         </div>
                    );
               })()}

               {/* ── Presence join/leave toasts ── */}
               <div style={{ position: "fixed", bottom: 80, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
                    {presenceToasts.map(t => (
                         <div key={t.id} style={{ background: NAVY2, color: WHITE, borderLeft: `4px solid ${t.color}`, padding: "10px 18px", borderRadius: 10, fontSize: 12, fontFamily: "DM Sans", fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.35)", animation: "fadeUp 0.2s ease both", display: "flex", alignItems: "center", gap: 8, minWidth: 180 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, display: "inline-block", flexShrink: 0 }} />
                              {t.msg}
                         </div>
                    ))}
               </div>

               {/* ── Screen Picker Modal ── */}
               {showScreenPicker && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,31,61,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if (e.target === e.currentTarget) setShowScreenPicker(false); }}>
                         <div style={{ background: WHITE, borderRadius: 18, width: 460, maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.22)", overflow: "hidden" }}>
                              <div style={{ padding: "20px 22px 14px", borderBottom: `1.5px solid ${GRAY}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                   <div>
                                        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 17, color: NAVY }}>Choose Screen</div>
                                        <div style={{ fontFamily: "DM Sans", fontSize: 12, color: GRAY2, marginTop: 2 }}>Select a size to create a new screen frame</div>
                                   </div>
                                   <button onClick={() => setShowScreenPicker(false)} style={{ background: "none", border: "none", cursor: "pointer", color: GRAY2, fontSize: 22 }}>×</button>
                              </div>
                              <div style={{ overflowY: "auto", flex: 1, padding: "12px 14px" }}>
                                   {(["Mobile", "Tablet", "Desktop", "Social Media"] as const).map(cat => {
                                        const presets = SCREEN_PRESETS.filter(p => p.category === cat);
                                        return (
                                             <div key={cat} style={{ marginBottom: 16 }}>
                                                  <div style={{ fontSize: 10, fontFamily: "DM Sans", fontWeight: 700, color: GRAY2, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>{cat}</div>
                                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                                                       {presets.map(p => (
                                                            <button key={p.label} onClick={() => createFrame(p)} style={{ padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${GRAY}`, background: WHITE, cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.background = "#fff7ed"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.background = WHITE; }}>
                                                                 <div>
                                                                      <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, fontFamily: "DM Sans" }}>{p.label}</div>
                                                                      <div style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", marginTop: 1 }}>{p.width} × {p.height}</div>
                                                                 </div>
                                                            </button>
                                                       ))}
                                                  </div>
                                             </div>
                                        );
                                   })}
                                   <div style={{ marginBottom: 8 }}>
                                        <div style={{ fontSize: 10, fontFamily: "DM Sans", fontWeight: 700, color: GRAY2, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Custom</div>
                                        <div style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${GRAY}`, background: "#f8fafc" }}>
                                             <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                                                  <div style={{ flex: 1 }}>
                                                       <label style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", display: "block", marginBottom: 4 }}>Width (px)</label>
                                                       <input type="number" value={customW} onChange={e => setCustomW(Number(e.target.value))} min={100} max={5000} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, fontSize: 13, fontFamily: "DM Sans", color: NAVY, outline: "none", boxSizing: "border-box" }} />
                                                  </div>
                                                  <div style={{ color: GRAY2, fontSize: 16, marginTop: 16 }}>×</div>
                                                  <div style={{ flex: 1 }}>
                                                       <label style={{ fontSize: 10, color: GRAY2, fontFamily: "DM Sans", display: "block", marginBottom: 4 }}>Height (px)</label>
                                                       <input type="number" value={customH} onChange={e => setCustomH(Number(e.target.value))} min={100} max={5000} style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1.5px solid ${GRAY}`, fontSize: 13, fontFamily: "DM Sans", color: NAVY, outline: "none", boxSizing: "border-box" }} />
                                                  </div>
                                             </div>
                                             <button onClick={() => createFrame(null, customW, customH)} style={{ width: "100%", padding: "9px", borderRadius: 8, background: NAVY, color: WHITE, border: "none", fontFamily: "DM Sans", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                                                  Create {customW} × {customH} Frame
                                             </button>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>
                     
              )}
          </div>
          
     );
}
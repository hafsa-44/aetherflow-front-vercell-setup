// LeftSideBar.tsx
// • Each tool has a unique, widely-recognised icon — no duplicates
// • Hover shows a crisp white tooltip with the tool's name

import { useRef, useState } from "react";

export type Tool =
     | "select"
     | "rect" | "circle" | "ellipse" | "square" | "diamond" | "line"
     | "text"
     | "sketch"
     | "checkbox" | "slider" | "progress"
     | "card"
     | "icon"
     | "image"
     | "navbar";

interface Props {
     activeTool: Tool;
     onToolSelect: (tool: Tool) => void;
     onIconPick?: (iconName: string) => void;
     onImageAdd?: (src: string) => void;
}

const NAVY2 = "#162847";
const NAVY3 = "#1e3a5f";
const ACCENT = "#3b82f6";
const WHITE = "#ffffff";
const GRAY2 = "#94a3b8";

// ─── Tool definitions — every icon is unique & purpose-accurate ───────────────
const TOOLS: { tool: Tool; label: string; paths: string[] }[] = [
     // ── Pointer / select ──────────────────────────────────────────────────────
     {
          tool: "select",
          label: "Select",
          paths: ["M4 3l16 9-7 1.5L9 22z"],   // arrow cursor
     },
     // ── Shapes ────────────────────────────────────────────────────────────────
     {
          tool: "rect",
          label: "Rectangle",
          // plain open rectangle (landscape)
          paths: ["M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"],
     },
     {
          tool: "square",
          label: "Square",
          // equal-sided square centred in viewport
          paths: ["M5 5h14v14H5z"],
     },
     {
          tool: "circle",
          label: "Circle",
          paths: ["M12 2a10 10 0 100 20A10 10 0 0012 2z"],
     },
     {
          tool: "ellipse",
          label: "Ellipse",
          // wide ellipse
          paths: ["M12 6C7.03 6 3 8.69 3 12s4.03 6 9 6 9-2.69 9-6-4.03-6-9-6z"],
     },
     {
          tool: "diamond",
          label: "Diamond",
          paths: ["M12 2l10 10-10 10L2 12z"],
     },
     {
          tool: "line",
          label: "Line",
          // diagonal stroke with round caps
          paths: ["M5 19L19 5"],
     },
     // ── Content ───────────────────────────────────────────────────────────────
     {
          tool: "text",
          label: "Text",
          // capital T with serif crossbars
          paths: ["M4 6h16", "M12 6v12", "M8 18h8"],
     },
     {
          tool: "sketch",
          label: "Freehand",
          // pencil icon
          paths: [
               "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
          ],
     },
     {
          tool: "image",
          label: "Image",
          // classic landscape photo frame with mountain + sun
          paths: [
               "M3 3h18v18H3z",
               "M3 15l5-5 4 4 3-3 5 5",
               "M8.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3z",
          ],
     },
     // ── UI Components ─────────────────────────────────────────────────────────
     {
          tool: "checkbox",
          label: "Checkbox",
          // square with a tick inside
          paths: [
               "M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z",
               "M9 12l2.5 2.5L16 9",
          ],
     },
     {
          tool: "slider",
          label: "Slider",
          // horizontal track + movable thumb circle
          paths: [
               "M3 12h18",
               "M14 12a2 2 0 100-4 2 2 0 000 4z",   // filled thumb
          ],
     },
     {
          tool: "progress",
          label: "Progress Bar",
          // three staggered bars (loading indicator style)
          paths: [
               "M3 6h18",
               "M3 12h13",
               "M3 18h16",
          ],
     },
     {
          tool: "card",
          label: "Card",
          // rectangle divided by a header stripe
          paths: [
               "M3 5h18v14H3z",
               "M3 9h18",
               "M7 13h5",   // content hint
               "M7 16h8",
          ],
     },
     {
          tool: "icon",
          label: "Icons",
          // star — universally understood "icons/favourites" symbol
          paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
     },
     // ── Navbar ────────────────────────────────────────────────────────────────
      {
     tool: "navbar",
     label: "Navbar",
     paths: [
          // top bar (shifted Y from 7 to 4, and height bounds adjusted)
          "M2 4a2 2 0 012-2h16a2 2 0 012 2v3H2V4z",
          // three nav-dot hints (shifted Y from 8.5 to 5.5)
          "M6 5.5h.01", "M9 5.5h.01",
          // right-side link pill (shifted Y from 8 to 5)
          "M16 5h5",
     ],
}
     
];

// ─── Icon library (unchanged) ─────────────────────────────────────────────────
export const ICON_LIBRARY: Record<string, { paths: string[]; category: string }> = {
     home: { category: "General UI", paths: ["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z", "M9 22V12h6v10"] },
     settings: { category: "General UI", paths: ["M12 15a3 3 0 100-6 3 3 0 000 6z", "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"] },
     search: { category: "General UI", paths: ["M11 3a8 8 0 100 16 8 8 0 000-16z", "M21 21l-4.35-4.35"] },
     user: { category: "General UI", paths: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 3a4 4 0 100 8 4 4 0 000-8z"] },
     users: { category: "General UI", paths: ["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2", "M9 3a4 4 0 100 8 4 4 0 000-8z", "M23 21v-2a4 4 0 00-3-3.87", "M16 3.13a4 4 0 010 7.75"] },
     bell: { category: "General UI", paths: ["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 01-3.46 0"] },
     mail: { category: "General UI", paths: ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z", "M22 6l-10 7L2 6"] },
     phone: { category: "General UI", paths: ["M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"] },
     menu: { category: "General UI", paths: ["M3 12h18", "M3 6h18", "M3 18h18"] },
     close: { category: "General UI", paths: ["M18 6L6 18", "M6 6l12 12"] },
     check: { category: "General UI", paths: ["M20 6L9 17l-5-5"] },
     plus: { category: "General UI", paths: ["M12 5v14", "M5 12h14"] },
     minus: { category: "General UI", paths: ["M5 12h14"] },
     info: { category: "General UI", paths: ["M12 2a10 10 0 100 20 10 10 0 000-20z", "M12 16v-4", "M12 8h.01"] },
     alert: { category: "General UI", paths: ["M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z", "M12 9v4", "M12 17h.01"] },
     help: { category: "General UI", paths: ["M12 2a10 10 0 100 20 10 10 0 000-20z", "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3", "M12 17h.01"] },
     arrow_right: { category: "Navigation", paths: ["M5 12h14", "M12 5l7 7-7 7"] },
     arrow_left: { category: "Navigation", paths: ["M19 12H5", "M12 19l-7-7 7-7"] },
     arrow_up: { category: "Navigation", paths: ["M12 19V5", "M5 12l7-7 7 7"] },
     arrow_down: { category: "Navigation", paths: ["M12 5v14", "M19 12l-7 7-7-7"] },
     chevron_right: { category: "Navigation", paths: ["M9 18l6-6-6-6"] },
     chevron_left: { category: "Navigation", paths: ["M15 18l-6-6 6-6"] },
     chevron_up: { category: "Navigation", paths: ["M18 15l-6-6-6 6"] },
     chevron_down: { category: "Navigation", paths: ["M6 9l6 6 6-6"] },
     external_link: { category: "Navigation", paths: ["M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6", "M15 3h6v6", "M10 14L21 3"] },
     link: { category: "Navigation", paths: ["M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"] },
     edit: { category: "Editing", paths: ["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7", "M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"] },
     trash: { category: "Editing", paths: ["M3 6h18", "M19 6l-1 14H6L5 6", "M8 6V4h8v2"] },
     copy: { category: "Editing", paths: ["M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z", "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"] },
     undo: { category: "Editing", paths: ["M9 14L4 9l5-5", "M4 9h11a4 4 0 010 8h-1"] },
     redo: { category: "Editing", paths: ["M15 14l5-5-5-5", "M19 9H8a4 4 0 000 8h1"] },
     lock: { category: "Editing", paths: ["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z", "M7 11V7a5 5 0 0110 0v4"] },
     layers: { category: "Layout", paths: ["M12 2L2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"] },
     layout: { category: "Layout", paths: ["M3 3h18v18H3z", "M3 9h18", "M9 9v12"] },
     grid: { category: "Layout", paths: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"] },
     align_left: { category: "Layout", paths: ["M17 10H3", "M21 6H3", "M21 14H3", "M17 18H3"] },
     align_center: { category: "Layout", paths: ["M18 10H6", "M21 6H3", "M21 14H3", "M18 18H6"] },
     align_right: { category: "Layout", paths: ["M21 10H7", "M21 6H3", "M21 14H3", "M21 18H7"] },
     sliders: { category: "Styling", paths: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"] },
     palette: { category: "Styling", paths: ["M12 2a10 10 0 000 20 4 4 0 004-4c0-.35-.1-.7-.2-1l-1-1.3C14.2 15 14 14.6 14 14a2 2 0 012-2h2.5a4.5 4.5 0 000-9A10 10 0 0012 2z"] },
     droplet: { category: "Styling", paths: ["M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"] },
     eyedropper: { category: "Color", paths: ["M2 22l1-1h3l9-9", "M3 21v-3l9-9", "M15 6l3.4-3.4a2 2 0 113 3L18 9l2 2-7 7-4-4z"] },
     card_view: { category: "Cards", paths: ["M3 5h18v14H3z", "M3 9h18", "M7 13h4", "M7 16h6"] },
     list: { category: "Cards", paths: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"] },
     table: { category: "Cards", paths: ["M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"] },
     progress_bar: { category: "Progress", paths: ["M3 12h10", "M3 6h18", "M3 18h14", "M17 12l-4-4v8l4-4z"] },
     activity: { category: "Progress", paths: ["M22 12h-4l-3 9L9 3l-3 9H2"] },
     bar_chart: { category: "Progress", paths: ["M18 20V10", "M12 20V4", "M6 20v-6"] },
     image: { category: "Media", paths: ["M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z", "M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z", "M21 15l-5-5L5 21"] },
     camera: { category: "Media", paths: ["M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z", "M12 13a3 3 0 100-6 3 3 0 000 6z"] },
     video: { category: "Media", paths: ["M23 7l-7 5 7 5V7z", "M1 5h15a2 2 0 012 2v10a2 2 0 01-2 2H1z"] },
     file: { category: "Files", paths: ["M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z", "M13 2v7h7"] },
     folder: { category: "Files", paths: ["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"] },
     download: { category: "Files", paths: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"] },
     upload: { category: "Files", paths: ["M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4", "M17 8l-5-5-5 5", "M12 3v12"] },
     ai_sparkle: { category: "AI", paths: ["M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"] },
     zap: { category: "AI", paths: ["M13 2L3 14h9l-1 8 10-12h-9l1-8z"] },
     message: { category: "AI", paths: ["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"] },
     type: { category: "Typography", paths: ["M4 7V4h16v3", "M9 20h6", "M12 4v16"] },
     bold: { category: "Typography", paths: ["M6 4h8a4 4 0 010 8H6z", "M6 12h9a4 4 0 010 8H6z"] },
     italic: { category: "Typography", paths: ["M19 4h-9", "M14 20H5", "M15 4L9 20"] },
     heart: { category: "Social", paths: ["M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"] },
     star: { category: "Social", paths: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"] },
     bookmark: { category: "Social", paths: ["M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"] },
     shopping_cart: { category: "E-commerce", paths: ["M9 22a1 1 0 100-2 1 1 0 000 2z", "M20 22a1 1 0 100-2 1 1 0 000 2z", "M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"] },
     credit_card: { category: "E-commerce", paths: ["M21 4H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2z", "M1 10h22"] },
     dollar: { category: "E-commerce", paths: ["M12 1v22", "M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6"] },
     eye: { category: "Utility", paths: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", "M12 9a3 3 0 100 6 3 3 0 000-6z"] },
     map_pin: { category: "Utility", paths: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z", "M12 7a3 3 0 100 6 3 3 0 000-6z"] },
     calendar: { category: "Utility", paths: ["M3 4h18v18H3z", "M16 2v4", "M8 2v4", "M3 10h18"] },
     clock: { category: "Utility", paths: ["M12 2a10 10 0 100 20 10 10 0 000-20z", "M12 6v6l4 2"] },
     filter: { category: "Utility", paths: ["M22 3H2l8 9.46V19l4 2v-8.54L22 3z"] },
     code: { category: "Utility", paths: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"] },
     wifi: { category: "Utility", paths: ["M5 12.55a11 11 0 0114.08 0", "M1.42 9a16 16 0 0121.16 0", "M8.53 16.11a6 6 0 016.95 0", "M12 20h.01"] },
     database: { category: "Utility", paths: ["M12 2C6.48 2 2 4.02 2 6.5v11c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5v-11C22 4.02 17.52 2 12 2z", "M2 6.5c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5", "M2 12c0 2.48 4.48 4.5 10 4.5s10-2.02 10-4.5"] },
};

const CATEGORIES = [...new Set(Object.values(ICON_LIBRARY).map(v => v.category))];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeftSidebar({ activeTool, onToolSelect, onIconPick, onImageAdd }: Props) {
     const [hovered, setHovered] = useState<Tool | null>(null);
     const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
     const [showIconPicker, setShowIconPicker] = useState(false);
     const [showImageModal, setShowImageModal] = useState(false);
     const [iconSearch, setIconSearch] = useState("");
     const [activeCategory, setActiveCategory] = useState("All");
     const [imageUrl, setImageUrl] = useState("");
     const fileRef = useRef<HTMLInputElement>(null);

     const filteredIcons = Object.entries(ICON_LIBRARY).filter(([name, data]) =>
          name.toLowerCase().includes(iconSearch.toLowerCase()) &&
          (activeCategory === "All" || data.category === activeCategory)
     );

     const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
               const src = ev.target?.result as string;
               if (src) { onImageAdd?.(src); setShowImageModal(false); }
          };
          reader.readAsDataURL(file);
     };

     const handleUrlAdd = () => {
          if (imageUrl.trim()) { onImageAdd?.(imageUrl.trim()); setImageUrl(""); setShowImageModal(false); }
     };

     const handleToolClick = (tool: Tool) => {
          if (tool === "icon") {
               setShowIconPicker(v => !v);
               setShowImageModal(false);
               onToolSelect(tool);
          } else if (tool === "image") {
               setShowImageModal(v => !v);
               setShowIconPicker(false);
               onToolSelect(tool);
          } else {
               setShowIconPicker(false);
               setShowImageModal(false);
               onToolSelect(tool);
          }
     };

     return (
          <>
               {/* ── Sidebar ── */}
               <div style={{
                    width: 62, height: "100%", minHeight: 0,
                    background: NAVY2,
                    display: "flex", flexDirection: "column", alignItems: "center",
                    paddingTop: 12, paddingBottom: 14, gap: 2,
                    borderRight: `1px solid ${NAVY3}`,
                    flexShrink: 0, position: "relative", zIndex: 50,
                    overflowY: "auto", overflowX: "visible",
               }}>
                    <style>{`
                         @keyframes sb-tip-in {
                              from { opacity:0; transform:translateY(-50%) translateX(-4px); }
                              to   { opacity:1; transform:translateY(-50%) translateX(0); }
                         }
                         .sb-btn {
                              width:42px; height:42px; border-radius:10px; border:none;
                              cursor:pointer; display:flex; align-items:center; justify-content:center;
                              transition:background 0.15s, box-shadow 0.15s, transform 0.12s;
                              position:relative; outline:none; padding:0;
                         }
                         .sb-btn:hover  { transform:scale(1.1); }
                         .sb-btn:active { transform:scale(0.93); }
                         /* ── White tooltip — anchored to the button, escapes sidebar via fixed stacking ── */
                         .sb-tooltip {
                              position:fixed;
                              background:#ffffff;
                              color:#111827;
                              font-size:11.5px;
                              font-family:'DM Sans', sans-serif;
                              font-weight:650;
                              padding:5px 11px;
                              border-radius:7px;
                              white-space:nowrap;
                              pointer-events:none;
                              z-index:99999;
                              box-shadow:0 2px 12px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.10);
                              border:1px solid #e2e8f0;
                              letter-spacing:0.01em;
                              animation: sb-tip-in 0.13s ease both;
                         }
                         /* left-pointing arrow */
                         .sb-tooltip::before {
                              content:'';
                              position:absolute;
                              right:100%; top:50%;
                              transform:translateY(-50%);
                              border:5px solid transparent;
                              border-right-color:#e2e8f0;
                         }
                         .sb-tooltip::after {
                              content:'';
                              position:absolute;
                              right:calc(100% - 1px); top:50%;
                              transform:translateY(-50%);
                              border:5px solid transparent;
                              border-right-color:#ffffff;
                         }
                         .ic-btn { transition: background 0.12s, transform 0.1s; }
                         .ic-btn:hover { background: rgba(59,130,246,0.18) !important; transform: scale(1.08); }
                    `}</style>

                    {TOOLS.map((item, idx) => {
                         const isActive = activeTool === item.tool;
                         const isHovered = hovered === item.tool;
                         const isOpen =
                              (item.tool === "icon" && showIconPicker) ||
                              (item.tool === "image" && showImageModal);

                         return (
                              <div key={item.tool} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                   {/* Dividers between groups */}
                                   {idx === 1 && <div style={{ width: 28, height: 1, background: NAVY3, margin: "4px 0 6px" }} />}
                                   {idx === 8 && <div style={{ width: 28, height: 1, background: NAVY3, margin: "4px 0 6px" }} />}
                                   {idx === 10 && <div style={{ width: 28, height: 1, background: NAVY3, margin: "4px 0 6px" }} />}

                                   <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%" }}>
                                        {/* ── White tooltip (fixed, never clipped) ── */}
                                        {isHovered && tooltipPos && (
                                             <div className="sb-tooltip" style={{ top: tooltipPos.top, left: tooltipPos.left, transform: "translateY(-50%)" }}>
                                                  {item.label}
                                             </div>
                                        )}

                                        <button
                                             className="sb-btn"
                                             onClick={() => handleToolClick(item.tool)}
                                             onMouseEnter={e => {
                                                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                  setHovered(item.tool);
                                                  setTooltipPos({ top: r.top + r.height / 2, left: r.right + 11 });
                                             }}
                                             onMouseLeave={() => { setHovered(null); setTooltipPos(null); }}
                                             style={{
                                                  background:
                                                       isActive || isOpen ? ACCENT
                                                            : isHovered ? `${ACCENT}28`
                                                                 : "transparent",
                                                  boxShadow: isActive || isOpen ? `0 0 16px ${ACCENT}66` : "none",
                                             }}
                                        >
                                             <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
                                                  stroke={isActive || isOpen ? WHITE : "#c8d8ea"}
                                                  strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                                                  {item.paths.map((d, i) => <path key={i} d={d} />)}
                                             </svg>
                                        </button>
                                   </div>
                              </div>
                         );
                    })}

                    <div style={{ flex: 1 }} />
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, opacity: 0.8, boxShadow: `0 0 8px ${ACCENT}`, marginBottom: 4 }} />
               </div>

               {/* ── Icon Picker bottom bar ── */}
               {showIconPicker && (
                    <div style={{ position: "fixed", bottom: 0, left: 62, right: 0, zIndex: 200, background: "#0d1b2e", borderTop: `1px solid ${NAVY3}`, boxShadow: "0 -8px 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: 340 }}>
                         <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 8px", flexShrink: 0 }}>
                              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" /></svg>
                              <span style={{ color: WHITE, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 13 }}>Icon Library</span>
                              <span style={{ color: GRAY2, fontSize: 11, marginLeft: 2 }}>({filteredIcons.length})</span>
                              <div style={{ flex: 1 }} />
                              <input value={iconSearch} onChange={e => setIconSearch(e.target.value)} placeholder="Search icons…"
                                   style={{ background: NAVY2, border: `1px solid ${NAVY3}`, borderRadius: 8, color: WHITE, fontSize: 12, fontFamily: "DM Sans, sans-serif", padding: "5px 10px", outline: "none", width: 180 }} />
                              <button onClick={() => setShowIconPicker(false)} style={{ background: "transparent", border: "none", color: GRAY2, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
                         </div>
                         <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", overflowX: "auto", flexShrink: 0 }}>
                              {["All", ...CATEGORIES].map(cat => (
                                   <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "3px 10px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11, fontFamily: "DM Sans, sans-serif", whiteSpace: "nowrap", flexShrink: 0, background: activeCategory === cat ? ACCENT : NAVY2, color: activeCategory === cat ? WHITE : GRAY2 }}>{cat}</button>
                              ))}
                         </div>
                         <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "0 16px 12px", overflowY: "auto" }}>
                              {filteredIcons.map(([name, data]) => (
                                   <button key={name} className="ic-btn" title={name.replace(/_/g, " ")}
                                        onClick={() => { onIconPick?.(name); setShowIconPicker(false); onToolSelect("select"); }}
                                        style={{ width: 44, height: 44, borderRadius: 8, border: `1px solid ${NAVY3}`, background: NAVY2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={GRAY2} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{data.paths.map((d, i) => <path key={i} d={d} />)}</svg>
                                        <span style={{ fontSize: 7, color: GRAY2, fontFamily: "DM Sans, sans-serif", opacity: 0.7, maxWidth: 42, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name.replace(/_/g, " ")}</span>
                                   </button>
                              ))}
                              {filteredIcons.length === 0 && <div style={{ color: GRAY2, fontSize: 12, fontFamily: "DM Sans, sans-serif", padding: "20px 0" }}>No icons found for "{iconSearch}"</div>}
                         </div>
                    </div>
               )}

               {/* ── Image Modal bottom bar ── */}
               {showImageModal && (
                    <div style={{ position: "fixed", bottom: 0, left: 62, right: 0, zIndex: 200, background: "#0d1b2e", borderTop: `1px solid ${NAVY3}`, boxShadow: "0 -8px 32px rgba(0,0,0,0.5)", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" /></svg>
                              <span style={{ color: WHITE, fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 13 }}>Add Image</span>
                              <div style={{ flex: 1 }} />
                              <button onClick={() => setShowImageModal(false)} style={{ background: "transparent", border: "none", color: GRAY2, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
                         </div>
                         <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                   <span style={{ color: GRAY2, fontSize: 11, fontFamily: "DM Sans, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>Upload from device</span>
                                   <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 18px", borderRadius: 9, border: `1px solid ${NAVY3}`, background: NAVY2, color: WHITE, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                                        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                        Choose File
                                   </button>
                                   <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
                              </div>
                              <div style={{ color: GRAY2, fontSize: 12, fontFamily: "DM Sans, sans-serif", alignSelf: "center" }}>— or —</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 280 }}>
                                   <span style={{ color: GRAY2, fontSize: 11, fontFamily: "DM Sans, sans-serif", textTransform: "uppercase", letterSpacing: "0.07em" }}>Paste image URL</span>
                                   <div style={{ display: "flex", gap: 8 }}>
                                        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleUrlAdd(); }} placeholder="https://example.com/image.png"
                                             style={{ flex: 1, background: NAVY2, border: `1px solid ${NAVY3}`, borderRadius: 9, color: WHITE, fontSize: 13, fontFamily: "DM Sans, sans-serif", padding: "8px 12px", outline: "none" }} />
                                        <button onClick={handleUrlAdd} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: ACCENT, color: WHITE, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 600 }}>Add</button>
                                   </div>
                              </div>
                         </div>
                    </div>
               )}
          </>
     );
}

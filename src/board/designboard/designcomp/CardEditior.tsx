// CardEditor.tsx
// Smooth inline card editor using contentEditable for rich text

import { useRef, useEffect, useCallback } from "react";

interface Props {
     id: string;
     width: number;
     height: number;
     cardTitle: string;
     cardBody: string;
     fill: string;
     stroke: string;
     strokeWidth: number;
     borderRadius: number;
     shadow?: boolean;
     zoom: number;
     onChange: (patch: { cardTitle?: string; cardBody?: string }) => void;
     onExitEdit: () => void;
}

const NAVY = "#0f1f3d";
const GRAY = "#e2e8f0";
const ACCENT = "#3b82f6";

export default function CardEditor({
     id, width, height, cardTitle, cardBody,
     fill, stroke, strokeWidth, borderRadius, shadow, zoom,
     onChange, onExitEdit,
}: Props) {
     const titleRef = useRef<HTMLDivElement>(null);
     const bodyRef = useRef<HTMLDivElement>(null);

     // Set initial content
     useEffect(() => {
          if (titleRef.current && titleRef.current.innerHTML !== cardTitle) {
               titleRef.current.innerHTML = cardTitle;
          }
          if (bodyRef.current && bodyRef.current.innerHTML !== cardBody) {
               bodyRef.current.innerHTML = cardBody;
          }
     }, []);

     // Focus title on mount, place cursor at end
     useEffect(() => {
          if (titleRef.current) {
               titleRef.current.focus();
               const range = document.createRange();
               const sel = window.getSelection();
               range.selectNodeContents(titleRef.current);
               range.collapse(false);
               sel?.removeAllRanges();
               sel?.addRange(range);
          }
     }, []);

     const handleTitleInput = useCallback(() => {
          if (titleRef.current) {
               onChange({ cardTitle: titleRef.current.innerHTML });
          }
     }, [onChange]);

     const handleBodyInput = useCallback(() => {
          if (bodyRef.current) {
               onChange({ cardBody: bodyRef.current.innerHTML });
          }
     }, [onChange]);

     // Toolbar formatting commands
     const execFormat = (cmd: string, value?: string) => {
          document.execCommand(cmd, false, value);
     };

     const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === "Escape") {
               e.preventDefault();
               onExitEdit();
               return;
          }
          // Keyboard shortcuts
          if (e.ctrlKey || e.metaKey) {
               if (e.key === "b") { e.preventDefault(); execFormat("bold"); }
               if (e.key === "i") { e.preventDefault(); execFormat("italic"); }
               if (e.key === "u") { e.preventDefault(); execFormat("underline"); }
               if (e.key === "k") {
                    e.preventDefault();
                    const url = window.prompt("Enter URL:");
                    if (url) execFormat("createLink", url);
               }
          }
          e.stopPropagation();
     };

     const boxShadow = shadow ? "0 4px 14px rgba(0,0,0,0.18)" : undefined;

     return (
          <foreignObject x={0} y={0} width={width} height={height}
               style={{ overflow: "visible" }}>
               {/* @ts-ignore */}
               <div xmlns="http://www.w3.org/1999/xhtml"
                    style={{
                         width: width, height: height,
                         background: fill || "#fff",
                         border: `${strokeWidth || 1}px solid ${stroke || GRAY}`,
                         borderRadius: borderRadius || 12,
                         boxShadow,
                         boxSizing: "border-box",
                         display: "flex",
                         flexDirection: "column",
                         overflow: "hidden",
                         position: "relative",
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
               >
                    {/* Inline formatting toolbar */}
                    <div style={{
                         position: "absolute",
                         top: -40,
                         left: "50%",
                         transform: "translateX(-50%)",
                         background: NAVY,
                         borderRadius: 8,
                         padding: "4px 8px",
                         display: "flex",
                         gap: 2,
                         zIndex: 9999,
                         boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
                         whiteSpace: "nowrap",
                    }}
                         onMouseDown={(e) => e.preventDefault()}
                    >
                         {[
                              { cmd: "bold", label: "B", style: { fontWeight: 700 } },
                              { cmd: "italic", label: "I", style: { fontStyle: "italic" } },
                              { cmd: "underline", label: "U", style: { textDecoration: "underline" } },
                              { cmd: "strikeThrough", label: "S̶", style: { textDecoration: "line-through" } },
                         ].map(btn => (
                              <button
                                   key={btn.cmd}
                                   onMouseDown={(e) => { e.preventDefault(); execFormat(btn.cmd); }}
                                   style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#c8d8ea",
                                        cursor: "pointer",
                                        padding: "2px 7px",
                                        borderRadius: 5,
                                        fontSize: 12,
                                        fontFamily: "DM Sans, sans-serif",
                                        ...btn.style,
                                   }}
                                   onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.25)"}
                                   onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                   {btn.label}
                              </button>
                         ))}
                         <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", alignSelf: "center", margin: "0 2px" }} />
                         <button
                              onMouseDown={(e) => {
                                   e.preventDefault();
                                   const url = window.prompt("Enter URL:");
                                   if (url) execFormat("createLink", url);
                              }}
                              style={{
                                   background: "transparent", border: "none", color: ACCENT,
                                   cursor: "pointer", padding: "2px 7px", borderRadius: 5,
                                   fontSize: 11, fontFamily: "DM Sans, sans-serif",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.25)"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                         >
                              Link
                         </button>
                         <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)", alignSelf: "center", margin: "0 2px" }} />
                         <span style={{ fontSize: 10, color: "#94a3b8", padding: "3px 4px", alignSelf: "center", fontFamily: "DM Sans, sans-serif" }}>
                              Esc to exit
                         </span>
                    </div>

                    {/* Title area */}
                    <div
                         ref={titleRef}
                         contentEditable
                         suppressContentEditableWarning
                         onInput={handleTitleInput}
                         onKeyDown={handleKeyDown}
                         style={{
                              padding: "12px 14px 8px",
                              fontSize: 14,
                              fontWeight: 700,
                              color: NAVY,
                              lineHeight: 1.4,
                              fontFamily: "DM Sans, sans-serif",
                              outline: "none",
                              borderBottom: `1px solid ${GRAY}`,
                              minHeight: 36,
                              cursor: "text",
                              caretColor: ACCENT,
                         }}
                    />

                    {/* Body area */}
                    <div
                         ref={bodyRef}
                         contentEditable
                         suppressContentEditableWarning
                         onInput={handleBodyInput}
                         onKeyDown={handleKeyDown}
                         style={{
                              flex: 1,
                              padding: "8px 14px 10px",
                              fontSize: 12,
                              color: "#334155",
                              lineHeight: 1.65,
                              fontFamily: "DM Sans, sans-serif",
                              outline: "none",
                              overflowY: "auto",
                              cursor: "text",
                              caretColor: ACCENT,
                         }}
                    />

                    <style>{`
                         [contenteditable]:focus { outline: none; }
                         [contenteditable] a { color: ${ACCENT}; text-decoration: underline; }
                         [contenteditable] strong, [contenteditable] b { font-weight: 700; }
                         [contenteditable] em, [contenteditable] i { font-style: italic; }
                         [contenteditable] u { text-decoration: underline; }
                         [contenteditable] s { text-decoration: line-through; }
                         [contenteditable]:empty:before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }
                    `}</style>
               </div>
          </foreignObject>
     );
}

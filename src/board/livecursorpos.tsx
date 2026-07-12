// src/components/LiveCursors.tsx
//
// Drop-in overlay that renders other users' cursors on any canvas.
//
// Usage:
//   <div style={{ position: "relative" }} onMouseMove={handleMouseMove}>
//     <YourCanvas />
//     <LiveCursors cursors={cursors} />
//   </div>
//
//   const handleMouseMove = (e: React.MouseEvent) => {
//     const rect = e.currentTarget.getBoundingClientRect();
//     emitCursor(e.clientX - rect.left, e.clientY - rect.top);
//   };
//
// cursors comes from useBoardSync: Record<userId, { name, color, x, y }>

import React from "react";
import type { CursorState } from "../hook/useBoardSync";

interface LiveCursorsProps {
  cursors: Record<string, CursorState>;
}

export default function LiveCursors({ cursors }: LiveCursorsProps) {
  const entries = Object.values(cursors);
  if (entries.length === 0) return null;

  return (
    <div
      style={{
        position:      "absolute",
        inset:         0,
        pointerEvents: "none",   // never blocks clicks on the canvas below
        zIndex:        9999,
        overflow:      "hidden",
      }}
    >
      {entries.map((cursor) => (
        <CursorPin key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
}

// ── Single cursor pin ─────────────────────────────────────────────────────────

interface CursorPinProps {
  cursor: CursorState;
}

function CursorPin({ cursor }: CursorPinProps) {
  const { name, color, x, y } = cursor;

  return (
    <div
      style={{
        position:  "absolute",
        left:      x,
        top:       y,
        transform: "translate(0, 0)",
        // 60ms transition smooths 25fps cursor updates to look continuous
        transition: "left 60ms linear, top 60ms linear",
        willChange: "left, top",
      }}
    >
      {/* SVG arrow cursor */}
      <svg
        width="18"
        height="22"
        viewBox="0 0 18 22"
        fill="none"
        style={{ display: "block", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" }}
      >
        <path
          d="M1 1L1 17L5.5 13L8.5 20L10.5 19L7.5 12H14L1 1Z"
          fill={color}
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          position:       "absolute",
          top:            18,
          left:           12,
          backgroundColor: color,
          color:          "#fff",
          fontSize:       11,
          fontWeight:     600,
          fontFamily:     "DM Sans, Inter, sans-serif",
          padding:        "2px 7px",
          borderRadius:   4,
          whiteSpace:     "nowrap",
          lineHeight:     1.5,
          boxShadow:      "0 1px 4px rgba(0,0,0,0.25)",
          userSelect:     "none",
        }}
      >
        {name}
      </div>
    </div>
  );
}
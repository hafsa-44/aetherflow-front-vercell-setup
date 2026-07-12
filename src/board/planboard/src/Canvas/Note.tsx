// Notes.tsx
// Notes.tsx

import { Group, Rect, Text, Transformer, Circle } from "react-konva";
import { useEffect, useRef, useMemo, useState } from "react";
import type { NoteType } from "./types";
import Konva from "konva";
import type * as Y from "yjs";
import { bindTextareaToYText } from "../../../../utilis/bindTextareaToYText";

type Props = {
  note: NoteType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onFinishEdit: () => void;
  onChange: (note: NoteType) => void;
  commentCount?: number;
  onCommentClick?: () => void;
  getYText?: (toolKey: string, id: string, initialText: string) => Y.Text | null;
};

const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 160;
const MIN_WIDTH = 180;
const MIN_HEIGHT = 120;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 360;
const PADDING = 16;
const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const CHAR_WIDTH = 8.4;
const SCROLLBAR_W = 8;
const SCROLLBAR_PAD = 6;

function calculateCappedSize(text: string): { width: number; height: number } {
  const trimmed = text.trim();
  if (!trimmed) return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
  const lines = trimmed.split("\n");
  const longest = Math.max(...lines.map((l) => l.length), 10);
  return {
    width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, longest * CHAR_WIDTH + PADDING * 2)),
    height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, lines.length * LINE_HEIGHT + PADDING * 2)),
  };
}

function calcTotalTextHeight(text: string): number {
  if (!text.trim()) return 0;
  return text.split("\n").length * LINE_HEIGHT + PADDING * 2;
}

type Segment = { text: string; bold: boolean; underline: boolean };

function parseLine(line: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) {
      segments.push({ text: line.slice(last, match.index), bold: false, underline: false });
    }
    const raw = match[0];
    if (raw.startsWith("**")) {
      segments.push({ text: raw.slice(2, -2), bold: true, underline: false });
    } else {
      segments.push({ text: raw.slice(2, -2), bold: false, underline: true });
    }
    last = match.index + raw.length;
  }
  if (last < line.length) {
    segments.push({ text: line.slice(last), bold: false, underline: false });
  }
  return segments.length > 0 ? segments : [{ text: line, bold: false, underline: false }];
}

export default function Note({
  note,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onFinishEdit,
  onChange,
  commentCount = 0,
  onCommentClick,
  getYText,
}: Props) {
  const rectRef = useRef<Konva.Rect>(null);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const thumbRef = useRef<Konva.Rect>(null);

  const [scrollTop, setScrollTop] = useState(0);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);

  useEffect(() => { setScrollTop(0); }, [note.id]);

  const innerHeight = note.height - PADDING * 2;
  const innerWidth = note.width - PADDING * 2;
  const totalTextHeight = calcTotalTextHeight(note.text);
  const isScrollable = totalTextHeight > innerHeight;
  const maxScroll = Math.max(1, totalTextHeight - innerHeight);
  const clampedScroll = Math.min(scrollTop, maxScroll);

  const scrollbarX = note.width - SCROLLBAR_PAD - SCROLLBAR_W;
  const trackHeight = innerHeight;
  const thumbRatio = Math.min(1, innerHeight / Math.max(1, totalTextHeight));
  const thumbHeight = Math.max(28, trackHeight * thumbRatio);
  const thumbY = PADDING + (clampedScroll / maxScroll) * (trackHeight - thumbHeight);
  const textW = innerWidth - (isScrollable ? SCROLLBAR_W + SCROLLBAR_PAD + 4 : 0);

  const BADGE_RADIUS = 11;
  const badgeX = note.width - BADGE_RADIUS + 4;
  const badgeY = -BADGE_RADIUS + 4;

  useEffect(() => {
    const group = groupRef.current;
    if (!group || isEditing || !isScrollable) return;
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      setScrollTop((p) => Math.max(0, Math.min(maxScroll, p + e.evt.deltaY * 0.6)));
      group.getLayer()?.batchDraw();
    };
    group.on("wheel", handleWheel);
    return () => { group.off("wheel", handleWheel); };
  }, [isEditing, isScrollable, maxScroll]);

  const handleTrackClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const track = e.target;
    const stage = track.getStage();
    if (!stage) return;
    const pointerY = stage.getPointerPosition()?.y ?? 0;
    const groupPos = groupRef.current?.getAbsolutePosition() ?? { x: 0, y: 0 };
    const relY = pointerY - groupPos.y - PADDING;
    const ratio = Math.max(0, Math.min(1, relY / trackHeight));
    setScrollTop(ratio * maxScroll);
  };

  const handleThumbDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const thumb = e.target as Konva.Rect;
    const trackTop = PADDING;
    const trackBot = PADDING + trackHeight - thumbHeight;
    const newY = Math.max(trackTop, Math.min(trackBot, thumb.y()));
    thumb.y(newY);
    const ratio = (newY - trackTop) / Math.max(1, trackBot - trackTop);
    setScrollTop(ratio * maxScroll);
    groupRef.current?.getLayer()?.batchDraw();
  };

  const handleThumbDragBound = (pos: { x: number; y: number }) => {

    const group = groupRef.current;
    const absPos = group?.getAbsolutePosition() ?? { x: 0, y: 0 };
    const trackTop = absPos.y + PADDING;
    const trackBot = absPos.y + PADDING + trackHeight - thumbHeight;
    return {
      x: absPos.x + scrollbarX,
      y: Math.max(trackTop, Math.min(trackBot, pos.y)),
    };
  };

  // ── Rendered text lines ────────────────────────────────────────────────────
  const renderedLines = useMemo(() => {
    // PLACEHOLDER — purely visual, never stored in note.text
    if (!note.text.trim()) {
      return (
        <Text
          x={0} y={0}
          width={textW} height={innerHeight}
          text="Double-click to write something..."
          fontSize={FONT_SIZE}
          fontStyle="italic"
          fill="rgba(0, 0, 0, 0.6)"
          listening={false}
          wrap="none"
          align="left"
          verticalAlign="top"
        />
      );
    }

    const nodes: React.ReactNode[] = [];
    note.text.split("\n").forEach((line, li) => {
      const y = li * LINE_HEIGHT;
      let xOffset = 0;
      parseLine(line).forEach((seg, si) => {
        if (xOffset >= textW) return;
        const available = Math.max(0, textW - xOffset);
        nodes.push(
          <Text
            key={`${li}-${si}`}
            x={xOffset} y={y}
            width={available}
            text={seg.text}
            fontSize={FONT_SIZE}
            fontStyle={seg.bold ? "bold" : "normal"}
            textDecoration={seg.underline ? "underline" : ""}
            fill="#222"
            listening={false}
            wrap="none"
            ellipsis={si === 0}
          />
        );
        xOffset += seg.text.length * (seg.bold ? CHAR_WIDTH * 1.1 : CHAR_WIDTH);
      });
    });
    return nodes;
  }, [note.text, textW, innerHeight]);

  useEffect(() => {
    if (isSelected && !isEditing && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isEditing]);

  useEffect(() => {
    if (!isEditing) return;

    const rect = rectRef.current;
    const stage = rect?.getStage();
    if (!rect || !stage) return;

    const styleEl = document.createElement("style");
    styleEl.textContent = `textarea.knote::-webkit-scrollbar{display:none}`;
    document.head.appendChild(styleEl);

    const textarea = document.createElement("textarea");
    textarea.className = "knote";
    document.body.appendChild(textarea);

    const scale = stage.scaleX();
    const stageRect = stage.container().getBoundingClientRect();
    const absPos = rect.getAbsolutePosition();

    Object.assign(textarea.style, {
      position: "fixed",
      left: `${stageRect.left + absPos.x * scale + PADDING * scale}px`,
      top: `${stageRect.top + absPos.y * scale + PADDING * scale}px`,
      width: `${textW * scale}px`,
      height: `${innerHeight * scale}px`,
      fontSize: `${FONT_SIZE * scale}px`,
      lineHeight: `${LINE_HEIGHT * scale}px`,
      padding: "0",
      margin: "0",
      border: "none",
      outline: "none",
      resize: "none",
      background: "transparent",
      color: "#222",
      fontFamily: "inherit",
      zIndex: "1000",
      overflowY: "scroll",
      overflowX: "hidden",
      whiteSpace: "pre",
      boxSizing: "border-box",
      scrollbarWidth: "none",
    } as Partial<CSSStyleDeclaration>);

    textarea.value = note.text;
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    // Live CRDT merge: every keystroke becomes a small insert/delete op on
    // the shared Y.Text instead of waiting for blur, so concurrent typing
    // from another user merges in instead of getting clobbered on commit.
    const ytext = getYText?.("notes", note.id, note.text) ?? null;
    const unbindYText = ytext ? bindTextareaToYText(textarea, ytext) : null;

    const onScroll = () => {
      setScrollTop(textarea.scrollTop / scale);
      stage.batchDraw();
    };
    textarea.addEventListener("scroll", onScroll);

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      const { width, height } = calculateCappedSize(textarea.value);
      onChange({ ...note, text: textarea.value, width, height });
      setScrollTop(0);
      onFinishEdit();
      cleanup();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") textarea.blur();
    };
    const cleanup = () => {
      unbindYText?.();
      textarea.removeEventListener("scroll", onScroll);
      textarea.removeEventListener("blur", commit);
      textarea.removeEventListener("keydown", onKeyDown);
      if (document.body.contains(textarea)) textarea.remove();
      if (document.head.contains(styleEl)) styleEl.remove();
    };
    textarea.addEventListener("blur", commit);
    textarea.addEventListener("keydown", onKeyDown);

    return () => { committed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, note.id]);

  const badgeLabel = commentCount > 99 ? "99+" : String(commentCount);

  return (
    <>
      <Group
        ref={groupRef}
        x={note.x}
        y={note.y}
        draggable={!isEditing && !isDraggingThumb}
        onClick={onSelect}
        onDragEnd={(e) => onChange({ ...note, x: e.target.x(), y: e.target.y() })}
      >
        {/* Card */}
        <Rect
          ref={rectRef}
          width={note.width}
          height={note.height}
          fill={note.fill ?? "#fff9c4"}
          cornerRadius={10}
          shadowBlur={8}
          shadowColor="rgba(0,0,0,0.13)"
          shadowOffsetY={2}
          onDblClick={onEdit}
          onTransformEnd={() => {
            const node = rectRef.current;
            if (!node) return;
            const sx = node.scaleX() || 1;
            const sy = node.scaleY() || 1;
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...note,
              x: node.x(),
              y: node.y(),
              width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, note.width * sx)),
              height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, note.height * sy)),
            });
          }}
        />

        {!isEditing && (
          <>
            {/* Clipped text */}
            <Group
              clipX={PADDING}
              clipY={PADDING}
              clipWidth={textW}
              clipHeight={innerHeight}
              listening={false}
            >
              <Group x={PADDING} y={PADDING - clampedScroll} listening={false}>
                {renderedLines}
              </Group>
            </Group>

            {/* Scrollbar */}
            {isScrollable && (
              <>
                <Rect
                  x={scrollbarX}
                  y={PADDING}
                  width={SCROLLBAR_W}
                  height={trackHeight}
                  fill="rgba(0,0,0,0.08)"
                  cornerRadius={4}
                  onClick={handleTrackClick}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "pointer";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "default";
                  }}
                />
                <Rect
                  ref={thumbRef}
                  x={scrollbarX}
                  y={thumbY}
                  width={SCROLLBAR_W}
                  height={thumbHeight}
                  fill={isDraggingThumb ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.38)"}
                  cornerRadius={4}
                  draggable
                  dragBoundFunc={handleThumbDragBound}
                  onDragStart={() => setIsDraggingThumb(true)}
                  onDragMove={handleThumbDragMove}
                  onDragEnd={() => setIsDraggingThumb(false)}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "grab";
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = "default";
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Comment badge */}
        {commentCount > 0 && (
          <Group
            x={badgeX}
            y={badgeY}
            onClick={(e) => {
              e.cancelBubble = true;
              onCommentClick?.();
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "pointer";
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "default";
            }}
          >
            <Circle
              x={0} y={0}
              radius={BADGE_RADIUS + (badgeLabel.length > 1 ? 3 : 0)}
              fill="#2579d3"
              shadowBlur={6}
              shadowColor="rgba(37, 104, 211, 0.5)"
              shadowOffsetY={2}
            />
            <Text
              x={-(BADGE_RADIUS + (badgeLabel.length > 1 ? 3 : 0))}
              y={-(BADGE_RADIUS + (badgeLabel.length > 1 ? 3 : 0))}
              width={(BADGE_RADIUS + (badgeLabel.length > 1 ? 3 : 0)) * 2}
              height={(BADGE_RADIUS + (badgeLabel.length > 1 ? 3 : 0)) * 2}
              text={badgeLabel}
              fontSize={badgeLabel.length > 1 ? 10 : 12}
              fontStyle="bold"
              fill="#fff"
              align="center"
              verticalAlign="middle"
              listening={false}
            />
          </Group>
        )}
      </Group>

      {/* Transformer */}
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          borderStroke="#3b82f6"
          anchorStroke="#3b82f6"
          anchorFill="#ffffff"
          anchorSize={8}
          boundBoxFunc={(oldBox, newBox) =>
            newBox.width < MIN_WIDTH || newBox.height < MIN_HEIGHT ? oldBox : newBox
          }
        />
      )}
    </>
  );
}
{/*import { Group, Rect, Text, Transformer, Circle } from "react-konva";*/}

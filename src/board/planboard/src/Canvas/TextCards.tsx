
import { Group, Rect, Text, Circle } from "react-konva";
import { useEffect, useRef } from "react";
import type Konva from "konva";
import type * as Y from "yjs";
import { bindTextareaToYText } from "../../../../utilis/bindTextareaToYText";

const DEFAULT_WIDTH = 200;   // initial textarea width in canvas px
const MIN_WIDTH = 100;
const MAX_WIDTH = 440;
const PADDING = 10;

interface TextModuleProps {
  textCards: any[];
  setTextCards: React.Dispatch<React.SetStateAction<any[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  tempText: string;
  setTempText: (text: string) => void;
  commentThreads: any[];
  handleElementClickForComment: (id: string) => void;
  activeTool: string;
  stageRef?: React.RefObject<any>;
  getYText?: (toolKey: string, id: string, initialText: string) => Y.Text | null;
}

// ── DOM textarea editor ────────────────────────────────────────────────────────
function TextEditor({
  card,
  tempText,
  setTempText,
  onCommit,
  groupRef,
  stageRef,
  getYText,
}: {
  card: any;
  tempText: string;
  setTempText: (t: string) => void;
  onCommit: (text: string, width: number, height: number) => void;
  groupRef: React.RefObject<Konva.Group | null>;
  stageRef?: React.RefObject<any>;
  getYText?: (toolKey: string, id: string, initialText: string) => Y.Text | null;
}) {
  useEffect(() => {
    const group = groupRef.current;
    const stage = stageRef?.current ?? group?.getStage();
    if (!group || !stage) return;

    const styleEl = document.createElement("style");
    styleEl.textContent = `textarea.txtmod::-webkit-scrollbar{display:none}`;
    document.head.appendChild(styleEl);

    const ta = document.createElement("textarea");
    ta.className = "txtmod";
    document.body.appendChild(ta);

    const scale = (stage.scaleX() as number) || 1;
    const stageRect = (stage.container() as HTMLDivElement).getBoundingClientRect();
    const absPos = group.getAbsolutePosition();
    const fontSize = (card.fontSize || 18) * scale;
    const boxWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, card.width || DEFAULT_WIDTH)) * scale;

    Object.assign(ta.style, {
      position: "fixed",
      left: `${stageRect.left + absPos.x * scale}px`,
      top: `${stageRect.top + absPos.y * scale}px`,
      width: `${boxWidth}px`,
      minHeight: `${fontSize * 1.5}px`,
      height: "auto",
      fontSize: `${fontSize}px`,
      lineHeight: "1.5",
      padding: `${PADDING * scale}px`,
      margin: "0",
      border: "1.5px dashed #4A90E2",
      outline: "none",
      resize: "none",
      background: "rgba(255,255,255,0.95)",
      color: card.color ?? "#000000",
      fontFamily: "sans-serif",
      fontWeight: card.fontWeight ?? "normal",
      fontStyle: card.fontStyle ?? "normal",
      zIndex: "3000",
      overflow: "hidden",
      whiteSpace: "pre-wrap",   // ← wrap at spaces
      wordBreak: "break-word",
      boxSizing: "border-box",
      borderRadius: "4px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      scrollbarWidth: "none",
    } as Partial<CSSStyleDeclaration>);

    ta.value = tempText;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;

    // Live CRDT merge: keystrokes go into the shared Y.Text as they happen,
    // so two people editing the same text card merge instead of one commit
    // (blur / Enter) clobbering the other.
    const ytext = getYText?.("textCards", card.id, tempText) ?? null;
    const unbindYText = ytext ? bindTextareaToYText(ta, ytext) : null;

    // Auto-grow height only (width is fixed)
    const grow = () => {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight + 2}px`;
    };
    grow();

    ta.addEventListener("input", () => {
      setTempText(ta.value);
      grow();
    });

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      // Read back pixel size and convert to canvas units
      const w = Math.round(parseFloat(ta.style.width) / scale);
      const h = Math.round(parseFloat(ta.style.height) / scale);
      onCommit(ta.value, w, h);
      cleanup();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") ta.blur();
      // Shift+Enter = new line; plain Enter = commit
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ta.blur(); }
    };

    const cleanup = () => {
      unbindYText?.();
      ta.removeEventListener("blur", commit);
      ta.removeEventListener("keydown", onKeyDown);
      if (document.body.contains(ta)) ta.remove();
      if (document.head.contains(styleEl)) styleEl.remove();
    };

    ta.addEventListener("blur", commit);
    ta.addEventListener("keydown", onKeyDown);

    return () => { committed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function TextModule({
  textCards,
  setTextCards,
  selectedId,
  setSelectedId,
  editingId,
  setEditingId,
  tempText,
  setTempText,
  commentThreads,
  handleElementClickForComment,
  activeTool,
  stageRef,
  getYText,
}: TextModuleProps) {
  const groupRefs = useRef<Record<string, React.RefObject<Konva.Group | null>>>({});
  const getGroupRef = (id: string) => {
    if (!groupRefs.current[id]) groupRefs.current[id] = { current: null };
    return groupRefs.current[id];
  };

  return (
    <>
      {textCards.map((t) => {
        const thread = commentThreads.find((th: any) => th.targetId === t.id);
        const commentCount = thread ? thread.comments.length : 0;
        const isSelected = selectedId === t.id;
        const isEditing = editingId === t.id;
        const fontSize = t.fontSize ?? 15;
        const displayText = t.text || "";

        // Card dimensions — stored on the card after first edit, else defaults
        const cardWidth = t.width ?? DEFAULT_WIDTH;
        const cardHeight = t.height ?? (fontSize * 1.5 + PADDING * 2);

        const badgeR = commentCount > 9 ? 13 : 10;
        const gRef = getGroupRef(t.id);

        return (
          <Group
            key={t.id}
            ref={gRef as any}
            x={t.x}
            y={t.y}
            draggable={!isEditing}
            onDragEnd={(e) =>
              setTextCards(
                textCards.map((tc: any) =>
                  tc.id === t.id
                    ? { ...tc, x: e.target.x(), y: e.target.y() }
                    : tc
                )
              )
            }
            onClick={(e) => {
              e.cancelBubble = true;
              if (activeTool === "comments") handleElementClickForComment(t.id);
              else setSelectedId(t.id);
            }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              setEditingId(t.id);
              setTempText(t.text ?? "");
            }}
          >
            {/* Hit + selection rect */}
            <Rect
              width={cardWidth}
              height={cardHeight}
              fill="transparent"
              stroke={isSelected && !isEditing ? "#4A90E2" : "transparent"}
              strokeWidth={1.5}
              dash={[4, 3]}
              cornerRadius={4}
            />

            {/* Konva text — hidden while DOM textarea is active */}
            {!isEditing && (
              <Text
                x={PADDING}
                y={PADDING}
                width={cardWidth - PADDING * 2}
                text={displayText || " "}
                fontSize={fontSize}
                fontStyle={`${t.fontWeight ?? "normal"} ${t.fontStyle ?? "normal"}`}
                fill={t.color ?? "#000000"}
                wrap="word"           // ← word-wrap
                lineHeight={1.5}
                listening={false}
              />
            )}

            {/* Self-contained textarea while editing */}
            {isEditing && (
              <TextEditor
                card={{ ...t, width: cardWidth }}
                tempText={tempText}
                setTempText={setTempText}
                groupRef={gRef}
                stageRef={stageRef}
                getYText={getYText}
                onCommit={(finalText, w, h) => {
                  setTextCards(
                    textCards.map((tc: any) =>
                      tc.id === t.id
                        ? { ...tc, text: finalText, width: w, height: h }
                        : tc
                    )
                  );
                  setEditingId(null);
                  setTempText("");
                }}
              />
            )}

            {/* Comment badge */}
            {commentCount > 0 && (
              <Group
                x={cardWidth - badgeR + 4}
                y={-badgeR + 4}
                onClick={(e) => {
                  e.cancelBubble = true;
                  handleElementClickForComment(t.id);
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
                  radius={badgeR}
                  fill="#25D366"
                  shadowBlur={6}
                  shadowColor="rgba(37,211,102,0.55)"
                  shadowOffsetY={1}
                />
                <Text
                  x={-badgeR} y={-badgeR}
                  width={badgeR * 2} height={badgeR * 2}
                  text={commentCount > 99 ? "99+" : String(commentCount)}
                  fill="#fff"
                  fontSize={commentCount > 9 ? 9 : 11}
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  listening={false}
                />
              </Group>
            )}
          </Group>
        );
      })}
    </>
  );
}
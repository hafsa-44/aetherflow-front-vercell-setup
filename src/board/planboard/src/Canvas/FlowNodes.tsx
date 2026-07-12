// FlowNodes.tsx
import { Group, Rect, Circle, Line, Text, Arrow, Transformer } from "react-konva";
import { useRef, useEffect } from "react";
import type Konva from "konva";
import type { FlowNodeType, FlowEdgeType, CommentThread } from "./types";

type Props = {
  nodes: FlowNodeType[];
  lines: FlowEdgeType[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNodeType[]>>;
  setLines?: React.Dispatch<React.SetStateAction<FlowEdgeType[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  // FIX: Removed "comment" from activeSubTool union — it was declared here but
  // never produced by canvas.tsx, creating a dead unreachable variant.
  activeSubTool: "select" | "connector";
  connectionStartId: string | null;
  setConnectionStartId: (id: string | null) => void;
  onNodeDblClick: (id: string, text: string) => void;
  editingId: string | null;
  commentThreads: CommentThread[];
  setCommentThreads: React.Dispatch<React.SetStateAction<CommentThread[]>>;
  setActiveThreadId: (id: string | null) => void;
  onAddShape: (shape: "rect" | "circle" | "diamond" | "parallelogram") => void;
  handleCommentClick: (targetId: string) => void;
  activeTool: string;
};

// ── Exact border intersection for arrow endpoints ─────────────────────────────
function getConnectionPoint(from: FlowNodeType, to: FlowNodeType) {
  const fx = from.x + from.width / 2;
  const fy = from.y + from.height / 2;
  const tx = to.x + to.width / 2;
  const ty = to.y + to.height / 2;
  const dx = tx - fx, dy = ty - fy;
  if (dx === 0 && dy === 0) return { x: fx, y: fy };
  const angle = Math.atan2(dy, dx);

  switch (from.shape) {
    case "rect":
    case "parallelogram": {
      const hw = from.width / 2, hh = from.height / 2;
      if (Math.abs(dy) * hw <= Math.abs(dx) * hh) {
        const s = dx > 0 ? 1 : -1;
        return { x: fx + s * hw, y: fy + s * hw * dy / dx };
      } else {
        const s = dy > 0 ? 1 : -1;
        return { x: fx + s * hh * dx / dy, y: fy + s * hh };
      }
    }
    case "circle": {
      const r = from.width / 2;
      return { x: fx + r * Math.cos(angle), y: fy + r * Math.sin(angle) };
    }
    case "diamond": {
      const hw = from.width / 2;
      const hh = from.height / 2;
      const vertices = [
        { x: 0, y: -hh },
        { x: hw, y: 0 },
        { x: 0, y: hh },
        { x: -hw, y: 0 },
      ];
      let bestT = Infinity;
      let hit = { x: fx, y: fy };
      for (let i = 0; i < 4; i++) {
        const A = vertices[i];
        const B = vertices[(i + 1) % 4];
        const ex = B.x - A.x, ey = B.y - A.y;
        const denom = dx * ey - dy * ex;
        if (Math.abs(denom) < 1e-10) continue;
        const t = (A.x * ey - A.y * ex) / denom;
        const s = (A.x * dy - A.y * dx) / denom;
        if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6 && t < bestT) {
          bestT = t;
          hit = { x: fx + t * dx, y: fy + t * dy };
        }
      }
      return hit;
    }
    default:
      return { x: fx, y: fy };
  }
}

// ── Single resizable node ─────────────────────────────────────────────────────
function FlowNode({
  node,
  isSelected,
  editingId,
  activeSubTool,
  commentCount,
  onSelect,
  onDblClick,
  onDragEnd,
  onResize,
  handleCommentClick,
}: {
  node: FlowNodeType;
  isSelected: boolean;
  editingId: string | null;
  activeSubTool: string;
  commentCount: number;
  onSelect: () => void;
  onDblClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void;
  handleCommentClick: (id: string) => void;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const badgeR = commentCount > 9 ? 13 : 10;
  const GRID = 20;

  return (
    <>
      <Group
        ref={groupRef}
        x={node.x}
        y={node.y}
        draggable={activeSubTool === "select"}
        onClick={(e) => { e.cancelBubble = true; onSelect(); }}
        onDblClick={onDblClick}
        onDragEnd={(e) => {
          const x = Math.round(e.target.x() / GRID) * GRID;
          const y = Math.round(e.target.y() / GRID) * GRID;
          onDragEnd(x, y);
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const sx = node.scaleX(), sy = node.scaleY();
          node.scaleX(1); node.scaleY(1);
          onResize(
            Math.max(60, Math.round((node.width() * sx) / GRID) * GRID),
            Math.max(40, Math.round((node.height() * sy) / GRID) * GRID),
          );
        }}
      >
        {node.shape === "rect" && (
          <Rect
            width={node.width} height={node.height}
            fill="#EEF4FF"
            stroke={isSelected ? "#4A90E2" : "#5B8DEF"}
            strokeWidth={isSelected ? 2.5 : 1.5}
            cornerRadius={8}
            shadowBlur={isSelected ? 8 : 0}
            shadowColor="#4A90E2" shadowOpacity={0.3}
          />
        )}

        {node.shape === "circle" && (
          <Circle
            x={node.width / 2} y={node.height / 2}
            radius={Math.min(node.width, node.height) / 2}
            fill="#E6F9F0"
            stroke={isSelected ? "#4A90E2" : "#34A86A"}
            strokeWidth={isSelected ? 2.5 : 1.5}
            shadowBlur={isSelected ? 8 : 0}
            shadowColor="#4A90E2" shadowOpacity={0.3}
          />
        )}

        {node.shape === "diamond" && (
          <>
            <Rect width={node.width} height={node.height} fill="transparent" />
            <Line
              points={[
                node.width / 2, 0,
                node.width, node.height / 2,
                node.width / 2, node.height,
                0, node.height / 2,
              ]}
              closed
              fill="#FFF8E6"
              stroke={isSelected ? "#4A90E2" : "#E0A020"}
              strokeWidth={isSelected ? 2.5 : 1.5}
              shadowBlur={isSelected ? 8 : 0}
              shadowColor="#4A90E2" shadowOpacity={0.3}
            />
          </>
        )}

        {node.shape === "parallelogram" && (
          <Line
            points={[20, 0, node.width, 0, node.width - 20, node.height, 0, node.height]}
            closed
            fill="#F3E8FF"
            stroke={isSelected ? "#4A90E2" : "#9B59D0"}
            strokeWidth={isSelected ? 2.5 : 1.5}
            shadowBlur={isSelected ? 8 : 0}
            shadowColor="#4A90E2" shadowOpacity={0.3}
          />
        )}

        <Text
          text={editingId === node.id ? "" : node.text}
          width={node.width} height={node.height}
          align="center" wrap="word" verticalAlign="middle"
          fontSize={14} fill="#1a1a2e" listening={false}
        />

        {commentCount > 0 && (
          <Group
            x={node.width - badgeR + 4} y={-badgeR + 4}
            onClick={(e) => { e.cancelBubble = true; handleCommentClick(node.id); }}
            onMouseEnter={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = "pointer"; }}
            onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = "default"; }}
          >
            <Circle radius={badgeR} fill="#25D366"
              shadowBlur={6} shadowColor="rgba(37,211,102,0.55)" shadowOffsetY={1} />
            <Text
              x={-badgeR} y={-badgeR} width={badgeR * 2} height={badgeR * 2}
              text={commentCount > 99 ? "99+" : String(commentCount)}
              fill="#fff" fontSize={commentCount > 9 ? 9 : 11}
              fontStyle="bold" align="center" verticalAlign="middle" listening={false}
            />
          </Group>
        )}
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={node.shape === "circle"}
          borderStroke="#4A90E2"
          anchorStroke="#4A90E2"
          anchorFill="#fff"
          anchorSize={8}
          anchorCornerRadius={2}
          borderDash={node.shape === "diamond" ? [4, 3] : undefined}
          boundBoxFunc={(_, newBox) =>
            newBox.width < 60 || newBox.height < 40 ? _ : newBox
          }
        />
      )}
    </>
  );
}

// ── Main FlowNodes component ──────────────────────────────────────────────────
const FlowNodes = ({
  nodes,
  lines,
  setNodes,
  setLines,
  selectedId,
  setSelectedId,
  activeSubTool,
  onNodeDblClick,
  editingId,
  commentThreads,
  handleCommentClick,
}: Props) => {

  return (
    <>
      {/* ── Connection arrows — rendered HERE only (not duplicated in canvas.tsx) ── */}
      {lines.map((line) => {
        const from = nodes.find((n) => n.id === line.from);
        const to = nodes.find((n) => n.id === line.to);
        if (!from || !to) return null;

        const start = getConnectionPoint(from, to);
        const end = getConnectionPoint(to, from);

        return (
          <Arrow
            key={line.id}
            points={[start.x, start.y, end.x, end.y]}
            stroke="#4A90E2"
            fill="#4A90E2"
            strokeWidth={2}
            pointerLength={10}
            pointerWidth={10}
            pointerAtBeginning={line.bidirectional === true}
            pointerAtEnd={true}
            tension={0}
            onClick={(e) => { e.cancelBubble = true; }}
            onDblClick={(e) => {
              e.cancelBubble = true;
              if (!setLines) return;
              setLines((prev) =>
                prev.map((l) =>
                  l.id === line.id ? { ...l, bidirectional: !l.bidirectional } : l
                )
              );
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "pointer";
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "default";
            }}
          />
        );
      })}

      {/* ── Flow nodes ── */}
      {nodes.map((node) => {
        const thread = commentThreads.find((t) => t.targetId === node.id);
        const commentCount = thread ? thread.comments.length : 0;

        return (
          <FlowNode
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            editingId={editingId}
            activeSubTool={activeSubTool}
            commentCount={commentCount}
            handleCommentClick={handleCommentClick}
            onSelect={() => setSelectedId(node.id)}
            onDblClick={() => onNodeDblClick(node.id, node.text)}
            onDragEnd={(x, y) =>
              setNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, x, y } : n))
            }
            onResize={(w, h) =>
              setNodes((prev) => prev.map((n) => n.id === node.id ? { ...n, width: w, height: h } : n))
            }
          />
        );
      })}
    </>
  );
};

export default FlowNodes;

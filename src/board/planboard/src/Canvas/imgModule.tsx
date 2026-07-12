// ImageModule.tsx
import { Group, Rect, Image as KonvaImage, Circle, Text, Transformer } from "react-konva";
import { useEffect, useRef, useState } from "react";
import type Konva from "konva";

export type ImageCard = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  zIndex: number;
};

interface ImageModuleProps {
  imageCards: ImageCard[];
  setImageCards: React.Dispatch<React.SetStateAction<ImageCard[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  commentThreads: any[];
  handleCommentClick: (id: string) => void;
  activeTool: string;
  commentMode?: boolean;
}

// ── Single image node ─────────────────────────────────────────────────────────
function ImageNode({
  card,
  isSelected,
  onChange,
  onSelect,
  onComment,
  commentCount,
  commentMode,
}: {
  card: ImageCard;
  isSelected: boolean;
  onChange: (c: ImageCard) => void;
  onSelect: () => void;
  onComment: () => void;
  commentCount: number;
  commentMode: boolean;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const groupRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // Live position/size for badge tracking
  const [livePos, setLivePos] = useState({ x: card.x, y: card.y });
  const [liveSize, setLiveSize] = useState({ width: card.width, height: card.height });

  useEffect(() => { setLivePos({ x: card.x, y: card.y }); }, [card.x, card.y]);
  useEffect(() => { setLiveSize({ width: card.width, height: card.height }); }, [card.width, card.height]);

  // Load image
  useEffect(() => {
    if (!card.src) { setImg(null); return; }
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.src = card.src;
    el.onload = () => setImg(el);
    el.onerror = () => setImg(null);
  }, [card.src]);

  // Attach transformer to group
  useEffect(() => {
    if (isSelected && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, img]);

  const badgeR = commentCount > 9 ? 13 : 10;

  return (
    <>
      <Group
        ref={groupRef}
        x={card.x}
        y={card.y}
        draggable
        onClick={(e) => {
          e.cancelBubble = true;
          if (commentMode) { onComment(); return; }
          onSelect();
        }}
        onDragMove={(e) => {
          setLivePos({ x: e.target.x(), y: e.target.y() });
        }}
        onDragEnd={(e) => {
          const newPos = { x: e.target.x(), y: e.target.y() };
          setLivePos(newPos);
          onChange({ ...card, ...newPos });
        }}
        onTransform={() => {
          const node = groupRef.current;
          if (!node) return;
          setLivePos({ x: node.x(), y: node.y() });
          setLiveSize({
            width: Math.max(40, card.width * node.scaleX()),
            height: Math.max(40, card.height * node.scaleY()),
          });
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          const scaleX = node.scaleX(), scaleY = node.scaleY();
          node.scaleX(1); node.scaleY(1);
          const newW = Math.max(40, card.width * scaleX);
          const newH = Math.max(40, card.height * scaleY);
          const newX = node.x(), newY = node.y();
          setLivePos({ x: newX, y: newY });
          setLiveSize({ width: newW, height: newH });
          onChange({ ...card, x: newX, y: newY, width: newW, height: newH });
        }}
      >
        {/* ── Placeholder (no image yet) ── */}
        {!img && (
          <>
            <Rect
              width={card.width}
              height={card.height}
              fill={isSelected ? "#dbeafe" : "#f0f0f0"}
              cornerRadius={8}
              stroke={isSelected ? "#4A90E2" : "#ccc"}
              strokeWidth={isSelected ? 2 : 1}
              strokeDashEnabled={!isSelected}
              strokeDashArray={[6, 3]}
              shadowBlur={isSelected ? 10 : 0}
              shadowColor="#4A90E2"
              shadowOpacity={0.3}
            />
            <Text
              x={0} y={card.height / 2 - 22}
              width={card.width}
              text="🖼️"
              fontSize={28}
              align="center"
              listening={false}
            />
            <Text
              x={0} y={card.height / 2 + 14}
              width={card.width}
              text="Upload or paste URL"
              fontSize={11}
              fill={isSelected ? "#2563eb" : "#aaa"}
              align="center"
              listening={false}
            />
          </>
        )}

        {/* ── Loaded image ── */}
        {img && (
          <KonvaImage
            image={img}
            width={card.width}
            height={card.height}
            cornerRadius={6}
            stroke={isSelected ? "#4A90E2" : "transparent"}
            strokeWidth={isSelected ? 2 : 0}
            shadowBlur={isSelected ? 10 : 4}
            shadowColor={isSelected ? "#4A90E2" : "rgba(0,0,0,0.15)"}
            shadowOpacity={0.4}
            shadowOffsetY={2}
          />
        )}
      </Group>

      {/* ── Comment badge — outside group, tracks top-right corner ── */}
      {commentCount > 0 && (
        <Group
          x={livePos.x + liveSize.width - badgeR + 4}
          y={livePos.y - badgeR + 4}
          onClick={(e) => { e.cancelBubble = true; onComment(); }}
          onMouseEnter={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = "pointer"; }}
          onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = "default"; }}
        >
          <Circle radius={badgeR} fill="#25D366"
            shadowBlur={6} shadowColor="rgba(37,211,102,0.55)" shadowOffsetY={1} />
          <Text
            x={-badgeR} y={-badgeR}
            width={badgeR * 2} height={badgeR * 2}
            text={commentCount > 99 ? "99+" : String(commentCount)}
            fill="#fff" fontSize={commentCount > 9 ? 9 : 11}
            fontStyle="bold" align="center" verticalAlign="middle"
            listening={false}
          />
        </Group>
      )}

      {/* ── Transformer — always shown when selected ── */}
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          borderStroke="#4A90E2"
          anchorStroke="#4A90E2"
          anchorFill="#fff"
          anchorSize={8}
          boundBoxFunc={(_, newBox) =>
            newBox.width < 40 || newBox.height < 40 ? _ : newBox
          }
        />
      )}
    </>
  );
}

// ── Module ────────────────────────────────────────────────────────────────────
export default function ImageModule({
  imageCards,
  setImageCards,
  selectedId,
  setSelectedId,
  commentThreads,
  handleCommentClick,
  activeTool,
  commentMode = false,
}: ImageModuleProps) {
  const sorted = [...imageCards].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <>
      {sorted.map((card) => {
        const thread = commentThreads.find((t: any) => t.targetId === card.id);
        const commentCount = thread ? thread.comments.length : 0;
        return (
          <ImageNode
            key={card.id}
            card={card}
            isSelected={selectedId === card.id}
            commentCount={commentCount}
            commentMode={commentMode}
            onSelect={() => setSelectedId(card.id)}
            onComment={() => handleCommentClick(card.id)}
            onChange={(updated) =>
              setImageCards((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
              )
            }
          />
        );
      })}
    </>
  );
}

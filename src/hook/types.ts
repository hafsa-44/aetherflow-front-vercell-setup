/**
 * types.ts — frontend types mirroring the WorkspaceNode backend schema.
 *
 * All canvas elements on all boards are WorkspaceNode objects.
 * The `data` field is typed per nodeType using discriminated union helpers.
 */

// ---------------------------------------------------------------------------
// Core node type
// ---------------------------------------------------------------------------

export type BoardType = "plan" | "design" | "dev";

export interface WorkspaceNode {
  _id: string;
  projectId: string;
  boardType: BoardType;
  nodeType: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  locked: boolean;
  data: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Payload used when emitting node:create — no _id yet
export type CreateNodePayload = Omit<WorkspaceNode, "_id" | "projectId" | "boardType" | "createdAt" | "updatedAt">;

// Payload for node:update — partial data fields
export interface UpdateNodePayload {
  nodeId: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  locked?: boolean;
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Presence & cursors
// ---------------------------------------------------------------------------

export interface PresenceUser {
  userId: string;
  userName: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// data field shapes per nodeType (Plan board)
// ---------------------------------------------------------------------------

export interface StickyNoteData {
  text: string;
  color: string;       // background colour hex
  fontSize?: number;
}

export interface FlowNodeData {
  label: string;
  shape: "rect" | "diamond" | "circle" | "parallelogram";
  color?: string;
  connectedTo?: string[]; // _id list of connected nodes
}

export interface TextCardData {
  title: string;
  body: string;
}

export interface ImageCardData {
  src: string;       // URL or base64
  alt?: string;
  caption?: string;
}

export interface CommentThreadData {
  comments: Array<{
    userId: string;
    userName: string;
    text: string;
    createdAt: string;
  }>;
}

// ---------------------------------------------------------------------------
// data field shapes per nodeType (Design board)
// ---------------------------------------------------------------------------

export interface NavbarData {
  items: string[];
  logoText?: string;
  sticky?: boolean;
  variant?: "dark" | "light" | "transparent";
}

export interface SliderData {
  min: number;
  max: number;
  value: number;
  label?: string;
  color?: string;
}

export interface CardData {
  title: string;
  body?: string;
  imageUrl?: string;
  cta?: string;
}

export interface CheckboxData {
  label: string;
  checked: boolean;
  color?: string;
}

export interface ShapeData {
  kind: "rect" | "circle" | "triangle" | "line";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
}

export interface IconData {
  name: string;       // icon identifier in your icon library
  size?: number;
  color?: string;
}

export interface DesignElementData {
  elementType: string;
  props: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Typed node helpers — narrow WorkspaceNode to a specific data shape
// ---------------------------------------------------------------------------

export type StickyNoteNode  = WorkspaceNode & { nodeType: "sticky-note";  data: StickyNoteData };
export type FlowNodeNode    = WorkspaceNode & { nodeType: "flow-node";    data: FlowNodeData };
export type TextCardNode    = WorkspaceNode & { nodeType: "text-card";    data: TextCardData };
export type ImageCardNode   = WorkspaceNode & { nodeType: "image-card";   data: ImageCardData };
export type NavbarNode      = WorkspaceNode & { nodeType: "navbar";       data: NavbarData };
export type SliderNode      = WorkspaceNode & { nodeType: "slider";       data: SliderData };
export type CardNode        = WorkspaceNode & { nodeType: "card";         data: CardData };
export type CheckboxNode    = WorkspaceNode & { nodeType: "checkbox";     data: CheckboxData };
export type ShapeNode       = WorkspaceNode & { nodeType: "shape";        data: ShapeData };
export type IconNode        = WorkspaceNode & { nodeType: "icon";         data: IconData };
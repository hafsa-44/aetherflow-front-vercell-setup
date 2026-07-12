// types.tsx
export type NoteType = {
  id: string
  x: number
  y: number
  width: number
  height: number
  text: string
  fill: string
  bold?: boolean        // FIX: was `bold: any` with correct version commented out
  underline?: boolean
}

export type ToolType =
  | "notes"
  | "flowchart"
  | "text"
  | "comments"
  | "summarize"
  | "pin"
  | "image"

export type FlowNodeType = {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  shape: "rect" | "circle" | "diamond" | "parallelogram"
  text: string
  comments: {
    user: string;
    text: string;
  }[];
}

// FIX: Removed duplicate unexported `FlowNode` type that had wrong fields
// (title instead of text, bidirectional on node instead of edge, no shape/rotation)

export type FlowEdgeType = {
  id: string
  from: string   // node id
  to: string     // node id
  bidirectional: boolean  // FIX: was `any`
}

export interface TextCardType {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontWeight?: string;
  fontStyle?: string;
  width?: number;
  height?: number;
}

export interface Comment {
  id: string;
  user: string;
  userId?: string;
  text: string;
  timestamp?: string;
  /** userIds who had this thread open when this comment existed — drives the read tick */
  readBy?: string[];
}

export type CommentThread = {
  id: string;
  targetId: string;
  comments: Comment[];  // FIX: uses shared Comment type instead of inline re-declaration
}

import { useEffect, useReducer, useRef, useCallback } from "react";
import { getSocket } from "./socketProvider";
import type {
  WorkspaceNode,
  CreateNodePayload,
  UpdateNodePayload,
  CursorPosition,
  PresenceUser,
} from "./types";

// ---------------------------------------------------------------------------
// State & Reducer
// ---------------------------------------------------------------------------

interface RealtimeState {
  nodes:     WorkspaceNode[];
  cursors:   Record<string, CursorPosition>; // keyed by userId
  presence:  PresenceUser[];
  connected: boolean;
  loading:   boolean;
}

type RealtimeAction =
  | { type: "SNAPSHOT";        nodes: WorkspaceNode[] }
  | { type: "NODE_CREATED";    node: WorkspaceNode }
  | { type: "NODE_UPDATED";    node: WorkspaceNode }
  | { type: "NODE_MOVED";      nodeId: string; position: { x: number; y: number } }
  | { type: "NODE_DELETED";    nodeId: string }
  | { type: "NODE_ACK";        node: WorkspaceNode }
  | { type: "CURSOR_MOVED";    cursor: CursorPosition }
  | { type: "PRESENCE_JOINED"; user: PresenceUser }
  | { type: "PRESENCE_LEFT";   userId: string }
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" };

function reducer(state: RealtimeState, action: RealtimeAction): RealtimeState {
  switch (action.type) {
    case "SNAPSHOT":
      return { ...state, nodes: action.nodes, loading: false };

    case "NODE_CREATED":
      // Prevent duplicate if we already have a node with this _id
      if (state.nodes.find((n) => n._id === action.node._id)) return state;
      return { ...state, nodes: [...state.nodes, action.node] };

    case "NODE_UPDATED":
    case "NODE_ACK":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n._id === action.node._id ? action.node : n
        ),
      };

    case "NODE_MOVED":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n._id === action.nodeId
            ? { ...n, position: action.position }
            : n
        ),
      };

    case "NODE_DELETED":
      return {
        ...state,
        nodes: state.nodes.filter((n) => n._id !== action.nodeId),
      };

    case "CURSOR_MOVED":
      return {
        ...state,
        cursors: { ...state.cursors, [action.cursor.userId]: action.cursor },
      };

    case "PRESENCE_JOINED":
      if (state.presence.find((u) => u.userId === action.user.userId))
        return state;
      return { ...state, presence: [...state.presence, action.user] };

    case "PRESENCE_LEFT": {
      const { [action.userId]: _removed, ...rest } = state.cursors;
      return {
        ...state,
        presence: state.presence.filter((u) => u.userId !== action.userId),
        cursors:  rest,
      };
    }

    case "CONNECTED":
      return { ...state, connected: true };

    case "DISCONNECTED":
      return { ...state, connected: false };

    default:
      return state;
  }
}

const initialState: RealtimeState = {
  nodes:     [],
  cursors:   {},
  presence:  [],
  connected: false,
  loading:   true,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseRealtimeOptions {
  projectId: string;
  boardType: "plan" | "design" | "dev";
}

interface UseRealtimeReturn {
  nodes:       WorkspaceNode[];
  cursors:     Record<string, CursorPosition>;
  presence:    PresenceUser[];
  connected:   boolean;
  loading:     boolean;
  emitCreate:  (payload: CreateNodePayload) => void;
  emitUpdate:  (payload: UpdateNodePayload) => void;
  emitMove:    (nodeId: string, position: { x: number; y: number }) => void;
  emitDelete:  (nodeId: string) => void;
  emitCursor:  (x: number, y: number) => void;
}

export function useRealtime({
  projectId,
  boardType,
}: UseRealtimeOptions): UseRealtimeReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    // -----------------------------------------------------------------------
    // Connection state
    // -----------------------------------------------------------------------
    const onConnect    = () => dispatch({ type: "CONNECTED" });
    const onDisconnect = () => dispatch({ type: "DISCONNECTED" });

    // -----------------------------------------------------------------------
    // Board events
    // -----------------------------------------------------------------------
    const onSnapshot      = ({ nodes }: { nodes: WorkspaceNode[] }) =>
      dispatch({ type: "SNAPSHOT", nodes });

    const onNodeCreated   = ({ node }: { node: WorkspaceNode }) =>
      dispatch({ type: "NODE_CREATED", node });

    const onNodeUpdated   = ({ node }: { node: WorkspaceNode }) =>
      dispatch({ type: "NODE_UPDATED", node });

    const onNodeAck       = ({ node }: { node: WorkspaceNode }) =>
      dispatch({ type: "NODE_ACK", node });

    const onNodeMoved     = ({
      nodeId,
      position,
    }: {
      nodeId: string;
      position: { x: number; y: number };
    }) => dispatch({ type: "NODE_MOVED", nodeId, position });

    const onNodeDeleted   = ({ nodeId }: { nodeId: string }) =>
      dispatch({ type: "NODE_DELETED", nodeId });

    // -----------------------------------------------------------------------
    // Presence & cursors
    // -----------------------------------------------------------------------
    const onPresenceJoined = (user: PresenceUser) =>
      dispatch({ type: "PRESENCE_JOINED", user });

    const onPresenceLeft = ({ userId }: { userId: string }) =>
      dispatch({ type: "PRESENCE_LEFT", userId });

    const onCursorMove = (cursor: CursorPosition) =>
      dispatch({ type: "CURSOR_MOVED", cursor });

    // -----------------------------------------------------------------------
    // Register listeners
    // -----------------------------------------------------------------------
    socket.on("connect",         onConnect);
    socket.on("disconnect",      onDisconnect);
    socket.on("board:snapshot",  onSnapshot);
    socket.on("node:created",    onNodeCreated);
    socket.on("node:updated",    onNodeUpdated);
    socket.on("node:ack",        onNodeAck);
    socket.on("node:moved",      onNodeMoved);
    socket.on("node:deleted",    onNodeDeleted);
    socket.on("presence:joined", onPresenceJoined);
    socket.on("presence:left",   onPresenceLeft);
    socket.on("cursor:move",     onCursorMove);

    // Join the board room
    socket.emit("board:join", { projectId, boardType });

    // -----------------------------------------------------------------------
    // Cleanup
    // Bug 4 fix: emit board:leave BEFORE disconnecting so the server cleans presence.
    // Do NOT call socket.disconnect() — we share the singleton.
    // -----------------------------------------------------------------------
    return () => {
      socket.emit("board:leave");

      socket.off("connect",         onConnect);
      socket.off("disconnect",      onDisconnect);
      socket.off("board:snapshot",  onSnapshot);
      socket.off("node:created",    onNodeCreated);
      socket.off("node:updated",    onNodeUpdated);
      socket.off("node:ack",        onNodeAck);
      socket.off("node:moved",      onNodeMoved);
      socket.off("node:deleted",    onNodeDeleted);
      socket.off("presence:joined", onPresenceJoined);
      socket.off("presence:left",   onPresenceLeft);
      socket.off("cursor:move",     onCursorMove);
    };
  }, [projectId, boardType]);

  // -------------------------------------------------------------------------
  // Emit helpers — stable references via useCallback
  // -------------------------------------------------------------------------

  const emitCreate = useCallback(
    (payload: CreateNodePayload) => {
      socketRef.current.emit("node:create", payload);
    },
    []
  );

  const emitUpdate = useCallback((payload: UpdateNodePayload) => {
    socketRef.current.emit("node:update", payload);
  }, []);

  const emitMove = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      socketRef.current.emit("node:move", { nodeId, position });
    },
    []
  );

  const emitDelete = useCallback((nodeId: string) => {
    socketRef.current.emit("node:delete", { nodeId });
  }, []);

  const emitCursor = useCallback((x: number, y: number) => {
    socketRef.current.emit("cursor:move", { x, y });
  }, []);

  return {
    nodes:      state.nodes,
    cursors:    state.cursors,
    presence:   state.presence,
    connected:  state.connected,
    loading:    state.loading,
    emitCreate,
    emitUpdate,
    emitMove,
    emitDelete,
    emitCursor,
  };
}
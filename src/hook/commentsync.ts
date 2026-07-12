
//new file upcoming 
// src/hooks/useBoardSync.ts
//
// GENERIC — no hardcoded tool key names anywhere.
//
// Works for ALL board phases. Adding a new tool to any board
// never requires touching this file.
//
// Data shape matches the generic backend:
//   board.phases.planning    = { notes: [], flowNodes: [], ... }
//   board.phases.design      = { designElements: [], ... }
//   board.phases.development = { codeFiles: [], ... }
//
// Usage in board.tsx:
//   const { phaseData, syncPatch, socket, loaded } = useBoardSync(projectId, phase);
//
//   phaseData  — current phase's data object { [toolKey]: items[] }
//   syncPatch  — call with partial data to broadcast + autosave
//   socket     — the live socket instance (stable ref, never null after connect)
//   loaded     — true once initial board data is fetched from DB

{/*import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket }   from "socket.io-client";
import api, { getAccessToken } from "../api";

export type BoardPhase = "planning" | "design" | "development";

// Free-form data map — { toolKey: items[] }
// e.g. { notes: [...], flowNodes: [...] } for planning
// e.g. { designElements: [...] }          for design
export type PhaseData = Record<string, unknown[]>;

interface UseBoardSyncReturn {
  phaseData:  PhaseData;                       // live data for the current phase
  allPhases:  Record<BoardPhase, PhaseData>;   // all phases (for read-only views)
  syncPatch:  (data: PhaseData) => void;       // broadcast + schedule autosave
  socket:     React.RefObject<Socket | null>; // stable ref — never goes null mid-session
  loaded:     boolean;
  error:      string | null;
}

const SERVER_URL     = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const AUTOSAVE_DELAY = 5000;

const EMPTY_PHASES: Record<BoardPhase, PhaseData> = {
  planning:    {},
  design:      {},
  development: {},
};

export function useBoardSync(
  projectId: string | undefined,
  phase:     BoardPhase,
): UseBoardSyncReturn {

  const [allPhases, setAllPhases] = useState<Record<BoardPhase, PhaseData>>(EMPTY_PHASES);
  const [loaded,    setLoaded]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // Stable socket ref — board.tsx reads this directly, never gets null after first connect
  const socketRef  = useRef<Socket | null>(null);
  const mySocketId = useRef("");
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-current snapshot for autosave
  const allPhasesRef = useRef(allPhases);
  useEffect(() => { allPhasesRef.current = allPhases; }, [allPhases]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const waitForToken = async (): Promise<string | null> => {
    let token = getAccessToken();
    let attempts = 0;
    while (!token && attempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      token = getAccessToken();
      attempts++;
    }
    return token;
  };

  // ── 1. LOAD BOARD ───────────────────────────────────────────────────────────
  // Fetches once on mount. Populates ALL phases so read-only views work.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const token = await waitForToken();
      if (!token)    { if (!cancelled) setError("Not authenticated"); return; }
      if (cancelled) return;

      try {
        const { data } = await api.get(`/boards/${projectId}`);
        if (cancelled) return;

        const board = data.board ?? data;

        // board.phases is { planning: {}, design: {}, development: {} }
        setAllPhases({
          planning:    board.phases?.planning    ?? {},
          design:      board.phases?.design      ?? {},
          development: board.phases?.development ?? {},
        });
        setLoaded(true);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load board");
      }
    })();

    return () => { cancelled = true; };
  }, [projectId]);

  // ── 2. SOCKET ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const token = await waitForToken();
      if (!token || cancelled) return;

      const socket = io(`${SERVER_URL}/board`, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        mySocketId.current = socket.id ?? "";
        socket.emit("board:join", { projectId });
      });

      socket.on("connect_error", (err) => {
        console.error("[useBoardSync] socket error:", err.message);
      });

      // ── Incoming patch from a co-editor ─────────────────────────────────
      // Shape: { phase, data: { toolKey: items[] }, sentBy, sentByName }
      socket.on("board:patch", (payload: {
        phase:       BoardPhase;
        data:        PhaseData;
        sentBy:      string;
        sentByName:  string;
      }) => {
        // Ignore own echoes
        if (payload.sentBy === mySocketId.current) return;

        // Merge incoming data into the correct phase bucket — no hardcoded keys
        setAllPhases(prev => ({
          ...prev,
          [payload.phase]: {
            ...prev[payload.phase],
            ...payload.data,
          },
        }));
      });
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit("board:leave", { projectId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId]);

  // ── 3. AUTOSAVE ─────────────────────────────────────────────────────────────
  // Debounced PUT — saves the current phase's full data to DB 5s after last change.
  // No refresh needed — data is already live in React state.
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!projectId) return;
      const token = getAccessToken();
      if (!token) return;
      try {
        await api.put(`/boards/${projectId}`, {
          phase: phase,
          data:  allPhasesRef.current[phase],
        });
      } catch (err: any) {
        console.warn("[useBoardSync] autosave failed:", err?.message);
      }
    }, AUTOSAVE_DELAY);
  }, [projectId, phase]);

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  // ── 4. SYNC PATCH ────────────────────────────────────────────────────────────
  // Called by board.tsx / DesignPhase whenever local state changes.
  //
  // What it does:
  //   1. Merges the partial data into local allPhases state immediately (no flicker)
  //   2. Broadcasts over socket to all co-editors in the room
  //   3. Schedules a debounced autosave to DB
  //
  // Result: changes appear instantly for all users, saved to DB 5s later.
  // No page refresh ever needed.
  const syncPatch = useCallback((data: PhaseData) => {
    if (!projectId) return;

    // 1. Update local state immediately
    setAllPhases(prev => ({
      ...prev,
      [phase]: { ...prev[phase], ...data },
    }));

    // 2. Broadcast to room
    socketRef.current?.emit("board:patch", {
      projectId,
      phase,
      data,
    });

    // 3. Schedule autosave
    scheduleSave();
  }, [projectId, phase, scheduleSave]);

  return {
    phaseData:  allPhases[phase],   // convenient shortcut for current phase
    allPhases,                      // all phases for read-only cross-phase views
    syncPatch,
    socket:     socketRef,          // stable ref — board.tsx uses socketRef.current
    loaded,
    error,
  };
}
  */}
//new file for me 
// src/hook/useBoardSync.ts
//
// Single hook used by every board (planning, design, development).
// Returns:
//   phaseData   — current phase canvas data
//   syncPatch   — call on any local canvas change
//   socket      — stable ref (board.tsx uses it for phase:updated)
//   loaded      — true once initial fetch completes
//   cursors     — other users' cursor positions { [userId]: { name, color, x, y } }
//   presence    — users currently in this board room
//   error

import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket }     from "socket.io-client";
import api, { getAccessToken } from "../api";

export type BoardPhase = "planning" | "design" | "development";
export type PhaseData  = Record<string, unknown[]>;

export interface CursorState {
  userId: string;
  name:   string;
  color:  string;
  x:      number;
  y:      number;
}

export interface PresenceUser {
  userId: string;
  name:   string;
  color:  string;
}

export interface TypingUser {
  userId: string;
  name:   string;
}

interface UseBoardSyncReturn {
  phaseData:   PhaseData;
  allPhases:   Record<BoardPhase, PhaseData>;
  syncPatch:   (data: PhaseData) => void;
  emitCursor:  (x: number, y: number) => void;
  socket:      React.RefObject<Socket | null>;
  loaded:      boolean;
  error:       string | null;
  cursors:     Record<string, CursorState>;   // keyed by userId
  presence:    PresenceUser[];
  /** threadId → users currently typing in that comment thread (never includes yourself) */
  typingUsers: Record<string, TypingUser[]>;
  emitCommentTyping:     (threadId: string) => void;
  emitCommentStopTyping: (threadId: string) => void;
}

const SERVER_URL     = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const AUTOSAVE_DELAY = 5_000;
const CURSOR_THROTTLE_MS = 40;   // ~25fps — smooth without flooding

const EMPTY_PHASES: Record<BoardPhase, PhaseData> = {
  planning:    {},
  design:      {},
  development: {},
};

export function useBoardSync(
  projectId: string | undefined,
  phase:     BoardPhase,
): UseBoardSyncReturn {

  const [allPhases, setAllPhases] = useState<Record<BoardPhase, PhaseData>>(EMPTY_PHASES);
  const [loaded,    setLoaded]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [cursors,   setCursors]   = useState<Record<string, CursorState>>({});
  const [presence,  setPresence]  = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser[]>>({});

  const socketRef      = useRef<Socket | null>(null);
  const mySocketId     = useRef("");
  const saveTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allPhasesRef   = useRef(allPhases);
  // key: `${threadId}:${userId}` → auto-clear timeout, in case a stopTyping
  // event never arrives (tab closed mid-keystroke, dropped connection, etc.)
  const typingTimers   = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
console.log("[useBoardSync] socket effect fired, projectId:", projectId, "phase:", phase);
  useEffect(() => { allPhasesRef.current = allPhases; }, [allPhases]);

  // ── Token wait ─────────────────────────────────────────────────────────────
  const waitForToken = async (): Promise<string | null> => {
    let token    = getAccessToken();
    let attempts = 0;
    while (!token && attempts < 10) {
      await new Promise(r => setTimeout(r, 200));
      token = getAccessToken();
      attempts++;
    }
    return token;
  };

  // ── 1. Load board from DB ──────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const token = await waitForToken();
      if (!token)    { if (!cancelled) setError("Not authenticated"); return; }
      if (cancelled) return;
       try {
        console.log("🟢 about to call GET /boards, token present:", !!token);
        const { data } = await api.get(`/boards/${projectId}`);
        console.log("🟢 GET /boards RESOLVED:", data);
        if (cancelled) return;
        const board = data.board ?? data;
        setAllPhases({
          planning:    board.phases?.planning    ?? {},
          design:      board.phases?.design      ?? {},
          development: board.phases?.development ?? {},
        });
        setLoaded(true);
      } catch (err: any) {
        console.log("🔴 GET /boards REJECTED:", err);
        if (!cancelled) setError(err?.message ?? "Failed to load board");
      }
     /* try {
        const { data } = await api.get(`/boards/${projectId}`);
        if (cancelled) return;
        const board = data.board ?? data;
        setAllPhases({
          planning:    board.phases?.planning    ?? {},
          design:      board.phases?.design      ?? {},
          development: board.phases?.development ?? {},
        });
        setLoaded(true);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load board");
      }*/
    })();

    return () => { cancelled = true; };
  }, [projectId]);
   
  // ── 2. Socket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      const token = await waitForToken();
      if (!token || cancelled) return;

      const socket = io(`${SERVER_URL}/board`, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        mySocketId.current = socket.id ?? "";
        // Send boardType so server puts us in the right room
        socket.emit("board:join", { projectId, boardType: phase });
      });

      socket.on("connect_error", (err) => {
        console.error("[useBoardSync] connect error:", err.message);
      });

      // ── Incoming canvas patch from co-editor ──────────────────────────────
      socket.on("board:patch", (payload: {
        phase:      BoardPhase;
        data:       PhaseData;
        sentBy:     string;
        sentByName: string;
      }) => {
        if (payload.sentBy === mySocketId.current) return;
        setAllPhases(prev => ({
          ...prev,
          [payload.phase]: { ...prev[payload.phase], ...payload.data },
        }));
      });

      // ── Cursor events ─────────────────────────────────────────────────────
      socket.on("cursor:move", (data: CursorState) => {
        setCursors(prev => ({ ...prev, [data.userId]: data }));
      });

      // ── Presence events ───────────────────────────────────────────────────
      socket.on("presence:snapshot", (users: PresenceUser[]) => {
        setPresence(users);
      });

      socket.on("presence:joined", (user: PresenceUser) => {
        setPresence(prev => {
          if (prev.some(u => u.userId === user.userId)) return prev;
          return [...prev, user];
        });
      });

      socket.on("presence:left", ({ userId }: { userId: string }) => {
        setPresence(prev => prev.filter(u => u.userId !== userId));
        // Remove their cursor too
        setCursors(prev => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      });

      // ── Comment typing indicators ──────────────────────────────────────────
      socket.on("comment:typing", ({ threadId, userId: uid, name: uname }: {
        threadId: string; userId: string; name: string;
      }) => {
        setTypingUsers(prev => {
          const list = prev[threadId] ?? [];
          if (list.some(u => u.userId === uid)) return prev;
          return { ...prev, [threadId]: [...list, { userId: uid, name: uname }] };
        });

        // Self-healing: if no follow-up "typing" or explicit "stopTyping"
        // arrives within 3s, clear it automatically (covers dropped tabs).
        const key = `${threadId}:${uid}`;
        const existing = typingTimers.current.get(key);
        if (existing) clearTimeout(existing);
        typingTimers.current.set(key, setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [threadId]: (prev[threadId] ?? []).filter(u => u.userId !== uid),
          }));
          typingTimers.current.delete(key);
        }, 3000));
      });

      socket.on("comment:stopTyping", ({ threadId, userId: uid }: { threadId: string; userId: string }) => {
        const key = `${threadId}:${uid}`;
        const existing = typingTimers.current.get(key);
        if (existing) { clearTimeout(existing); typingTimers.current.delete(key); }
        setTypingUsers(prev => ({
          ...prev,
          [threadId]: (prev[threadId] ?? []).filter(u => u.userId !== uid),
        }));
      });
    })();

    return () => {
      cancelled = true;
      if (saveTimer.current)   clearTimeout(saveTimer.current);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      typingTimers.current.forEach(t => clearTimeout(t));
      typingTimers.current.clear();
      if (socketRef.current) {
        socketRef.current.emit("board:leave");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, phase]);

  // ── 3. Autosave ────────────────────────────────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!projectId) return;
      const token = getAccessToken();
      if (!token) return;
      try {
        await api.put(`/boards/${projectId}`, {
          phase,
          data: allPhasesRef.current[phase],
        });
      } catch (err: any) {
        console.warn("[useBoardSync] autosave failed:", err?.message);
      }
    }, AUTOSAVE_DELAY);
  }, [projectId, phase]);

  // ── 4. syncPatch ───────────────────────────────────────────────────────────
  const syncPatch = useCallback((data: PhaseData) => {
    if (!projectId) return;

    setAllPhases(prev => ({
      ...prev,
      [phase]: { ...prev[phase], ...data },
    }));

    socketRef.current?.emit("board:patch", { projectId, boardType: phase, phase, data });

    scheduleSave();
  }, [projectId, phase, scheduleSave]);

  // ── 5. emitCursor — throttled to CURSOR_THROTTLE_MS ───────────────────────
  const emitCursor = useCallback((x: number, y: number) => {
    if (cursorTimer.current) return;   // still in throttle window — skip
    cursorTimer.current = setTimeout(() => {
      cursorTimer.current = null;
    }, CURSOR_THROTTLE_MS);
    socketRef.current?.emit("cursor:move", { x, y });
  }, []);

  // ── 6. Comment typing emitters ──────────────────────────────────────────
  const emitCommentTyping = useCallback((threadId: string) => {
    socketRef.current?.emit("comment:typing", { threadId });
  }, []);

  const emitCommentStopTyping = useCallback((threadId: string) => {
    socketRef.current?.emit("comment:stopTyping", { threadId });
  }, []);

  return {
    phaseData: allPhases[phase],
    allPhases,
    syncPatch,
    emitCursor,
    socket:    socketRef,
    loaded,
    error,
    cursors,
    presence,
    typingUsers,
    emitCommentTyping,
    emitCommentStopTyping,
  };
}
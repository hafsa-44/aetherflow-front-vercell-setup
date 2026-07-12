
//new file 
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

export interface TypingUser {
  userId: string;
  name:   string;
}

export interface PresenceUser {
  userId: string;
  name:   string;
  color:  string;
}

interface UseBoardSyncReturn {
  phaseData:  PhaseData;
  allPhases:  Record<BoardPhase, PhaseData>;
  syncPatch:  (data: PhaseData) => void;
  emitCursor: (x: number, y: number) => void;
  socket:     React.RefObject<Socket | null>;
  loaded:     boolean;
  error:      string | null;
  cursors:    Record<string, CursorState>;   // keyed by userId
  presence:   PresenceUser[];
  typingUsers: Record<string, TypingUser[]>;
  saveError:  string | null;
  emitCommentTyping: (threadId: string) => void;
  emitCommentStopTyping: (threadId: string) => void;
  emitCommentRead: (threadId: string, commentId: string) => void;
}

const SERVER_URL         = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
const AUTOSAVE_DELAY     = 5_000;
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
  const [saveError, setSaveError] = useState<string | null>(null);

  const socketRef    = useRef<Socket | null>(null);
  const mySocketId   = useRef("");
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allPhasesRef = useRef(allPhases);
  const phaseRef     = useRef(phase);

  // key: `${threadId}:${userId}` → auto-clear timeout, in case a stopTyping
  // event never arrives (tab closed mid-keystroke, dropped connection, etc.)
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
      }
    })();

    return () => { cancelled = true; };
  }, [projectId]);

  // ── 2. Socket — created ONCE per project, not per phase ─────────────────────
  // A single effect owns the socket's entire lifecycle: connect, join,
  // every listener, and teardown. Re-running this per phase change would
  // tear down and reopen the connection on every board switch, so phase
  // changes are instead handled by the separate re-join effect below.
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
        socket.emit("board:join", { projectId, boardType: phaseRef.current });
      });

      socket.on("connect_error", (err) => {
        console.error("[useBoardSync] connect error:", err.message);
      });

      // ── Incoming canvas patch from co-editor ─────────────────────────────
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

      socket.on("comment:read", ({
        phase: readPhase, threadId, commentId, userId: readerId,
      }: { phase: BoardPhase; threadId: string; commentId: string; userId: string }) => {
        setAllPhases(prev => {
          const list = (prev[readPhase]?.commentThreads as any[]) ?? [];
          if (!list.length) return prev;

          let changed = false;
          const updated = list.map((t: any) => {
            if (t.id !== threadId) return t;
            const comments = t.comments.map((c: any) => {
              if (c.id !== commentId) return c;
              if ((c.readBy ?? []).includes(readerId)) return c;
              changed = true;
              return { ...c, readBy: [...(c.readBy ?? []), readerId] };
            });
            return { ...t, comments };
          });

          if (!changed) return prev;
          return { ...prev, [readPhase]: { ...prev[readPhase], commentThreads: updated } };
        });
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
  }, [projectId]);

  // ── 3. Re-join the correct room when the phase changes ──────────────────────
  // Does NOT recreate the socket — just tells the server which board room
  // this connection should be in now.
  useEffect(() => {
    phaseRef.current = phase;
    const socket = socketRef.current;
    if (socket?.connected && projectId) {
      socket.emit("board:join", { projectId, boardType: phase });
    }
  }, [phase, projectId]);

  // ── 4. Autosave ────────────────────────────────────────────────────────────
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
        setSaveError(null); // clears any previous failure once a save succeeds
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? "Save failed";
        console.warn("[useBoardSync] autosave failed:", msg);
        setSaveError(msg);
        setTimeout(() => setSaveError(null), 6000); // auto-clear after 6s
      }
    }, AUTOSAVE_DELAY);
  }, [projectId, phase]);

  // ── 5. syncPatch ───────────────────────────────────────────────────────────
  const syncPatch = useCallback((data: PhaseData) => {
    if (!projectId) return;

    setAllPhases(prev => ({
      ...prev,
      [phase]: { ...prev[phase], ...data },
    }));

    socketRef.current?.emit("board:patch", { projectId, boardType: phase, phase, data });

    scheduleSave();
  }, [projectId, phase, scheduleSave]);

  // ── 6. emitCursor — throttled to CURSOR_THROTTLE_MS ─────────────────────────
  const emitCursor = useCallback((x: number, y: number) => {
    if (cursorTimer.current) return;   // still in throttle window — skip
    cursorTimer.current = setTimeout(() => {
      cursorTimer.current = null;
    }, CURSOR_THROTTLE_MS);
    socketRef.current?.emit("cursor:move", { x, y });
  }, []);

  // ── 7. Comment typing / read emitters ────────────────────────────────────────
  const emitCommentTyping = useCallback((threadId: string) => {
    socketRef.current?.emit("comment:typing", { threadId });
  }, []);

  const emitCommentStopTyping = useCallback((threadId: string) => {
    socketRef.current?.emit("comment:stopTyping", { threadId });
  }, []);

  const emitCommentRead = useCallback((threadId: string, commentId: string) => {
    if (!projectId) return;
    socketRef.current?.emit("comment:read", {
      projectId, boardType: phase, phase, threadId, commentId,
    });
  }, [projectId, phase]);

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
    emitCommentRead,
    saveError,
  };
}
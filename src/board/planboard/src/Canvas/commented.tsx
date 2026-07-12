// CommentWindow.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Comment, CommentThread } from "./types";

type TypingUser = { userId: string; name: string };

type Props = {
  activeThreadId: string | null;
  commentThreads: CommentThread[];
  setCommentThreads: React.Dispatch<React.SetStateAction<CommentThread[]>>;
  setActiveThreadId: React.Dispatch<React.SetStateAction<string | null>>;
  currentUser: string;
  currentUserId: string;
  activeTool: any;
  onCommentAttached?: () => void;
  /** true if at least one other project member is currently connected to this board */
  othersOnline?: boolean;
  /** other users currently typing in this exact thread */
  typingUsers?: TypingUser[];
  onTyping?: () => void;
  onStopTyping?: () => void;
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const TYPING_STOP_DELAY = 1500; // ms of no keystrokes before we tell others "stopped typing"

// Consistent avatar colour derived from username
function avatarColor(name: string): string {
  const palette = [
    "#3949AB", "#00897B", "#E53935", "#FB8C00",
    "#8E24AA", "#00ACC1", "#43A047", "#F4511E",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── NEW FORMATTER: Includes Date + Time ─────────────────────────────────────────
function formatDateTime(ts?: string): string {
  if (!ts) return "";
  const dateObj = new Date(ts);
  
  // Clean format: "Oct 24, 05:30 PM" (Compact and looks premium)
  return dateObj.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ── Avatar circle ──────────────────────────────────────────────────────────────
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: avatarColor(name),
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700, color: "#fff",
        flexShrink: 0, userSelect: "none",
        boxShadow: `0 1px 4px ${avatarColor(name)}66`,
      }}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Status tick — sent (single grey) / delivered (double grey) / read (double blue) ──
function StatusTick({ status }: { status: "sent" | "delivered" | "read" }) {
  const color = status === "read" ? "#4c6ef5" : "#9aa3b8";
  if (status === "sent") {
    return <span style={{ color, fontSize: 11 }}>✓</span>;
  }
  return <span style={{ color, fontSize: 11, letterSpacing: "-1px" }}>✓✓</span>;
}

// ── Typing indicator — three-dot bubble, WhatsApp style ────────────────────────
function TypingBubble({ typingUsers }: { typingUsers: TypingUser[] }) {
  if (typingUsers.length === 0) return null;
  const label = typingUsers.length === 1
    ? `${typingUsers[0].name} is typing…`
    : `${typingUsers.map((u) => u.name).join(", ")} are typing…`;
  return (
    <div className="cw-bubble" style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Avatar name={typingUsers[0].name} size={34} />
      <div style={{
        background: "#ffffff", borderRadius: "4px 16px 16px 16px",
        padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ fontSize: 11, color: "#9aa3b8", marginRight: 4 }}>{label}</span>
        <span className="cw-typing-dot" style={{ animationDelay: "0s" }} />
        <span className="cw-typing-dot" style={{ animationDelay: "0.15s" }} />
        <span className="cw-typing-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}

const CommentModule: React.FC<Props> = ({
  activeThreadId,
  commentThreads,
  setCommentThreads,
  setActiveThreadId,
  currentUser,
  currentUserId,
  onCommentAttached,
  othersOnline = false,
  typingUsers = [],
  onTyping,
  onStopTyping,
}) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const thread = commentThreads.find((t) => t.id === activeThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.comments.length]);

  // Focus input whenever the panel opens
  useEffect(() => {
    if (activeThreadId) setTimeout(() => inputRef.current?.focus(), 80);
  }, [activeThreadId]);

  // ── Read receipts ──────────────────────────────────────────────────────────
  // Whenever this thread is open and there are messages from someone else that
  // I haven't marked as read yet, mark them read. Runs on open + whenever new
  // messages arrive while the panel is already open (live "seen" like WhatsApp).
  useEffect(() => {
    if (!activeThreadId || !thread || !currentUserId) return;
    const hasUnread = thread.comments.some(
      (c) => (c.user ?? c.userId) && (c.user ?? c.userId) !== currentUserId && !(c.readBy ?? []).includes(currentUserId)
    );
    if (!hasUnread) return;
    setCommentThreads((prev) =>
      prev.map((t) =>
        t.id !== activeThreadId
          ? t
          : {
              ...t,
              comments: t.comments.map((c) =>
                (c.user ?? c.userId) && (c.user ?? c.userId) !== currentUserId && !(c.readBy ?? []).includes(currentUserId)
                  ? { ...c, readBy: [...(c.readBy ?? []), currentUserId] }
                  : c
              ),
            }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, thread?.comments.length, currentUserId]);

  // Clear the stop-typing timer + tell others we stopped when the panel closes/unmounts
  useEffect(() => {
    return () => {
      if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
      if (isTypingRef.current) onStopTyping?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId]);

  if (!activeThreadId || !thread) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.();
    }
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    stopTypingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onStopTyping?.();
    }, TYPING_STOP_DELAY);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Sending counts as "done typing" — stop the indicator immediately
    if (stopTypingTimer.current) clearTimeout(stopTypingTimer.current);
    if (isTypingRef.current) { isTypingRef.current = false; onStopTyping?.(); }

    setCommentThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              comments: [
                ...t.comments,
                {
                  id: uid(),
                  user: currentUser,
                  userId: currentUserId,
                  text: message.trim(),
                  timestamp: new Date().toISOString(),
                  readBy: [],
                },
              ],
            }
          : t
      )
    );
    setMessage("");
    onCommentAttached?.();
  };

  const handleClose = () => setActiveThreadId(null);

  // sent → grey single check · delivered → grey double check · read → blue double check
  const statusFor = (c: Comment): "sent" | "delivered" | "read" => {
    const readByOthers = (c.readBy ?? []).some((id) => id !== currentUserId);
    if (readByOthers) return "read";
    if (othersOnline) return "delivered";
    return "sent";
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "calc(2% + 110px)",   
        bottom: 28,
        width: 368,
        height: 530,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.14)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2000,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        animation: "cwSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes cwSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes cwMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .cw-bubble { animation: cwMsgIn 0.16s ease; }
        .cw-send:hover:not(:disabled) { background: #1a56c4 !important; }
        .cw-send:active { transform: scale(0.92); }
        .cw-input:focus { outline: none; }
        .cw-input::placeholder { color: #b0b8c9; }
        .cw-close:hover { background: rgba(255,255,255,0.18) !important; }
        @keyframes cwTypingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .cw-typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #9aa3b8;
          animation: cwTypingBounce 1.1s infinite ease-in-out;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #04174c 0%, #0e4fa8 100%)",
        padding: "13px 14px",
        display: "flex", alignItems: "center", gap: 11,
        flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "1.5px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>💬</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.2px" }}>
            Discussion
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 1 }}>
            {thread.comments.length === 0
              ? "No messages yet"
              : `${thread.comments.length} message${thread.comments.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        <button
          className="cw-close"
          onClick={handleClose}
          title="Close"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 18, lineHeight: 1,
            width: 30, height: 30, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
            transition: "background 0.15s",
          }}
        >×</button>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "14px 12px 8px",
        background: "#F0F2F8",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        {thread.comments.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "#9aa3b8", fontSize: 13, gap: 10, paddingTop: 60,
          }}>
            <div style={{ fontSize: 40, filter: "grayscale(0.3)" }}>💬</div>
            <div style={{ fontWeight: 500 }}>No messages yet</div>
            <div style={{ fontSize: 12, color: "#b5bcc8" }}>Be the first to say something!</div>
          </div>
        ) : (
          thread.comments.map((c: Comment, i: number) => {
            const isMe = c.user === currentUser;
            return (
              <div
                key={i}
                className="cw-bubble"
                style={{
                  display: "flex",
                  flexDirection: isMe ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 9,
                }}
              >
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <Avatar name={c.user} size={34} />
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  maxWidth: "75%", // Increased slightly to give text and date room
                  gap: 3,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: isMe ? "#3b5bdb" : avatarColor(c.user),
                    letterSpacing: "0.1px",
                    paddingLeft: isMe ? 0 : 2,
                    paddingRight: isMe ? 2 : 0,
                  }}>
                    {c.user}
                  </div>

                  <div style={{
                    background: isMe
                      ? "linear-gradient(135deg, #3b5bdb, #4c6ef5)"
                      : "#ffffff",
                    color: isMe ? "#fff" : "#1a1d27",
                    borderRadius: isMe
                      ? "16px 4px 16px 16px"
                      : "4px 16px 16px 16px",
                    padding: "9px 13px 7px",
                    boxShadow: isMe
                      ? "0 2px 8px rgba(59,91,219,0.35)"
                      : "0 1px 4px rgba(0,0,0,0.10)",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {c.text}
                  </div>

                  {/* ── Updated Timestamp Display Block ── */}
                  <div style={{
                    fontSize: 10, color: "#9aa3b8",
                    display: "flex", alignItems: "center", gap: 5,
                    paddingLeft: isMe ? 0 : 2,
                    paddingRight: isMe ? 2 : 0,
                    whiteSpace: "nowrap"
                  }}>
                    <span>{formatDateTime(c.timestamp)}</span>
                    {isMe && <StatusTick status={statusFor(c)} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <TypingBubble typingUsers={typingUsers} />
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input row ── */}
      <div style={{
        background: "#fff",
        padding: "10px 12px",
        display: "flex", alignItems: "center", gap: 8,
        flexShrink: 0,
        borderTop: "1px solid #e8eaf0",
      }}>
        <Avatar name={currentUser} size={30} />

        <div style={{
          flex: 1, background: "#F0F2F8", borderRadius: 22,
          padding: "8px 14px", display: "flex", alignItems: "center",
          border: "1.5px solid transparent",
          transition: "border-color 0.15s",
        }}>
          <input
            ref={inputRef}
            className="cw-input"
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Write a comment…"
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13.5, color: "#1a1d27", fontFamily: "inherit",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
        </div>

        <button
          className="cw-send"
          onClick={handleSend}
          disabled={!message.trim()}
          title="Send"
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: message.trim() ? "#3b5bdb" : "#d0d5e8",
            border: "none",
            cursor: message.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s, transform 0.1s",
            boxShadow: message.trim() ? "0 2px 10px rgba(59,91,219,0.45)" : "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 21L23 12 2 3v7l15 2-15 2v7z" fill="#fff" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommentModule;
// src/components/NotificationBell.tsx
// Drop-in replacement for the hardcoded <button> bell in Navbar_.jsx
//
// Props:
//   socket — the Socket.IO client instance from your existing socket setup
//
// Usage in Navbar_.jsx:
//   import NotificationBell from "./NotificationBell";
//   <NotificationBell socket={socketRef.current} />

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import api from "../api";

interface Notification {
  _id:       string;
  message:   string;
  type:      "deadline" | "user_joined" | "phase_advanced" | "general";
  projectId: string | null;
  createdAt: string;
  read:      boolean;
}

interface Props {
  socket: any;   // your existing socket.io-client instance
}

export default function NotificationBell({ socket }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.length;

  // ── Load unread from server on mount ─────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch {
      // silently fail — bell just shows 0
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Live socket updates ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    const handler = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socket.on("notification:new", handler);
    return () => socket.off("notification:new", handler);
  }, [socket]);

  // ── Close dropdown when clicking outside ─────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return ()  => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read");
      setNotifications([]);
    } catch {
      // ignore
    }
  };

  // ── Mark one as read ──────────────────────────────────────────────────────
  const markOneRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {
      // ignore
    }
  };

  // ── Relative time helper ──────────────────────────────────────────────────
  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return "just now";
    if (mins < 60)  return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ── Type icon ─────────────────────────────────────────────────────────────
  const typeIcon = (type: Notification["type"]) => {
    const base = "w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0";
    switch (type) {
      case "deadline":      return <div className={`${base} bg-red-100 text-red-600`}>⏰</div>;
      case "user_joined":   return <div className={`${base} bg-green-100 text-green-600`}>👋</div>;
      case "phase_advanced":return <div className={`${base} bg-blue-100 text-blue-600`}>🚀</div>;
      default:              return <div className={`${base} bg-gray-100 text-gray-500`}>🔔</div>;
    }
  };

  return (
    <div className="relative flex-shrink-0" ref={dropdownRef}>

      {/* ── Bell button ── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} style={{ color: "#E9E4DE" }} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-white font-bold leading-none"
            style={{ fontSize: 9 }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          className="absolute right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 flex flex-col"
         // style={{ width: 340, maxHeight: 440 }}
          style={{ width: "min(340px, 90vw)", maxHeight: 440 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-800">
              Notifications {unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} />
                  I get it 
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            )}

            {!loading && notifications.map(n => (
              <div
                key={n._id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
              >
                {typeIcon(n.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                </div>
                <button
                  onClick={() => markOneRead(n._id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors mt-0.5"
                  title="Dismiss"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
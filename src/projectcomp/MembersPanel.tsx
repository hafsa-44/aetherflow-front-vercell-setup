//// components/MembersPanel.tsx
// Real-time members panel with "currently viewing" presence.
// When any member opens this panel, all other connected members
// see their avatar appear in the "viewing now" row — exactly like Figma.

import { useEffect, useState, useCallback, useRef } from "react";
import {
  X, Users, Link, Copy, Check, Clock,
  Loader2, Crown, Shield, Code2, Pen, Eye, AlertTriangle,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { getAccessToken } from "../api";
import api from "../api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  userId:         string;
  name:           string;
  email:          string;
  profilePicture: string | null;
  role:           "owner" | "manager" | "developer" | "designer" | "member";
  joinedAt:       string;
}

interface PendingInvite {
  _id:       string;
  email:     string;
  role:      string;
  expiresAt: string;
  token:     string;
}

// Who is currently viewing the panel
interface ViewingUser {
  userId: string;
  name:   string;
  color:  string;
}

interface Props {
  projectId:   string;
  isOpen:      boolean;
  onClose:     () => void;
  canInvite:   boolean;
  currentUser: { _id: string; name: string } | null;
}

// ── Role config ───────────────────────────────────────────────────────────────

const ROLE_CONFIG = {
  owner:     { label: "Owner",     icon: <Crown  size={11} />, color: "bg-amber-50 text-amber-700 border-amber-200"   },
  manager:   { label: "Manager",   icon: <Shield size={11} />, color: "bg-blue-50 text-blue-700 border-blue-200"      },
  developer: { label: "Developer", icon: <Code2  size={11} />, color: "bg-green-50 text-green-700 border-green-200"   },
  designer:  { label: "Designer",  icon: <Pen    size={11} />, color: "bg-purple-50 text-purple-700 border-purple-200"},
  member:    { label: "Member",    icon: <Eye    size={11} />, color: "bg-gray-50 text-gray-500 border-gray-200"      },
} as const;

const INVITABLE_ROLES = ["manager", "developer", "designer", "member"] as const;
type InvitableRole = typeof INVITABLE_ROLES[number];

// Deterministic color from name — same user always gets same color
const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
function userColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, picture, size = 32, title }: {
  name: string; picture?: string | null; size?: number; title?: string;
}) {
  if (picture) {
    return (
      <img src={picture} alt={name} title={title ?? name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    );
  }
  return (
    <div title={title ?? name} style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: userColor(name), color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700,
    }}>
      {initials(name)}
    </div>
  );
}

function RoleBadge({ role }: { role: keyof typeof ROLE_CONFIG }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-md whitespace-nowrap ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MembersPanel({ projectId, isOpen, onClose, canInvite, currentUser }: Props) {
  const [members,        setMembers]        = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [viewingNow,     setViewingNow]     = useState<ViewingUser[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [selectedRole,   setSelectedRole]   = useState<InvitableRole>("developer");
  const [inviteEmail,    setInviteEmail]    = useState("");
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState("");
  const [sendSuccess,    setSendSuccess]    = useState("");
  const [copied,         setCopied]         = useState("");

  // When re-inviting an email that already has a pending invite with a
  // DIFFERENT role, the backend will rotate the token — killing any link
  // that was already copied/emailed. We confirm with the user first instead
  // of doing that silently.
  const [pendingRoleChangeConfirm, setPendingRoleChangeConfirm] = useState<{
    email: string; oldRole: string; newRole: InvitableRole;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // ── Socket setup for panel presence ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !projectId || !currentUser) return;

    const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL ?? "http://localhost:5000";

    let socket: Socket;
    let cancelled = false;

    (async () => {
      let token = getAccessToken();
      let attempts = 0;
      while (!token && attempts < 10) {
        await new Promise(r => setTimeout(r, 200));
        token = getAccessToken();
        attempts++;
      }
      if (!token || cancelled) return;

      // Must connect to the /board namespace — that's where board:join,
      // members:open, members:close, etc. are all registered server-side.
      // Connecting to the root namespace means these events go nowhere.
      socket = io(`${SERVER_URL}/board`, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: { token },
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        // Server derives the user from the auth token — only projectId is needed.
        // This does its own membership check server-side, so it works even
        // though this socket never called board:join.
        socket.emit("members:open", { projectId });
      });

      // Receive the current list of who's viewing the panel
      socket.on("members:viewing", (viewers: ViewingUser[]) => {
        // Exclude ourselves from the "viewing now" list
        setViewingNow(viewers.filter(v => v.userId !== currentUser._id));
      });

      socket.on("board:error", ({ message }: { message: string }) => {
        console.error("MembersPanel socket error:", message);
      });

      // When someone new joins the project (accepted invite) — refresh members
      socket.on("project:updated", () => {
        loadData();
      });
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit("members:close");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setViewingNow([]);
    };
  }, [isOpen, projectId, currentUser]);

  // ── Load members + pending invites ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!projectId || !isOpen) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.allSettled([
        api.get(`/projects/${projectId}/members`),
        canInvite
          ? api.get(`/invites/project/${projectId}`)
          : Promise.resolve({ data: [] }),
      ]);
      if (membersRes.status === "fulfilled") setMembers(membersRes.value.data);
      if (invitesRes.status === "fulfilled")  setPendingInvites(invitesRes.value.data);
    } catch (err) {
      console.error("MembersPanel loadData:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, isOpen, canInvite]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setInviteEmail("");
      setSendError("");
      setSendSuccess("");
      setCopied("");
      setPendingRoleChangeConfirm(null);
    }
  }, [isOpen, loadData]);

  // ── Send invite (actual API call) ───────────────────────────────────────────
  const doSendInvite = async (trimmedEmail: string, role: InvitableRole) => {
    setSending(true);
    try {
      const res = await api.post("/invites", { projectId, email: trimmedEmail, role });
      const emailSent = res.data?.emailSent !== false;
      setSendSuccess(
        emailSent
          ? `Invite sent to ${trimmedEmail}`
          : `Invite created for ${trimmedEmail}, but the email failed to send. You can still copy the link below.`
      );
      setInviteEmail("");
      await loadData();
    } catch (err: any) {
      setSendError(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setSending(false);
      setPendingRoleChangeConfirm(null);
    }
  };

  // ── Send invite (entry point — checks for role-change conflicts first) ─────
  const handleSendInvite = async () => {
    setSendError(""); setSendSuccess("");
    const trimmed = inviteEmail.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSendError("Enter a valid email address.");
      return;
    }

    // If there's already a pending invite for this email with a DIFFERENT
    // role, warn the user first — sending will invalidate the old link.
    const existing = pendingInvites.find(i => i.email.toLowerCase() === trimmed);
    if (existing && existing.role !== selectedRole) {
      setPendingRoleChangeConfirm({ email: trimmed, oldRole: existing.role, newRole: selectedRole });
      return;
    }

    await doSendInvite(trimmed, selectedRole);
  };

  // ── Copy invite link ───────────────────────────────────────────────────────
  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try { await navigator.clipboard.writeText(link); }
    catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(token);
    setTimeout(() => setCopied(""), 2000);
  };

  // ── Revoke invite ──────────────────────────────────────────────────────────
  const handleRevoke = async (inviteId: string) => {
    try {
      await api.delete(`/invites/${inviteId}`);
      setPendingInvites(p => p.filter(i => i._id !== inviteId));
    } catch (err: any) {
      console.error("Revoke failed:", err.response?.data?.message);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col bg-white border-l border-gray-100 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Members</h2>
            {!loading && (
              <span className="text-xs text-gray-400">({members.length})</span>
            )}
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* ── Viewing now banner ───────────────────────────────────────── */}
        {viewingNow.length > 0 && (
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2 flex-shrink-0">
            <div className="flex -space-x-1.5">
              {viewingNow.slice(0, 5).map(v => (
                <div key={v.userId} title={`${v.name} is viewing`} style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: v.color, border: "2px solid #eef2ff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0,
                }}>
                  {initials(v.name)}
                </div>
              ))}
            </div>
            <p className="text-xs text-indigo-600 font-medium">
              {viewingNow.length === 1
                ? `${viewingNow[0].name} is also viewing`
                : `${viewingNow.length} others are viewing`
              }
            </p>
            {/* Live pulse dot */}
            <span className="ml-auto flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
            </span>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Current members ──────────────────────────────────────── */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Current members
            </p>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={20} className="animate-spin text-gray-300" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No members yet.</p>
            ) : (
              <div className="space-y-0.5">
                {members.map((m, i) => (
                  <div key={m.userId + i}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <Avatar name={m.name} picture={m.profilePicture} size={32} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    </div>
                    <RoleBadge role={m.role} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Pending invites ──────────────────────────────────────── */}
          {canInvite && pendingInvites.length > 0 && (
            <>
              <div className="mx-5 border-t border-gray-100" />
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Pending invites
                </p>
                <div className="space-y-2">
                  {pendingInvites.map(invite => (
                    <div key={invite._id}
                      className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Clock size={12} className="text-amber-400 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-700 truncate flex-1">{invite.email}</p>
                        <RoleBadge role={invite.role as keyof typeof ROLE_CONFIG} />
                      </div>
                      <div className="flex items-center justify-between pl-5">
                        <p className="text-xs text-gray-400">
                          Expires {new Date(invite.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleCopyLink(invite.token)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all ${
                              copied === invite.token
                                ? "border-green-300 bg-green-50 text-green-700"
                                : "border-gray-200 bg-white text-gray-500 hover:text-gray-700"
                            }`}>
                            {copied === invite.token ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy link</>}
                          </button>
                          <button onClick={() => handleRevoke(invite._id)}
                            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Invite section ───────────────────────────────────────── */}
          {canInvite && (
            <>
              <div className="mx-5 border-t border-gray-100" />
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Invite someone
                </p>

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {INVITABLE_ROLES.map(role => {
                    const cfg = ROLE_CONFIG[role];
                    return (
                      <button key={role} type="button" onClick={() => setSelectedRole(role)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                          selectedRole === role
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}>
                        {cfg.icon}{cfg.label}
                      </button>
                    );
                  })}
                </div>

                {/* Role-change confirmation — sending would invalidate the
                    recipient's existing link, so we ask first. */}
                {pendingRoleChangeConfirm && (
                  <div className="mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex gap-2">
                      <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>{pendingRoleChangeConfirm.email}</strong> already has a pending invite as{" "}
                        <strong>{ROLE_CONFIG[pendingRoleChangeConfirm.oldRole as keyof typeof ROLE_CONFIG]?.label ?? pendingRoleChangeConfirm.oldRole}</strong>.
                        Sending as <strong>{ROLE_CONFIG[pendingRoleChangeConfirm.newRole].label}</strong> will
                        invalidate their existing invite link.
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 pl-6">
                      <button
                        onClick={() => doSendInvite(pendingRoleChangeConfirm.email, pendingRoleChangeConfirm.newRole)}
                        disabled={sending}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors">
                        {sending ? "Sending…" : "Send anyway"}
                      </button>
                      <button
                        onClick={() => setPendingRoleChangeConfirm(null)}
                        disabled={sending}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Email + send */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setSendError(""); setSendSuccess(""); setPendingRoleChangeConfirm(null); }}
                    onKeyDown={e => { if (e.key === "Enter") handleSendInvite(); }}
                    placeholder="colleague@example.com"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                  />
                  <button onClick={handleSendInvite} disabled={sending}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Link size={13} />}
                    Send
                  </button>
                </div>

                {sendError   && <p className="text-xs text-red-500 mt-1 flex items-center gap-1">⚠ {sendError}</p>}
                {sendSuccess && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={11} /> {sendSuccess}</p>}

                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  An invite link is emailed to the address above. They can open it to join without an account.
                </p>
              </div>
            </>
          )}

          {!canInvite && (
            <>
              <div className="mx-5 border-t border-gray-100" />
              <p className="text-xs text-gray-400 text-center py-4 px-5">
                Only owners and managers can invite new members.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
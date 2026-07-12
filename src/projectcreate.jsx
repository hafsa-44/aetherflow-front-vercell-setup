import { useState } from "react";
import {
  X, UserPlus, Crown, Shield, User, Trash2,
  Briefcase, UserCheck, Mail, Users, Send,
} from "lucide-react";
import api from "./api";
import { useNavigate } from "react-router-dom";
import { random } from "mermaid/dist/utils.js";
import {ROLES,CATEGORIES,PROJECT_COLORS,EMAIL_REGEX,randomColor} from "../constant/project_constant";

{/*const ROLES = {
  manager: { label: "Manager",     description: "Can manage tasks, invite members, edit settings", icon: Shield },
  member:  { label: "Member",      description: "Can view and update tasks only",                  icon: User   },
};

const CATEGORIES = ["Development", "Design", "Marketing", "Research", "Sales", "Other"];

const PROJECT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCB77",
  "#4D96FF", "#FF6BBF", "#A855F7", "#F97316",
];
const randomColor = () => PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;*/}

// ─────────────────────────────────────────────────────────────
// Props:
//   isOpen          : boolean
//   onClose         : () => void
//   onProjectCreated: (newProject) => void
//   availableUsers  : [{ _id, name, email }]
// ─────────────────────────────────────────────────────────────
function CreateProjectModal({ isOpen, onClose, onProjectCreated, availableUsers = [] }) {
  const navigate = useNavigate();

  // ── Mode ─────────────────────────────────────────────────
  const [mode, setMode] = useState("solo"); // "solo" | "team"

  // ── Form fields ──────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", description: "", category: "", deadline: "",
  });

  // ── Existing-user members (DB search) ───────────────────
  const [members,      setMembers]      = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Email invite queue ───────────────────────────────────
  const [teamTab,         setTeamTab]         = useState("existing"); // "existing" | "email"
  const [pendingInvites,  setPendingInvites]  = useState([]);  // [{ email, role }]
  const [inviteEmail,     setInviteEmail]     = useState("");
  const [inviteRole,      setInviteRole]      = useState("member");
  const [inviteFieldErr,  setInviteFieldErr]  = useState("");

  // ── Submit state ─────────────────────────────────────────
  const [submitting,    setSubmitting]    = useState(false);
  const [submitPhase,   setSubmitPhase]   = useState(""); // "" | "creating" | "inviting"
  const [error,         setError]         = useState("");
  const [inviteResults, setInviteResults] = useState([]); // per-invite feedback

  // ── Filtered dropdown list ───────────────────────────────
  const filteredUsers = availableUsers.filter(
    (u) =>
      !members.find((m) => m.userId === u._id) &&
      (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // ── Handlers: existing members ───────────────────────────
  const handleAddMember = (user) => {
    setMembers((prev) => [...prev, { userId: user._id, name: user.name, email: user.email, role: "member" }]);
    setMemberSearch("");
    setShowDropdown(false);
  };
  const handleRemoveMember  = (userId)          => setMembers((prev) => prev.filter((m) => m.userId !== userId));
  const handleRoleChange    = (userId, newRole) => setMembers((prev) => prev.map((m) => m.userId === userId ? { ...m, role: newRole } : m));

  // ── Handlers: email invite queue ─────────────────────────
  const handleQueueInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    setInviteFieldErr("");

    if (!EMAIL_REGEX.test(email)) {
      setInviteFieldErr("Enter a valid email address.");
      return;
    }
    if (pendingInvites.find((i) => i.email === email)) {
      setInviteFieldErr("Already in the invite list.");
      return;
    }
    if (members.find((m) => m.email?.toLowerCase() === email)) {
      setInviteFieldErr("Already added as a direct member.");
      return;
    }

    setPendingInvites((prev) => [...prev, { email, role: inviteRole }]);
    setInviteEmail("");
    setInviteRole("member");
  };

  const handleRemoveInvite      = (email)          => setPendingInvites((prev) => prev.filter((i) => i.email !== email));
  const handleInviteRoleChange  = (email, newRole) => setPendingInvites((prev) => prev.map((i) => i.email === email ? { ...i, role: newRole } : i));

  // ── Form change ──────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Reset ────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", deadline: "" });
    setMembers([]); setMemberSearch("");
    setPendingInvites([]); setInviteEmail(""); setInviteRole("member"); setInviteFieldErr("");
    setError(""); setInviteResults([]);
    setMode("solo"); setTeamTab("existing"); setSubmitPhase("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
   
  // ── Validation ──────────────────────────────────────
  if (!formData.name.trim()) {
    setError("Project name is required.");
    return;
  }
  if (!formData.category) {
    setError("Please select a category.");
    return;
  }
  if (!formData.deadline) {
    setError("Please set a deadline.");
    return;
  }
  if (!formData.description.trim()) {
    setError("Please add some few description.");
    return;
  }
  if (mode === "team" && members.length === 0 && pendingInvites.length === 0) {
    setError("Team project requires at least one member or email invite.");
    return;
  }
 

  setSubmitting(true);
  setInviteResults([]);
    try {
      // Phase 1 — create project
      setSubmitPhase("creating");
      const payload = {
        name:            formData.name.trim(),
        description:     formData.description.trim(),
        category:        formData.category,
        isCollaborative: mode === "team",
        visibility:      "private",
        deadline:        formData.deadline || null,
        color:           randomColor(),
        members: mode === "team" ? members.map((m) => ({ userId: m.userId, role: m.role })) : [],
      };

      const res        = await api.post("/projects", payload);
      const newProject = res.data;

      // Phase 2 — fire email invites (after project exists and has an _id)
      if (mode === "team" && pendingInvites.length > 0) {
        setSubmitPhase("inviting");

        const results = await Promise.allSettled(
          pendingInvites.map((invite) =>
            api.post("/invites", {
              projectId: newProject._id,
              email:     invite.email,
              role:      invite.role,
            })
          )
        );

        const feedback = results.map((result, i) => ({
          email:   pendingInvites[i].email,
          success: result.status === "fulfilled",
          message: result.status === "fulfilled"
            ? "Invite sent"
            : result.reason?.response?.data?.message ?? "Failed to send",
        }));

        setInviteResults(feedback);

        // If every invite failed, stay on form — project was still created
        if (feedback.every((f) => !f.success)) {
          setError("Project created but all invitations failed. You can resend from the board.");
          if (onProjectCreated) onProjectCreated(newProject);
          setSubmitting(false);
          setSubmitPhase("");
          return;
        }

        // Brief pause so user sees the success ticks before redirect
        await new Promise((r) => setTimeout(r, 1200));
      }

      if (onProjectCreated) onProjectCreated(newProject);
      resetForm();
      onClose();
      navigate(`/project/${newProject._id}/board`);
    } catch (err) {
      console.error("Create project failed:", err);
      setError(err.response?.data?.message || "Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
      setSubmitPhase("");
    }
  };

  // ── Submit button label ──────────────────────────────────
  const submitLabel = () => {
    if (!submitting) {
      return pendingInvites.length > 0
        ? `Create & Send ${pendingInvites.length} Invite${pendingInvites.length > 1 ? "s" : ""}`
        : "Create Project";
    }
    if (submitPhase === "creating") return "Creating project…";
    if (submitPhase === "inviting") return "Sending invites…";
    return "Please wait…";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-300">

        {/* Header */}
      
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">New Project</h2>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to create your project</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-6">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Invite results feedback */}
            {inviteResults.length > 0 && (
              <div className="border border-gray-200 divide-y divide-gray-100">
                {inviteResults.map((r) => (
                  <div key={r.email} className={`flex items-center justify-between px-4 py-2.5 text-xs ${r.success ? "bg-green-50" : "bg-red-50"}`}>
                    <span className="text-gray-700 font-medium">{r.email}</span>
                    <span className={r.success ? "text-green-700" : "text-red-600"}>
                      {r.success ? "✓ " : "✕ "}{r.message}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Project Information ── */}
            <div>
              <SectionLabel>Project Information</SectionLabel>
              <div className="space-y-4 mt-3">
                <div>
                  <FieldLabel required>Project Name</FieldLabel>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Q3 Marketing Campaign"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors" />
                </div>
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                    placeholder="Brief overview of the project scope and objectives"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Category</FieldLabel>
                    <select name="category" value={formData.category} onChange={handleChange} required
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer">
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Deadline</FieldLabel>
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Project Mode ── */}
            <div>
              <SectionLabel>Project Mode</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <ModeCard active={mode === "solo"} onClick={() => setMode("solo")}
                  icon={<Briefcase size={14} />} title="Solo Project" description="Only you. No team members." />
                <ModeCard active={mode === "team"} onClick={() => setMode("team")}
                  icon={<UserCheck size={14} />} title="Team Project" description="Add members or invite via email." />
              </div>
            </div>

            {/* ── Team section ── */}
            {mode === "team" && (
              <div>
                <SectionLabel>Team Members</SectionLabel>

                {/* Tab switcher */}
                <div className="flex border border-gray-200 mt-3">
                  <TabButton active={teamTab === "existing"} onClick={() => setTeamTab("existing")}
                    icon={<Users size={13} />} label="Add from App" />
                  <TabButton active={teamTab === "email"} onClick={() => setTeamTab("email")}
                    icon={<Mail size={13} />} label="Invite by Email"
                    badge={pendingInvites.length > 0 ? pendingInvites.length : null} />
                </div>

                {/* Tab: Add from App */}
                {teamTab === "existing" && (
                  <div className="border border-t-0 border-gray-200">
                    {/* Owner */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <Avatar letter="Y" dark />
                        <div>
                          <p className="text-sm font-medium text-gray-800">You (Project Creator)</p>
                          <p className="text-xs text-gray-500">Assigned automatically</p>
                        </div>
                      </div>
                      <RolePill icon={<Crown size={11} />} label="Owner" />
                    </div>

                    {/* Added members */}
                    {members.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <Avatar letter={member.name.charAt(0).toUpperCase()} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <RoleSelect value={member.role} onChange={(v) => handleRoleChange(member.userId, v)} />
                          <RemoveButton onClick={() => handleRemoveMember(member.userId)} />
                        </div>
                      </div>
                    ))}

                    {/* Search */}
                    <div className="relative">
                      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                        <UserPlus size={14} className="text-gray-400 flex-shrink-0" />
                        <input type="text" value={memberSearch}
                          onChange={(e) => { setMemberSearch(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                          placeholder="Search by name or email…"
                          className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400" />
                      </div>
                      {showDropdown && memberSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-30 max-h-44 overflow-y-auto">
                          {filteredUsers.length === 0
                            ? <p className="px-4 py-3 text-sm text-gray-500">No users found</p>
                            : filteredUsers.map((user) => (
                              <button key={user._id} type="button" onMouseDown={() => handleAddMember(user)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-b-0">
                                <Avatar letter={user.name.charAt(0).toUpperCase()} small />
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{user.name}</p>
                                  <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Invite by Email */}
                {teamTab === "email" && (
                  <div className="border border-t-0 border-gray-200">
                    {/* Input row */}
                    <div className="px-4 py-4 border-b border-gray-100">
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        Enter any email address — the person will receive a link to join this project.
                        They don't need an account yet.
                      </p>
                      <div className="flex gap-2">
                        <input type="email" value={inviteEmail}
                          onChange={(e) => { setInviteEmail(e.target.value); setInviteFieldErr(""); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleQueueInvite(); } }}
                          placeholder="colleague@example.com"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors" />
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                          className="px-2 py-2 text-xs font-medium border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-gray-500 cursor-pointer">
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                        </select>
                        <button type="button" onClick={handleQueueInvite}
                          className="px-3 py-2 bg-gray-900 text-white hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs font-semibold">
                          <Send size={12} /> Add
                        </button>
                      </div>
                      {inviteFieldErr && <p className="text-xs text-red-500 mt-2">{inviteFieldErr}</p>}
                    </div>

                    {/* Queued invites */}
                    {pendingInvites.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Mail size={20} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">No invites queued yet. Add emails above.</p>
                        <p className="text-xs text-gray-400 mt-1">Invitations are sent when you click "Create Project".</p>
                      </div>
                    ) : (
                      <div>
                        {pendingInvites.map((invite) => (
                          <div key={invite.email} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                <Mail size={12} className="text-gray-400" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{invite.email}</p>
                                <p className="text-xs text-gray-400">Pending — sent on project creation</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <RoleSelect value={invite.role} onChange={(v) => handleInviteRoleChange(invite.email, v)} />
                              <RemoveButton onClick={() => handleRemoveInvite(invite.email)} />
                            </div>
                          </div>
                        ))}
                        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold text-gray-700">{pendingInvites.length}</span>{" "}
                            invite email{pendingInvites.length !== 1 ? "s" : ""} will be sent when you create the project.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Role legend */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {Object.entries(ROLES).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={key} className="flex items-start gap-2 px-3 py-2.5 border border-gray-200 bg-gray-50">
                        <Icon size={13} className="text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{cfg.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{cfg.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-7 py-5 bg-gray-50 border-t border-gray-200">
            <div>
              {mode === "team" && pendingInvites.length > 0 && (
                <p className="text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{pendingInvites.length}</span>{" "}
                  email invite{pendingInvites.length > 1 ? "s" : ""} queued
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
              
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[180px] justify-center">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{submitLabel()}</>
                  : submitLabel()
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function SectionLabel({ children }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{children}</p>;
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function ModeCard({ active, onClick, icon, title, description }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-start gap-3 px-4 py-4 border text-left transition-colors ${active ? "border-gray-800 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-400"}`}>
      <div className={`mt-0.5 p-1.5 border flex-shrink-0 ${active ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 text-gray-500"}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-700"}`}>{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {active && <div className="ml-auto w-2 h-2 rounded-full bg-gray-800 mt-1 flex-shrink-0" />}
    </button>
  );
}

function TabButton({ active, onClick, icon, label, badge }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 ${active ? "border-gray-900 text-gray-900 bg-white" : "border-transparent text-gray-500 bg-gray-50 hover:text-gray-700"}`}>
      {icon}{label}
      {badge != null && (
        <span className="ml-1 px-1.5 py-0.5 bg-gray-900 text-white text-xs rounded-full leading-none">{badge}</span>
      )}
    </button>
  );
}

function Avatar({ letter, dark, small }) {
  return (
    <div className={`flex items-center justify-center font-bold flex-shrink-0 ${small ? "w-6 h-6 text-xs" : "w-7 h-7 text-xs"} ${dark ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"}`}>
      {letter}
    </div>
  );
}

function RolePill({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 border border-gray-300 bg-white">
      {icon}
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function RoleSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-xs font-medium px-2 py-1.5 border border-gray-300 bg-white text-gray-700 focus:outline-none focus:border-gray-500 cursor-pointer">
      <option value="member">Member</option>
      <option value="manager">Manager</option>
    </select>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
      <Trash2 size={13} />
    </button>
  );
}

export default CreateProjectModal;

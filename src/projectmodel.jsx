import { useState } from "react";
import {
  X, Shield, User, Trash2,
  Briefcase, UserCheck, Mail, Users,
} from "lucide-react";
import api from "./api";
import { useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLES = {
  manager: { label: "Manager", description: "Can manage tasks, invite members, edit settings", icon: Shield },
  member:  { label: "Member",  description: "Can view and update tasks only",                  icon: User   },
};

const CATEGORIES = ["Development", "Design", "Marketing", "Research", "Sales", "Other"];

const PROJECT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#6BCB77",
  "#4D96FF", "#FF6BBF", "#A855F7", "#F97316",
];

const randomColor = () => PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns today's date as "YYYY-MM-DD" in local time (not UTC) so the
// min attribute and comparison work correctly regardless of timezone.
function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Props:
 *   isOpen           : boolean
 *   onClose          : () => void
 *   onProjectCreated : (optimisticProject) => void   ← receives full object
 *   availableUsers   : [{ _id, name, email }]
 */
function CreateProjectModal({ isOpen, onClose, onProjectCreated, availableUsers = [] }) {
  const navigate = useNavigate();
  const TODAY = todayString();

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState("solo"); // "solo" | "team"

  // ── Form fields ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "", description: "", category: "", deadline: "",
  });

  // ── Existing-user members ─────────────────────────────────────────────────
  // Each entry: { userId, name, email, role }  ← full data, not just IDs
  const [members,      setMembers]      = useState([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ── Email invite queue ────────────────────────────────────────────────────
  const [teamTab,        setTeamTab]        = useState("existing");
  const [pendingInvites, setPendingInvites] = useState([]); // [{ email, role }]
  const [inviteEmail,    setInviteEmail]    = useState("");
  const [inviteRole,     setInviteRole]     = useState("member");
  const [inviteFieldErr, setInviteFieldErr] = useState("");

  // ── Submit state ──────────────────────────────────────────────────────────
  const [submitting,    setSubmitting]    = useState(false);
  const [submitPhase,   setSubmitPhase]   = useState("");
  const [error,         setError]         = useState("");
  const [inviteResults, setInviteResults] = useState([]);

  // ── Derived: dropdown filtered list ───────────────────────────────────────
  const filteredUsers = availableUsers.filter(
    (u) =>
      !members.find((m) => m.userId === u._id) &&
      (u.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // ── Handlers: existing members ────────────────────────────────────────────
  const handleAddMember = (user) => {
    setMembers((prev) => [
      ...prev,
      { userId: user._id, name: user.name, email: user.email, role: "member" },
    ]);
    setMemberSearch("");
    setShowDropdown(false);
  };

  const handleRemoveMember = (userId) =>
    setMembers((prev) => prev.filter((m) => m.userId !== userId));

  const handleRoleChange = (userId, newRole) =>
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
    );

  // ── Handlers: email invite queue ──────────────────────────────────────────
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

  const handleRemoveInvite     = (email)          => setPendingInvites((prev) => prev.filter((i) => i.email !== email));
  const handleInviteRoleChange = (email, newRole) => setPendingInvites((prev) => prev.map((i) => i.email === email ? { ...i, role: newRole } : i));

  // ── Form change ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Deadline change with past-date guard ──────────────────────────────────
  // FIX #1a: reject past dates at the onChange level (before submit)
  const handleDeadlineChange = (e) => {
    const value = e.target.value;
    if (value && value < TODAY) {
      setError("Deadline cannot be in the past.");
      // Still allow clearing — just don't persist a past value
      return;
    }
    setError("");
    setFormData((prev) => ({ ...prev, deadline: value }));
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ name: "", description: "", category: "", deadline: "" });
    setMembers([]); setMemberSearch(""); setShowDropdown(false);
    setPendingInvites([]); setInviteEmail(""); setInviteRole("member"); setInviteFieldErr("");
    setError(""); setInviteResults([]);
    setMode("solo"); setTeamTab("existing"); setSubmitPhase("");
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // ── Validation ──────────────────────────────────────────────────────────
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
    // FIX #1b: explicit past-date check before API submission
    if (formData.deadline < TODAY) {
      setError("Deadline cannot be in the past.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please add a short description.");
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

      // FIX #2: send { userId, role } only — backend doesn't need name/email
      // for storage, but we keep name/email locally for the optimistic update.
      const payload = {
        name:            formData.name.trim(),
        description:     formData.description.trim(),
        category:        formData.category,
        isCollaborative: mode === "team",
        visibility:      "private",
        deadline:        formData.deadline || null,
        color:           randomColor(),
        // Backend contract: members = [{ userId, role }]
        members: mode === "team"
          ? members.map((m) => ({ userId: m.userId, role: m.role }))
          : [],
      };

      const res        = await api.post("/projects", payload);
      const newProject = res.data;

      // Phase 2 — fire email invites
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

        if (feedback.every((f) => !f.success)) {
          setError("Project created but all invitations failed. You can resend from the board.");
          if (onProjectCreated) onProjectCreated(buildOptimisticProject(newProject, members));
          setSubmitting(false);
          setSubmitPhase("");
          return;
        }

        await new Promise((r) => setTimeout(r, 1200));
      }

      // FIX #3: pass a fully shaped optimistic project so the slider renders
      // immediately with correct memberCount — no extra GET needed.
      if (onProjectCreated) {
        onProjectCreated(buildOptimisticProject(newProject, members));
      }

      resetForm();
      onClose();
      navigate(`/project/${newProject._id}/board`);   // FIX: correct route

    } catch (err) {
      console.error("Create project failed:", err);
      setError(err.response?.data?.message || "Failed to create project. Please try again.");
    } finally {
      setSubmitting(false);
      setSubmitPhase("");
    }
  };

  const submitLabel = () => {
    if (!submitting)
      return pendingInvites.length > 0
        ? `Create & Send ${pendingInvites.length} Invite${pendingInvites.length > 1 ? "s" : ""}`
        : "Create Project";
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

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-4 py-2.5">
                {error}
              </div>
            )}

            {/* Invite-result feedback */}
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
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange} required
                    placeholder="e.g. Q3 Marketing Campaign"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange} rows={3}
                    placeholder="Brief overview of the project scope and objectives"
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Category</FieldLabel>
                    <select
                      name="category" value={formData.category} onChange={handleChange} required
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <FieldLabel required>Deadline</FieldLabel>
                    {/* FIX #1: min prevents the calendar from showing past dates */}
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleDeadlineChange}
                      min={TODAY}                        // ← UI-level guard
                      onKeyDown={(e) => e.preventDefault()} // block manual typing of past dates
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-gray-500 transition-colors"
                    />
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
                    {/* Owner row */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <Avatar letter="Y" dark />
                        <div>
                          <p className="text-xs font-semibold text-gray-800">You (Owner)</p>
                          <p className="text-xs text-gray-500">Project creator</p>
                        </div>
                      </div>
                      <RolePill icon={<Shield size={11} className="text-gray-600" />} label="Owner" />
                    </div>

                    {/* Search input */}
                    <div className="relative px-4 py-3 border-b border-gray-100">
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => { setMemberSearch(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search by name or email…"
                        className="w-full px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500"
                      />
                      {showDropdown && memberSearch && filteredUsers.length > 0 && (
                        <div className="absolute left-4 right-4 top-full z-10 bg-white border border-gray-200 shadow-lg max-h-40 overflow-y-auto">
                          {filteredUsers.map((u) => (
                            <button
                              key={u._id} type="button"
                              onClick={() => handleAddMember(u)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                            >
                              <Avatar letter={u.name[0].toUpperCase()} />
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                                <p className="text-xs text-gray-500">{u.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {showDropdown && memberSearch && filteredUsers.length === 0 && (
                        <div className="absolute left-4 right-4 top-full z-10 bg-white border border-gray-200 shadow-lg px-4 py-3 text-xs text-gray-500">
                          No matching users found.
                        </div>
                      )}
                    </div>

                    {/* Added members list */}
                    {members.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        Search and add team members above.
                      </div>
                    ) : (
                      members.map((m) => (
                        <div key={m.userId} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <Avatar letter={m.name[0].toUpperCase()} />
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{m.name}</p>
                              <p className="text-xs text-gray-500">{m.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RoleSelect value={m.role} onChange={(r) => handleRoleChange(m.userId, r)} />
                            <RemoveButton onClick={() => handleRemoveMember(m.userId)} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Tab: Invite by Email */}
                {teamTab === "email" && (
                  <div className="border border-t-0 border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => { setInviteEmail(e.target.value); setInviteFieldErr(""); }}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleQueueInvite())}
                          placeholder="colleague@example.com"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500"
                        />
                        <RoleSelect value={inviteRole} onChange={setInviteRole} />
                        <button type="button" onClick={handleQueueInvite}
                          className="px-4 py-2 text-xs font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                          Add
                        </button>
                      </div>
                      {inviteFieldErr && <p className="text-xs text-red-600 mt-1.5">{inviteFieldErr}</p>}
                    </div>

                    {pendingInvites.length > 0 && (
                      <div className="divide-y divide-gray-100">
                        {pendingInvites.map((invite) => (
                          <div key={invite.email} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar letter={invite.email[0].toUpperCase()} />
                              <p className="text-xs font-medium text-gray-800">{invite.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <RoleSelect value={invite.role} onChange={(r) => handleInviteRoleChange(invite.email, r)} />
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

// ─── Optimistic project builder ───────────────────────────────────────────────
/**
 * Constructs a locally-shaped project object that matches what GET /projects
 * returns, so ProjectSlider can render without waiting for a re-fetch.
 *
 * FIX #3: memberCount is computed from the members array we have in state +1
 * for the owner (current user).  The slider uses `project.memberCount` to
 * display the "N members" chip — this makes it show the correct number
 * immediately after creation.
 */
function buildOptimisticProject(serverProject, localMembers) {
  return {
    ...serverProject,
    // memberCount = owner (1) + explicitly added members
    memberCount: 1 + localMembers.length,
    // Ensure the slider's memberCount check (project.members?.length ?? project.memberCount)
    // also works by providing a stable memberCount field.
    members: undefined, // don't carry the raw array — slider uses memberCount
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
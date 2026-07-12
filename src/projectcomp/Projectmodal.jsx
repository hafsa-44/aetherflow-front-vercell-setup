//this the update version of it // Have a Look at this 
// ─────────────────────────────────────────────────────────────
// src/components/CreateProjectModal.jsx
//
// Changes vs original:
//  • Inline field-level errors (not just a banner)
//  • Backend error messages mapped to the correct field
//  • sessionStorage draft persistence — survives accidental close
//  • "Restore draft" notice when saved state is detected
//  • Description field correctly marked required (matches validation)
//  • All constants imported from src/constants/project.js
//  • Dead code removed
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// src/components/CreateProjectModal.jsx
//
// Changes vs previous version:
//  • Removed member/invite handling entirely. The modal now only
//    collects project info + Solo/Team mode. Members are added
//    afterward from the project's Members panel.
//  • sessionStorage draft persistence — survives accidental close
//  • "Restore draft" notice when saved state is detected
//  • Inline field-level errors + backend error → field mapping
//  • All constants imported from src/constants/project.js
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { X, Briefcase, UserCheck, RotateCcw } from "lucide-react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import {
  CATEGORIES,
  PROJECT_COLORS,
  randomColor,
  mapErrorToField,
} from "../constant/project_constant";

const DRAFT_KEY = "draft-create-project";

const EMPTY_FORM = { name: "", description: "", category: "", deadline: "", color: randomColor() };

// ─────────────────────────────────────────────────────────────
// Props:
//   isOpen          : boolean
//   onClose         : () => void
//   onProjectCreated: (newProject) => void
// ─────────────────────────────────────────────────────────────
function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
  const navigate = useNavigate();

  // ── Mode ─────────────────────────────────────────────────
  const [mode, setMode] = useState("solo"); // "solo" | "team"

  // ── Form fields ──────────────────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ── Field-level errors ───────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState({});
  const setFieldError   = (field, msg) => setFieldErrors(prev => ({ ...prev, [field]: msg }));
  const clearFieldError = (field)      => setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  const clearAllFieldErrors            = ()    => setFieldErrors({});

  // ── Draft persistence ────────────────────────────────────
  const [hasDraft, setHasDraft] = useState(false);

  // Persist formData + mode on every change
  useEffect(() => {
    if (!isOpen) return;
    const { color: _color, ...textFields } = formData;
    const empty = Object.values(textFields).every(v => !v);
    if (empty && mode === "solo") {
      sessionStorage.removeItem(DRAFT_KEY);
    } else {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, mode }));
    }
  }, [formData, mode, isOpen]);

  // Detect saved draft when modal opens
  useEffect(() => {
    if (isOpen) {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      setHasDraft(!!saved);
    }
  }, [isOpen]);

  const restoreDraft = () => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const { formData: f, mode: m } = JSON.parse(saved);
      setFormData(f);
      setMode(m);
    } catch (_) { /* malformed — ignore */ }
    setHasDraft(false);
  };

  const dismissDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  // ── Submit state ─────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false);
  const [globalError, setGlobalError] = useState("");

  // ── Handlers: form fields ────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) clearFieldError(name); // clear on type
  };

  // ── Reset ────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ ...EMPTY_FORM, color: randomColor() });
    setMode("solo");
    setGlobalError(""); setFieldErrors({});
    setHasDraft(false);
    sessionStorage.removeItem(DRAFT_KEY);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // ── Client-side validation ───────────────────────────────
  // Returns true if valid, false + sets errors if not.
  const validateClient = () => {
    const errors = {};
    if (!formData.name.trim())        errors.name        = "Project name is required.";
    if (!formData.category)           errors.category    = "Please select a category.";
    if (!formData.deadline)           errors.deadline    = "Please set a deadline.";
    if (!formData.description.trim()) errors.description = "Please add a brief description.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");
    clearAllFieldErrors();

    if (!validateClient()) return;

    setSubmitting(true);

    try {
      const payload = {
        name:            formData.name.trim(),
        description:     formData.description.trim(),
        category:        formData.category,
        isCollaborative: mode === "team",
        visibility:      "private",
        deadline:        formData.deadline || null,
        color:           formData.color,
      };

      const res        = await api.post("/projects", payload);
      const newProject = res.data;

      if (onProjectCreated) onProjectCreated(newProject);
      resetForm();
      onClose();
      navigate(`/project/${newProject._id}/board`);

    } catch (err) {
      console.error("Create project failed:", err);
      const msg = err.response?.data?.message || "Failed to create project. Please try again.";
      const field = mapErrorToField(msg);
      if (field) {
        setFieldError(field, msg);
      } else {
        setGlobalError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 rounded-xl">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-blue-400 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">New Project</h2>
            <p className="text-xs text-black-500 mt-0.5">Fill in the details below to create your project</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-7 py-6 space-y-6">

            {/* ── Draft restore notice ────────────────────── */}
            {hasDraft && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} className="text-blue-600" />
                  <p className="text-sm text-blue-700 font-medium">You have an unsaved draft</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={dismissDraft} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded transition-colors">Discard</button>
                  <button type="button" onClick={restoreDraft} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors font-medium">Restore</button>
                </div>
              </div>
            )}

            {/* ── Global error banner ─────────────────────── */}
            {globalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <span className="mt-0.5">⚠</span>
                <span>{globalError}</span>
              </div>
            )}

            {/* ── Project Information ─────────────────────── */}
            <section>
              <SectionLabel>Project Information</SectionLabel>
              <div className="space-y-4 mt-3">

                {/* Name */}
                <div>
                  <FieldLabel required>Project Name</FieldLabel>
                  <input
                    type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="e.g. Q3 Marketing Campaign"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${fieldErrors.name ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"}`}
                  />
                  <FieldError message={fieldErrors.name} />
                </div>

                {/* Description */}
                <div>
                  <FieldLabel required>Description</FieldLabel>
                  <textarea
                    name="description" value={formData.description} onChange={handleChange} rows={3}
                    placeholder="Brief overview of the project scope and objectives"
                    className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all resize-none ${fieldErrors.description ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"}`}
                  />
                  <FieldError message={fieldErrors.description} />
                </div>

                {/* Category + Deadline */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Category</FieldLabel>
                    <select
                      name="category" value={formData.category} onChange={handleChange}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${fieldErrors.category ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"}`}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <FieldError message={fieldErrors.category} />
                  </div>
                  <div>
                    <FieldLabel required>Deadline</FieldLabel>
                    <input
                      type="date" name="deadline" value={formData.deadline} onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all ${fieldErrors.deadline ? "border-red-400 focus:ring-red-100" : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"}`}
                    />
                    <FieldError message={fieldErrors.deadline} />
                  </div>
                </div>
                {/* Color */}
                <div>
                  <FieldLabel>Project Color</FieldLabel>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c} type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                        className={`w-7 h-7 rounded-full transition-all border-2 ${formData.color === c ? "border-gray-800 scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color: randomColor() }))}
                      className="ml-1 text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
                    >
                      Random
                    </button>
                  </div>
                </div>

              </div>
            </section>

            {/* ── Project Mode ────────────────────────────── */}
            <section>
              <SectionLabel>Project Mode</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <ModeCard active={mode === "solo"} onClick={() => setMode("solo")}
                  icon={<Briefcase size={14} />} title="Solo Project" description="Only you. No team members." />
                <ModeCard active={mode === "team"} onClick={() => setMode("team")}
                  icon={<UserCheck size={14} />} title="Team Project" description="You can invite members once the project is created." />
              </div>
            </section>
          </div>

          {/* ── Footer ─────────────────────────────────────── */}
          <div className="flex items-center justify-end px-7 py-5 bg-gray-50 border-t border-gray-100 rounded-b-xl">
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} disabled={submitting}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 min-w-[150px] justify-center">
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</>
                  : "Create Project"
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

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

/** Renders inline field error text. Renders nothing when message is falsy. */
function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠ {message}</p>;
}

function ModeCard({ active, onClick, icon, title, description }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-start gap-3 px-4 py-4 border text-left rounded-lg transition-all ${active ? "border-gray-800 bg-gray-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-400"}`}>
      <div className={`mt-0.5 p-1.5 border rounded flex-shrink-0 ${active ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 text-gray-500"}`}>
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

export default CreateProjectModal;

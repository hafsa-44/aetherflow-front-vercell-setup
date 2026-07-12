
import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import api from "../api";
import { CATEGORIES, mapErrorToField } from "../constant/project_constant";

function EditProjectModal({ project, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: project.title || project.name || "",
    description: project.description || "",
    deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    category: project.category || "",
    isCollaborative:
      project.isCollaborative !== undefined
        ? project.isCollaborative
        : true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [saving, setSaving] = useState(false);

  const setFieldError = (field, msg) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  const clearFieldError = (field) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handle = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    clearFieldError(key);
  };

  const validateClient = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Project name is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    setGlobalError("");
    if (!validateClient()) return;

    setSaving(true);
    try {
      const res = await api.put(`/projects/${project._id || project.id}`, {
        name: form.name.trim(),
        description: form.description,
        deadline: form.deadline || null,
        category: form.category,
        isCollaborative: form.isCollaborative,
      });

      const updated = res.data.project ?? res.data;
      onSave(updated);
    } catch (err) {
      console.error("Failed to update project:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to save changes. Please try again.";
      const field = mapErrorToField(msg);
      if (field) setFieldError(field, msg);
      else setGlobalError(msg);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      <div className="relative bg-white w-full max-w-lg shadow-2xl border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Edit Project
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Update your project details
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Global error */}
          {globalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="mt-0.5">⚠</span>
              <span>{globalError}</span>
            </div>
          )}

          {/* Name */}
          <div>
            <FieldLabel required>Project Name</FieldLabel>
            <input
              value={form.name}
              onChange={handle("name")}
              placeholder="Project name"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.name
                  ? "border-red-400 focus:ring-red-100"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
              }`}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          {/* Description */}
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea
              value={form.description}
              onChange={handle("description")}
              rows={3}
              placeholder="Describe your project…"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all resize-none"
            />
          </div>

          {/* Category + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                value={form.category}
                onChange={handle("category")}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all appearance-none cursor-pointer ${
                  fieldErrors.category
                    ? "border-red-400 focus:ring-red-100"
                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
                }`}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.category} />
            </div>

            <div>
              <FieldLabel>Deadline</FieldLabel>
              <input
                type="date"
                value={form.deadline}
                onChange={handle("deadline")}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2.5 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.deadline
                    ? "border-red-400 focus:ring-red-100"
                    : "border-gray-300 focus:border-gray-400 focus:ring-gray-100"
                }`}
              />
              <FieldError message={fieldErrors.deadline} />
            </div>
          </div>

          {/* Collaborative toggle */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Team Project
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {form.isCollaborative
                  ? "Members can be added and invited"
                  : "Only you can access this project"}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  isCollaborative: !f.isCollaborative,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                form.isCollaborative ? "bg-gray-900" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  form.isCollaborative
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div> {/* ✅ FIXED: properly closed Body */}

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
      ⚠ {message}
    </p>
  );
}

export default EditProjectModal;
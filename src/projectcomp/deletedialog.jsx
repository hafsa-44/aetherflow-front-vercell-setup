// ─────────────────────────────────────────────────────────────
// src/components/DeleteDialog.jsx
//
// Extracted from ProjectCardSlider.jsx.
// No changes to logic — purely structural extraction.
// ─────────────────────────────────────────────────────────────

import { AlertTriangle, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Props:
//   project   : project object being deleted
//   onConfirm : () => void
//   onCancel  : () => void
// ─────────────────────────────────────────────────────────────
function DeleteDialog({ project, onConfirm, onCancel }) {
  const name = project.title || project.name || "this project";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center border border-gray-100">

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Project?</h2>
        <p className="text-gray-500 text-sm mb-1">You're about to permanently delete</p>
        <p className="font-semibold text-gray-800 mb-3">"{name}"</p>
        <p className="text-xs text-gray-400 mb-8">
          All tasks inside this project will also be deleted. This cannot be undone.
        </p>

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg text-sm">
            <Trash2 size={15} />
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteDialog;
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, MoreVertical,
  Users, Calendar, Edit, Trash2, Eye, AlertTriangle,
  X, CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "./api";

// ── DELETE CONFIRMATION DIALOG ────────────────────────────────
function DeleteDialog({ project, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp p-8 text-center">

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Project?</h2>
        <p className="text-gray-500 text-sm mb-1">You're about to permanently delete</p>
        <p className="font-semibold text-gray-800 mb-3">
          "{project.title || project.name}"
        </p>
        <p className="text-xs text-gray-400 mb-8">
          All tasks inside this project will also be deleted. This cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Trash2 size={16} />
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EDIT PROJECT MODAL ────────────────────────────────────────
function EditProjectModal({ project, onSave, onCancel }) {
  const CATEGORIES = ["Development", "Design", "Marketing", "Research", "Sales", "Other"];

  const [form, setForm] = useState({
    name: project.title || project.name || "",
    description: project.description || "",
    deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    category: project.category || "",
  });
  const [saving, setSaving] = useState(false);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/projects/${project._id || project.id}`, {
        name: form.name,
        description: form.description,
        deadline: form.deadline || null,
        category: form.category,
      });
      onSave(res.data);
    } catch (err) {
      console.error("Failed to update:", err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slideUp overflow-hidden">

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Edit size={20} className="text-white" />
            <h2 className="text-xl font-bold text-white">Edit Project</h2>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              value={form.name}
              onChange={handle("name")}
              placeholder="Project name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
            <textarea
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
              value={form.description}
              onChange={handle("description")}
              rows={3}
              placeholder="Describe your project..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors bg-white"
                value={form.category}
                onChange={handle("category")}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Deadline</label>
              <input
                type="date"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                value={form.deadline}
                onChange={handle("deadline")}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle size={16} /> Save Changes</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT CARD ──────────────────────────────────────────────
function ProjectCard({ project, cardsPerView, onDelete, onEdit, onView }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const widthMap = {
    1: "calc(100%)",
    2: "calc(50% - 12px)",
    3: "calc(33.333% - 16px)",
  };
  const cardWidth = widthMap[cardsPerView] ?? widthMap[3];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const title       = project.title || project.name || "Untitled";
  const memberCount = project.members?.length ?? project.memberCount ?? 0;
  const deadline    = project.deadline || project.dueDate;
  console.log("PROJECT DEADLINE:", deadline);
  const color       = project.color || "#4F46E5";
  const category    = project.category || "Other";
  const progress    = project.progress ?? (
    project.totalTasks > 0
      ? Math.round((project.completedTasks / project.totalTasks) * 100)
      : 0
  );
  const completedTasks = project.completedTasks ?? 0;
  const totalTasks     = project.totalTasks ?? project.tasks ?? 0;

  return (
    <div className="flex-shrink-0 group" style={{ width: cardWidth, minWidth: cardWidth }}>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full transform hover:-translate-y-2">

        <div className="h-3" style={{ backgroundColor: color }} />

        <div className="p-6">
          {/* Title + three-dot menu */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">
              {title}
            </h3>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(o => !o)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical size={20} className="text-gray-400" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 animate-fadeIn">
                  <button
                    onClick={() => { onView(project); setIsMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Eye size={16} /> View Details
                  </button>
                  <button
                    onClick={() => { onEdit(project); setIsMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  >
                    <Edit size={16} /> Edit Project
                  </button>
                  <div className="border-t border-gray-200 my-2" />
                  <button
                    onClick={() => { onDelete(project); setIsMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                  >
                    <Trash2 size={16} /> Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-black-600  font-semibold  mb-3 line-clamp-2 min-h-[2.5rem]">
            {project.description || "No description added."}
          </p>
         <p className="text-xs font-semibold text-black-500 mb-4 uppercase tracking-wide">
  {project.category || "Other"}
     </p>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-bold" style={{ color }}>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
          </div>

          {/* Team + Due Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Users size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Team</p>
                <p className="text-sm font-semibold text-gray-800">
  {project.isCollaborative
    ? `${memberCount} member${memberCount !== 1 ? "s" : ""}`
    : "You only"}
</p>
                
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Calendar size={16} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                <p className="text-sm font-semibold text-gray-800">
                   {deadline
                ? new Date(deadline.slice(0, 10) + "T00:00").toLocaleDateString("en-GB", {
                year: "numeric",
                 month: "short",
              day: "numeric",
    })
                       : "—"}
   
  
  
                </p>
              </div>
            </div>
          </div>

          {/* Tasks counter */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
            <span className="text-sm text-gray-600">Tasks completed</span>
            <span className="font-semibold text-gray-800">{completedTasks}/{totalTasks}</span>
          </div>

          {/* View Button */}
          <button
            onClick={() => onView(project)}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-md"
            style={{ backgroundColor: color, color: "#fff" }}
          >
            View Project
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN SLIDER ───────────────────────────────────────────────
function ProjectCardSlider({ projects = [], onCreateProject, onProjectUpdate }) {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [localProjects, setLocalProjects] = useState(projects);

  // dialog/modal targets
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // keep in sync when parent re-fetches
  useEffect(() => { setLocalProjects(projects); }, [projects]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxIndex = Math.max(0, localProjects.length - cardsPerView);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [maxIndex, currentIndex]);

  useEffect(() => {
    if (localProjects.length <= cardsPerView) return;
    const t = setInterval(() => {
      setCurrentIndex(p => p < maxIndex ? p + 1 : 0);
    }, 5000);
    return () => clearInterval(t);
  }, [maxIndex, localProjects.length, cardsPerView]);

  const handlePrev = () => {
    if (!isAnimating && currentIndex > 0) {
      setIsAnimating(true);
      setCurrentIndex(p => p - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleNext = () => {
    if (!isAnimating && currentIndex < maxIndex) {
      setIsAnimating(true);
      setCurrentIndex(p => p + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // ── DELETE ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    const id = deleteTarget._id || deleteTarget.id;
    try {
      await api.delete(`/projects/${id}`);
      setLocalProjects(prev => prev.filter(p => (p._id || p.id) !== id));
      setDeleteTarget(null);
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      console.error(err);
      alert("❌ " + (err.response?.data?.message || "Failed to delete project"));
      setDeleteTarget(null);
    }
  };

  // ── EDIT SAVE ─────────────────────────────────────────────
  const handleEditSave = (updated) => {
    setLocalProjects(prev =>
      prev.map(p => (p._id || p.id) === (updated._id || updated.id) ? { ...p, ...updated } : p)
    );
    setEditTarget(null);
    if (onProjectUpdate) onProjectUpdate();
  };

  // ── VIEW → Planning Board ─────────────────────────────────
  const handleView = (project) => {
    //navigate(`/project/${project._id || project.id}`);
    //navigate(`/board/${project._id || project.id}`);
     navigate(`/project/${project._id}/board`); 
};
  

  return (
    <div className="w-full py-8 px-4 md:px-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">My Projects</h1>
          <p className="text-gray-600">
            {localProjects.length} active project{localProjects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>

      {/* Empty state */}
      {localProjects.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium text-gray-500">No projects yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "New Project" to create your first one</p>
        </div>
      )}

      {/* Slider */}
      {localProjects.length > 0 && (
        <div className="relative">
          {localProjects.length > cardsPerView && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-200 ${currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:scale-110 cursor-pointer"}`}
              >
                <ChevronLeft size={24} className="text-blue-600" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-200 ${currentIndex >= maxIndex ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:scale-110 cursor-pointer"}`}
              >
                <ChevronRight size={24} className="text-blue-600" />
              </button>
            </>
          )}

          <div className="overflow-hidden" ref={sliderRef}>
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(calc(-${currentIndex * (100 / cardsPerView)}% - ${currentIndex * (24 / cardsPerView)}px))`,
                gap: "24px",
              }}
            >
              {localProjects.map(project => (
                <ProjectCard
                  key={project._id || project.id}
                  project={project}
                  cardsPerView={cardsPerView}
                  onDelete={(p) => setDeleteTarget(p)}
                  onEdit={(p) => setEditTarget(p)}
                  onView={handleView}
                />
              ))}
            </div>
          </div>

          {/* Dots */}
          {localProjects.length > cardsPerView && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "w-8 bg-blue-600" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {deleteTarget && (
        <DeleteDialog
          project={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {editTarget && (
        <EditProjectModal
          project={editTarget}
          onSave={handleEditSave}
          onCancel={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

export default ProjectCardSlider;


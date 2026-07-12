

//new file 
import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, MoreVertical,
  Users, Calendar, Edit, Trash2, Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api";
import { getAccessToken } from "../api";    
import AvatarStack from "./avator";      // make sure api.js exports this
import EditProjectModal from "./editprojectmodal";
import DeleteDialog     from "./deletedialog";
import MembersPanel from "./MembersPanel";
// ── PROJECT CARD ──────────────────────────────────────────────
function ProjectCard({ project, cardsPerView, onDelete, onEdit, onView, currentUserRole }) {
  const [isMenuOpen,       setIsMenuOpen]       = useState(false);
  const [isMembersPanelOpen, setMembersPanelOpen] = useState(false);
  const menuRef = useRef(null);

  const widthMap = { 1: "calc(100%)", 2: "calc(50% - 12px)", 3: "calc(33.333% - 16px)" };
  const cardWidth = widthMap[cardsPerView] ?? widthMap[3];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTeam      = project.isCollaborative;
  const title       = project.name     || "Untitled";
  const memberCount = project.memberCount ?? 0;
  const deadline    = project.deadline || project.dueDate;
  const color       = project.color    || "#4F46E5";

  // Owner and manager can invite
  const canInvite = ["owner", "manager"].includes(currentUserRole ?? project.role ?? "");

  return (
    <>
      <div className="flex-shrink-0 group" style={{ width: cardWidth, minWidth: cardWidth }}>
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full transform hover:-translate-y-2">

          <div className="h-3" style={{ backgroundColor: color }} />

          <div className="p-6">
            {/* Title + menu */}
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-20">
                    <button onClick={() => { onView(project); setIsMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-sm">
                      <Eye size={15} /> View Details
                    </button>
                    <button onClick={() => { onEdit(project); setIsMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-sm">
                      <Edit size={15} /> Edit Project
                    </button>
                    {/* Members option in menu — only for team projects */}
                    {isTeam && (
                      <button onClick={() => { setMembersPanelOpen(true); setIsMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700 text-sm">
                        <Users size={15} /> Members
                      </button>
                    )}
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { onDelete(project); setIsMenuOpen(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 text-sm">
                      <Trash2 size={15} /> Delete Project
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 font-medium text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
              {project.description || "No description added."}
            </p>
            <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wide">
              {project.category || "Other"}
            </p>

            {/* Member avatars */}
            {project.memberPreviews?.length > 0 && (
              <div className="mb-4">
                <AvatarStack members={project.memberPreviews} totalCount={memberCount} />
              </div>
            )}

            {/* Team + Due Date */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                  <Users size={16} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Team</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {isTeam
                      ? `${memberCount} member${memberCount !== 1 ? "s" : ""}`
                      : "Solo"}
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
                          year: "numeric", month: "short", day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons row */}
            <div className={`grid gap-2 ${isTeam ? "grid-cols-2" : "grid-cols-1"}`}>
              {/* Members button — ONLY for team projects */}
              {isTeam && (
                <button
                  onClick={() => setMembersPanelOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Users size={15} />
                  Members
                </button>
              )}

              {/* View button */}
              <button
                onClick={() => onView(project)}
                className="flex items-center justify-center py-2.5 rounded-xl font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-md text-sm"
                style={{ backgroundColor: color, color: "#fff" }}
              >
                View Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Members slide-in panel */}
      <MembersPanel
        projectId={project._id}
        isOpen={isMembersPanelOpen}
        onClose={() => setMembersPanelOpen(false)}
        canInvite={canInvite}
        isTeam={isTeam}
      />
    </>
  );
}

// ── MAIN SLIDER ───────────────────────────────────────────────
function ProjectCardSlider({ projects = [], onCreateProject, onProjectUpdate }) {
  const navigate  = useNavigate();
  const sliderRef = useRef(null);

  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [isAnimating,    setIsAnimating]    = useState(false);
  const [cardsPerView,   setCardsPerView]   = useState(3);
  const [localProjects,  setLocalProjects]  = useState(projects);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [editTarget,     setEditTarget]     = useState(null);

  // Sync when parent re-fetches
  useEffect(() => { setLocalProjects(projects); }, [projects]);

  // ── Dashboard socket — live updates from collaborators ──────────────────
  useEffect(() => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";
    let socket;
    let cancelled = false;

    (async () => {
      // Wait for auth token — same pattern as useBoardSync
      let token = getAccessToken();
      let attempts = 0;
      while (!token && attempts < 10) {
        await new Promise(r => setTimeout(r, 200));
        token = getAccessToken();
        attempts++;
      }
      if (!token || cancelled) return;

      socket = io(SERVER_URL, {        // root namespace — NOT /board
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: { token },
      });

      // Another user (or the owner) edited the project
      socket.on("project:updated", (updated) => {
        setLocalProjects(prev =>
          prev.map(p => p._id === updated._id ? { ...p, ...updated } : p)
        );
      });

   

      socket.on("connect_error", (err) => {
        console.warn("[dashboard socket]", err.message);
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, []); // runs once — socket lives as long as dashboard is mounted

  // ── Responsive cards per view ────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768)       setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else                               setCardsPerView(3);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxIndex = Math.max(0, localProjects.length - cardsPerView);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [maxIndex, currentIndex]);

  // Auto-play
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

  const handleDeleteConfirm = async () => {
    const id = deleteTarget._id;
    try {
      await api.delete(`/projects/${id}`);
      setLocalProjects(prev => prev.filter(p => p._id !== id));
      setDeleteTarget(null);
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ " + (err.response?.data?.message || "Failed to delete project"));
      setDeleteTarget(null);
    }
  };

  const handleEditSave = (updated) => {
    setLocalProjects(prev =>
      prev.map(p => p._id === updated._id ? { ...p, ...updated } : p)
    );
    setEditTarget(null);
    if (onProjectUpdate) onProjectUpdate();
  };

  const handleView = (project) => {
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
        <button onClick={onCreateProject}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl">
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
              <button onClick={handlePrev} disabled={currentIndex === 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-200 ${currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:scale-110 cursor-pointer"}`}>
                <ChevronLeft size={24} className="text-blue-600" />
              </button>
              <button onClick={handleNext} disabled={currentIndex >= maxIndex}
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center transition-all duration-200 ${currentIndex >= maxIndex ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-50 hover:scale-110 cursor-pointer"}`}>
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
                  key={project._id}
                  project={project}
                  cardsPerView={cardsPerView}
                  onDelete={p => setDeleteTarget(p)}
                  onEdit={p => setEditTarget(p)}
                  onView={handleView}
                   currentUserRole={project.role}  
                />
              ))}
            </div>
          </div>

          {/* Dots */}
          {localProjects.length > cardsPerView && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
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

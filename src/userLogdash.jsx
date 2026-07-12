



///hope so you like it 
// src/pages/UserLogPage.jsx
{/**import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import CreateProjectModal from "./projectcomp/Projectmodal";
import ProjectCardSlider  from "./projectcomp/slider_";
import api                from "./api";
import {randomColor} from "./constant/project_constant";

// ─────────────────────────────────────────────────────────────────────────────
// Main dashboard page — shows stat cards + project slider.
// ─────────────────────────────────────────────────────────────────────────────
function UserLogPage() {
  const { user } = useOutletContext();

  const [projects,        setProjects]        = useState([]);
  const [availableUsers,  setAvailableUsers]  = useState([]);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);

  // Support sidebar "create project" button dispatching a custom event
  useEffect(() => {
    const openModal = () => setIsModalOpen(true);
    window.addEventListener("openProjectModal", openModal);
    return () => window.removeEventListener("openProjectModal", openModal);
  }, []);

  // ── Fetch all workspace users (for member search in create modal) ─────────
  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get("/users");
      const others = Array.isArray(res.data)
        ? res.data.filter((u) => u._id !== user?._id)
        : [];
      setAvailableUsers(others);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setAvailableUsers([]);
    }
  };

  // ── Fetch projects for the logged-in user ─────────────────────────────────
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const res         = await api.get("/projects");
      const projectData = Array.isArray(res.data) ? res.data : [];
      const transformed = projectData.map((p) => ({
  _id:             p._id,
  title:           p.name,
  description:     p.description || "",
  color:           p.color || randomColor(),
  progress:        p.progress || 0,

  memberCount:     p.memberCount ?? 1,
  memberPreviews:  p.memberPreviews || [],

  deadline:        p.deadline || new Date().toISOString(),

  tasks:           Array.isArray(p.tasks) ? p.tasks : [], 
  //Array.isArray(p.tasks) ? p.tasks : [],  

  completedTasks:  p.completedTasks || 0,

  category:        p.category || "Other",
  isCollaborative: p.isCollaborative,
  visibility:      p.visibility,
  role:            p.role,
}));

     /* const transformed = projectData.map((p) => ({
        _id:             p._id,
        title:           p.name,
        description:     p.description || "",
        color:           p.color || randomColor(), 
        progress:        p.progress || 0,
        memberCount:     p.memberCount ?? 1,
        deadline:        p.deadline || new Date().toISOString(),
        tasks:            Array.isArray(p.tasks) ? p.tasks.length : 0,
        completedTasks:  p.completedTasks || 0,
        category:        p.category || "Other",
        isCollaborative: p.isCollaborative,
        visibility:      p.visibility,
        role:            p.role,
      }));

      setProjects(transformed);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchAvailableUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalTasks     = projects.reduce((s, p) => s + (p.tasks || 0), 0);
  const completedTasks = projects.reduce((s, p) => s + (p.completedTasks || 0), 0);


  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#F5F7FA] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error loading projects</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA]">

    // Welcome 
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.name || user?.username || "there"}! 👋
        </h2>
        <p className="text-gray-600">Here's what's happening with your projects today.</p>
      </div>

      // Stats
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton width={120} height={14} className="mb-3" />
              <Skeleton width={60} height={32} />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Active projects" value={projects.length}    color="#4F46E5" bgColor="#EEF2FF" />
            <StatCard title="Total tasks"     value={totalTasks}          color="#059669" bgColor="#ECFDF5" />
            <StatCard title="Completed"       value={completedTasks}      color="#DC2626" bgColor="#FEF2F2" />
          </>
        )}
      </div>

      // Projects 
      //       {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton height={8} className="mb-4" />
              <Skeleton height={20} width="75%" className="mb-2" />
              <Skeleton count={2} className="mb-1" />
              <Skeleton height={8} className="mb-4" />
              <div className="flex justify-between">
                <Skeleton width={80} />
                <Skeleton width={60} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ProjectCardSlider
          projects={projects}
          onCreateProject={() => setIsModalOpen(true)}
          onProjectUpdate={fetchProjects}
        />
      )}

      //Create project modal
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={fetchProjects}
        availableUsers={availableUsers}
      />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export default UserLogPage;**/}
//this file the final rollback if new attemots fails 
{/*import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import CreateProjectModal from "./projectcomp/Projectmodal";
import ProjectCardSlider  from "./projectcomp/slider_";
import api                from "./api";
import { randomColor }    from "./constant/project_constant";

function UserLogPage() {
  const { user } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const openModal = () => setIsModalOpen(true);
    window.addEventListener("openProjectModal", openModal);
    return () => window.removeEventListener("openProjectModal", openModal);
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get("/users");
      const others = Array.isArray(res.data) ? res.data.filter((u) => u._id !== user?._id) : [];
      setAvailableUsers(others);
    } catch (err) {
      console.error(err);
      setAvailableUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/projects");
      const projectData = Array.isArray(res.data) ? res.data : [];
      
      const transformed = projectData.map((p) => {
        const membersList = p.memberPreviews || p.members || [];
        return {
          _id: p._id,
          title: p.name || p.title,
          description: p.description || "",
          color: p.color || randomColor(),
         // progress: p.progress || 0,
          memberPreviews: membersList,
          memberCount: p.memberCount ?? membersList.length ?? 1,
          deadline: p.deadline || new Date().toISOString(),
          //tasks: Array.isArray(p.tasks) ? p.tasks : [],
         // completedTasks: p.completedTasks || 0,
          category: p.category || "Other",
          isCollaborative: p.isCollaborative,
          visibility: p.visibility,
          role: p.role,
        };
      });

      setProjects(transformed);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchAvailableUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

//  const totalTasks = projects.reduce((sum, p) => sum + (p.tasks ? p.tasks.length : 0), 0);
 // const completedTasks = projects.reduce((sum, p) => sum + (p.completedTasks || 0), 0);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#F5F7FA] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error loading projects</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjects} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {user?.name || user?.username || "there"}! 👋</h2>
        <p className="text-gray-600">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton width={120} height={14} className="mb-3" /><Skeleton width={60} height={32} />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Active projects" value={projects.length} color="#4F46E5" bgColor="#EEF2FF" />
            <StatCard title="Total tasks" value={totalTasks} color="#059669" bgColor="#ECFDF5" />
            <StatCard title="Completed" value={completedTasks} color="#DC2626" bgColor="#FEF2F2" />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton height={8} className="mb-4" /><Skeleton height={20} width="75%" className="mb-2" /><Skeleton count={2} />
            </div>
          ))}
        </div>
      ) : (
        <ProjectCardSlider projects={projects} onCreateProject={() => setIsModalOpen(true)} onProjectUpdate={fetchProjects} />
      )}

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={fetchProjects} availableUsers={availableUsers} />
    </div>
  );
}

function StatCard({ title, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export default UserLogPage;*/}



import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import CreateProjectModal from "./projectcomp/Projectmodal";
import ProjectCardSlider  from "./projectcomp/slider_";
import api                from "./api";
import { randomColor }    from "./constant/project_constant";

function UserLogPage() {
  const { user } = useOutletContext();

  const [projects, setProjects] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const openModal = () => setIsModalOpen(true);
    window.addEventListener("openProjectModal", openModal);
    return () => window.removeEventListener("openProjectModal", openModal);
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get("/users");
      const others = Array.isArray(res.data) ? res.data.filter((u) => u._id !== user?._id) : [];
      setAvailableUsers(others);
    } catch (err) {
      console.error(err);
      setAvailableUsers([]);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/projects");
      const projectData = Array.isArray(res.data) ? res.data : [];
      
      const normalized = projectData.map((p) => ({
        _id:             p._id,
        name:            p.name            || "Untitled",
        description:     p.description     || "",
        category:        p.category        || "Other",
        deadline:        p.deadline        || null,
        isCollaborative: p.isCollaborative ?? true,
        visibility:      p.visibility      || "private",
        color:           p.color           || randomColor(),
        memberCount:     p.memberCount     ?? 1,
        memberPreviews:  Array.isArray(p.memberPreviews) ? p.memberPreviews : [],
        createdBy:       p.createdBy,
        createdAt:       p.createdAt,
        updatedAt:       p.updatedAt,
        role:            p.role,
      }));

      setProjects(normalized);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchAvailableUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

//  const totalTasks = projects.reduce((sum, p) => sum + (p.tasks ? p.tasks.length : 0), 0);
 // const completedTasks = projects.reduce((sum, p) => sum + (p.completedTasks || 0), 0);

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#F5F7FA] p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error loading projects</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchProjects} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F5F7FA] p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back, {user?.name || user?.username || "there"}! 👋</h2>
        <p className="text-gray-600">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton width={120} height={14} className="mb-3" /><Skeleton width={60} height={32} />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Active projects" value={projects.length}                                   color="#4F46E5" bgColor="#EEF2FF" />
            <StatCard title="Team projects"   value={projects.filter(p => p.isCollaborative).length}  color="#059669" bgColor="#ECFDF5" />
            <StatCard title="Solo projects"   value={projects.filter(p => !p.isCollaborative).length} color="#DC2626" bgColor="#FEF2F2" />
          </>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6">
              <Skeleton height={8} className="mb-4" /><Skeleton height={20} width="75%" className="mb-2" /><Skeleton count={2} />
            </div>
          ))}
        </div>
      ) : (
        <ProjectCardSlider projects={projects} onCreateProject={() => setIsModalOpen(true)} onProjectUpdate={fetchProjects} />
      )}

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={fetchProjects} availableUsers={availableUsers} />
    </div>
  );
}

function StatCard({ title, value, color, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
        </div>
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export default UserLogPage;

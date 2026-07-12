import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Palette,
  CheckSquare,
LayoutGrid,
  Users,
  Calendar,

  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap,
  ClipboardCheck,
  Mountain,
  Brush,
  Kanban,
} from "lucide-react";
//import { LuBrush } from "react-icons/lu";
//import { MdPalette } from 'react-icons/md';

function Sidebar({ isOpen, onToggle, user, onCreateProject }) {
const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
   // { icon: Kanban, label: "Planning ", path: "/project/:projectId/board" },
   // { icon: Brush, label: "Design", path: "/design" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks" },
    { icon: Users, label: "Team", path: "/team" },
    
   // { icon: BarChart3, label: "Analytics", path: "/analytics" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
      
          fixed top-16 left-0 h-[calc(100vh_-_4rem)] z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isOpen ? "w-64" : "lg:w-20"}
          shadow-2xl
        `}
        style={{ 
          // Correct: JavaScript treats it as a string value for CSS
             backgroundColor: "rgb(0, 17, 46)",
             // backgroundColor: rgb(0, 17, 46),
              //backgroundColor: "#001F46" 
              }}
      >
        {/* Toggle Button (Desktop only) */}
        <button
          onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: "#003375", color: "#E9E4DE" }}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="flex flex-col h-full py-6">
          {/* Create Project Button */}
       { /*  <div className={`px-4 mb-6 ${!isOpen && "lg:px-2"}`}>
            <button
              onClick={onCreateProject}
              className={`
                w-full bg-gradient-to-r from-blue-500 to-blue-600 
                hover:from-blue-600 hover:to-blue-700
                text-white font-semibold rounded-lg shadow-lg
                transition-all duration-200 hover:shadow-xl
                flex items-center justify-center gap-2
                ${isOpen ? "py-3 px-4" : "lg:py-3 lg:px-0"}
              `}
            >
              <Plus size={20} />
              {isOpen && <span>New Project</span>}
            </button>
          </div>*/}
          {/* Navigation Items */}
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200
                    ${active 
                      ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-l-4 border-blue-500" 
                      : "hover:bg-white/10"
                    }
                    ${!isOpen && "lg:justify-center"}
                  `}
                  style={{ color: active ? "#4FC3F7" : "#E9E4DE" }}
                  title={!isOpen ? item.label : ""}
                >
                  <Icon size={20} className={active ? "text-blue-400" : ""} />
                  {isOpen && (
                    <span className={`font-medium ${active ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info (collapsed state) */}
          {!isOpen && user && (
            <div className="hidden lg:flex flex-col items-center px-2 pt-4 border-t border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          )}

          {/* User Info (expanded state) *
          {isOpen && user && (
            <div className="px-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#E9E4DE" }}>
                    {user.name || "User"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#B0B0B0" }}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}*/}
        </div>
      </aside>

      {/* Spacer for content */}
      <div
        className={`
          hidden lg:block
          transition-all duration-300
          ${isOpen ? "w-64" : "w-20"}
        `}
      ></div>
    </>
  );
}

export default Sidebar;


{/*import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import NavBar  from "./Navbar_";
import Sidebar from "./sidebar";
import { useAuth } from "./context/AuthContext"; // ← reads user from context

function Layout() {
  // ── User comes from AuthContext — no more duplicate fetch ──
  // Layout.jsx previously called api.get("/users/me") itself.
  // AuthContext already does this on app mount and keeps it in sync.
  // Layout just reads from it.
  const { currentUser: user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <NavBar user={user} onToggleSidebar={handleToggleSidebar} />

      <div className="flex pt-16">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          user={user}
          onCreateProject={() => {
            const event = new CustomEvent("openProjectModal");
            window.dispatchEvent(event);
          }}
        />

        <main className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 ${isSidebarOpen ? "lg:ml-0" : ""}`}>
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Pass user via Outlet context for any page that needs it via useOutletContext() *
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;*/}
//the last rollback to the code lines 
{/*import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./projectcomp/Navbar_";
import Sidebar from "./sidebar";
import { useAuth } from "./context/AuthContext";
import ProjectModal from "./projectmodel";

function Layout() {
  const { currentUser: user } = useAuth();

  // FIX 1: Initialize state directly to prevent mobile flicker
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  
  // FIX 2: Standard React state for the modal instead of CustomEvents
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <NavBar user={user} onToggleSidebar={handleToggleSidebar} />

      <div className="flex pt-16">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          user={user}
          // Change: Call the state setter directly
          onCreateProject={() => setIsModalOpen(true)}
        />

        <main className={`flex-1 min-h-[calc(100vh-4rem)] transition-all duration-300 ${isSidebarOpen ? "lg:ml-0" : ""}`}>
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {/* Pass state down so children can also open the modal if they need to */}
           {/*
            Outlet context={{ user, openProjectModal: () => setIsModalOpen(true) }} />
          </div>
        </main>
      </div>

    
  );
}

export default Layout;
*/}
//new file
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import NavBar  from "./projectcomp/Navbar_";
import Sidebar from "./sidebar";
import { useAuth } from "./context/authcontext";

function Layout() {
  const { currentUser: user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Sidebar "New Project" fires a CustomEvent.
  // UserLogPage listens for it and opens its own modal.
  // This keeps modal state + availableUsers + fetchProjects all in one place.
  const handleOpenProjectModal = () => {
    window.dispatchEvent(new Event("openProjectModal"));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F7FA" }}>
      <NavBar user={user} onToggleSidebar={handleToggleSidebar} />

      <div className="flex pt-16">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={handleToggleSidebar}
          user={user}
          onCreateProject={handleOpenProjectModal}
        />

        <main
          
  className={`flex-1 min-h-[calc(100vh_-_4rem)] transition-all duration-300 ${
    isSidebarOpen ? "lg:ml-0" : ""
  }`}
>
 
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            <Outlet context={{ user }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
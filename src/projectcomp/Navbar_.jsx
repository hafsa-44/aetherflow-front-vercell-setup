import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, LogOut, Settings, X } from "lucide-react";
import logo from "../assets/logo.svg";

// ADDED: import the two new components
// Search and Bell icons are no longer needed from lucide — each component handles its own
import SearchBar          from "./SearchBar";
import NotificationBell   from "./NotificationBell";

// NavBar receives socket as a prop so NotificationBell can listen for live events.
// In Layout_.jsx (or wherever NavBar is rendered), pass the socket instance:
//   <NavBar user={user} onToggleSidebar={...} socket={socketRef.current} />
function NavBar({ user, onToggleSidebar, socket }) {
  const [isProfileOpen,   setIsProfileOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();

  // REMOVED: searchQuery state — SearchBar manages its own state internally

  // Close profile dropdown when clicking outside — UNCHANGED
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.clear();
    sessionStorage.clear();
    navigate("/signin", { replace: true });
  };

  const getUserAvatar = () => {
    if (user?.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      );
    }
    return (
      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
        {user?.name?.charAt(0).toUpperCase() ||
          user?.email?.charAt(0).toUpperCase() ||
          "U"}
      </div>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 shadow-lg"
      style={{ backgroundColor: "rgb(0, 17, 46)" }}
    >
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 max-w-full">

        {/* Left: Menu Toggle + Logo — UNCHANGED */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="sidebar-toggle-btn p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} style={{ color: "#E9E4DE" }} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img src={logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span
              className="text-base sm:text-xl font-bold hidden sm:block whitespace-nowrap"
              style={{ color: "#E9E4DE" }}
            >
              Aether Flow
            </span>
          </Link>
        </div>

        {/* Center: Nav Links (Desktop) — UNCHANGED */}
        <div className="hidden md:flex flex-shrink-0">
          <Link to="/dashboard"
            className="px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium whitespace-nowrap text-sm lg:text-base"
            style={{ color: "#E9E4DE" }}>
            Home
          </Link>
       { /*  <Link to="/plandash"
            className="px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium whitespace-nowrap text-sm lg:text-base"
            style={{ color: "#E9E4DE" }}>
            Planning
          </Link>*/}
          <Link to="/projects"
            className="px-3 lg:px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium whitespace-nowrap text-sm lg:text-base"
            style={{ color: "#E9E4DE" }}>
            Projects
          </Link>
        </div>

        {/* Right: Search + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* CHANGED: replaced hardcoded search input + mobile button with SearchBar.
              SearchBar handles desktop input, results dropdown, mobile icon,
              debounce, and navigation internally. Nothing else needed here. */}
          <SearchBar />

          {/* CHANGED: replaced hardcoded bell button with NotificationBell.
              Works on both desktop and mobile — it's always visible (no hidden sm:block).
              Passes socket so the bell updates live when notification:new fires. */}
          <NotificationBell socket={socket} />

          {/* Mobile Menu Toggle — UNCHANGED */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Menu"
          >
            {isMobileMenuOpen
              ? <X    size={20} style={{ color: "#E9E4DE" }} />
              : <Menu size={20} style={{ color: "#E9E4DE" }} />
            }
          </button>

          {/* Profile Dropdown — UNCHANGED */}
          {user && (
            <div className="relative flex-shrink-0 isolate" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9">{getUserAvatar()}</div>
              </button>

              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
                  style={{ backgroundColor: "#002855", zIndex: 9999 }}
                >
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12">{getUserAvatar()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: "#E9E4DE" }}>
                          {user.name || "User"}
                        </p>
                        <p className="text-sm truncate" style={{ color: "#B0B0B0" }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                   {/* <Link to="/profile"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                      style={{ color: "#E9E4DE" }}
                      onClick={() => setIsProfileOpen(false)}>
                      <User size={18} />
                      <span>View Profile</span>
                    </Link>
*/}
                    {/*<Link to="/settings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                      style={{ color: "#E9E4DE" }}
                      onClick={() => setIsProfileOpen(false)}>
                      <Settings size={18} />
                      <span>Settings</span>
                    </Link>
*/}
                   {/* <div className="border-t border-white/10 my-2" />*/}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-9 py-3 hover:bg-red-500/20 transition-colors w-full text-left text-red-400"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Menu — search now uses SearchBar, links unchanged */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#002855]">
          <div className="px-4 py-3 space-y-2">
            <Link to="/dashboard"
              className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
              style={{ color: "#E9E4DE" }}
              onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/plandash"
              className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
              style={{ color: "#E9E4DE" }}
              onClick={() => setIsMobileMenuOpen(false)}>
              Planning
            </Link>
            <Link to="/projects"
              className="block px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
              style={{ color: "#E9E4DE" }}
              onClick={() => setIsMobileMenuOpen(false)}>
              Projects
            </Link>

            {/* CHANGED: mobile search now uses SearchBar component.
                It renders its own mobile-friendly input inside the menu. */}
            <div className="pt-2">
              <SearchBar mobileMenu />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </nav>
  );
}

export default NavBar;
{/*!--App.jsx Content holds all the routes for the applications---!>*/}
/*import { useState } from "react";
import { Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SignUP from "./authen/signUp";
import SignIN from "./authen/signin";
import UserLogPage from "./userLogdash";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import PlanningScreen from "./projectcomp/plandash";
import ProtectedRoute from "./authen/protectroute";
import Layout from "./Layout_";
import Board from "./board/planboard/src/board";
import InvitePage from "./projectcomp/invitation";
import LoginSuccess from "./authen/googleAuth";
import Profile from "./projectcomp/profile";
import DesignPhase from "./board/designboard/designcomp/DesignPhase";
import Development from "./board/devboard/src/dev";
 */
// ── Root redirect: waits for auth state before deciding where to send user ──
/*function RootRedirect() {
  const { currentUser, isAuthReady } = useAuth();
 
  // Don't redirect until we know whether the user is logged in.
  // This prevents the flicker to /signUp on hard refresh.
  if (!isAuthReady) return null;
 
  return currentUser
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/signUp" replace />;
}*/
 

 
 
// App.jsx
// CHANGE: removed standalone /design route.
// DesignPhase is now rendered inside board.tsx when phase === "design".
// /project/:projectId/board is the single entry point for ALL three phases.

import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignUP         from "./authen/signUp";
import SignIN         from "./authen/signin";
import UserLogPage    from "./userLogdash";
import { AuthProvider } from "./context/authcontext";
import PlanningScreen from "./projectcomp/plandash";
import ProtectedRoute from "./authen/protectroute";
import Layout         from "./Layout_";
import Board          from "./board/planboard/src/board";   // ← handles ALL phases
import InvitePage     from "./projectcomp/invitation";
import LoginSuccess   from "./authen/googleAuth";
import Profile        from "./projectcomp/profile";
// Development board — uncomment when ready:
// import Development from "./board/devboard/src/dev";

function App() {
  return (
    <AuthProvider>
       <Toaster position="top-right" toastOptions={{ duration: 4000 }} />  {/* ADD THIS  For Internet Dropout */}
      <Routes>
        {/* Public */}
        <Route path="/signUp"         element={<SignUP />} />
        <Route path="/signin"         element={<SignIN />} />
        <Route path="/login-success"  element={<LoginSuccess />} />
        <Route path="/invite/:token"  element={<InvitePage />} />

        <Route element={<ProtectedRoute />}>

          {/* ── Full-screen board — ONE route for planning + design + development ── */}
          <Route path="/project/:projectId/board" element={<Board />} />

          {/* ── Routes with sidebar/navbar layout ── */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<UserLogPage />} />
            <Route path="/plandash"  element={<PlanningScreen />} />
            <Route path="/profile"   element={<Profile />} />
            <Route path="/"          element={<Navigate to="/dashboard" replace />} />
          </Route>

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authcontext";
function ProtectedRoute() {

 const { currentUser, isAuthReady } = useAuth();


  if (!isAuthReady) return <div>Loading...</div>; 
 
  return currentUser ? <Outlet /> : <Navigate to="/signin" replace />;
 
}




export default ProtectedRoute;
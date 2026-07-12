{/*import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext";  
import api from "./api";
const LoginSuccess = () => {
const navigate = useNavigate();
const { login }     = useAuth(); 
const [searchParams] = useSearchParams();

useEffect(() => {
    const handleLogin = async () => {  // ← make it async
      const token = searchParams.get("accessToken");

    if (token) {
        // login() saves to localStorage AND fetches currentUser into context
        await login(token);   // ← REPLACE the old localStorage + api.get("auth/me")
        
        // If user came from an invite link, redirect back there
        // Backend sends: /login-success?token=xxx  OR  /invite/:t?token=xxx
        // The invite path is handled by checking sessionStorage
        const pendingInvite = sessionStorage.getItem("pendingInviteToken");
        if (pendingInvite) {
          navigate(`/invite/${pendingInvite}`);
          sessionStorage.removeItem("pendingInviteToken"); 
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/signin");
      }
    };

    handleLogin();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex items-center justify-center h-screen font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto" />
        <p className="mt-4 text-gray-600">Syncing with Aetherflow...</p>
      </div>
    </div>
  );
};

export default LoginSuccess;

if (token) {
      // This makes the Google login "permanent" in the browser
      localStorage.setItem("token", token);
      const res = await api.get("auth/me"); // adjust endpoint if different
      localStorage.setItem("user", JSON.stringify(res.data));

      navigate("/dashboard"); // Or wherever you want them to go
    } else {
      navigate("/signin");
    }
  }; handleLogin();
} ,[searchParams, navigate]);

  return (
    <div className="flex items-center justify-center h-screen font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Syncing with Aetherflow...</p>
      </div>
    </div>
  );
};

export default LoginSuccess;*/}
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginSuccess = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleLogin = async () => {
      const token = searchParams.get("accessToken");

      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      try {
        // login() sets the token AND awaits fetchUser() before returning.
        // Context is fully populated by the time we call navigate().
        await login(token);

        const pendingInvite = sessionStorage.getItem("pendingInviteToken");
        if (pendingInvite) {
          sessionStorage.removeItem("pendingInviteToken");
          navigate(`/invite/${pendingInvite}`, { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // login() failed (fetchUser 401, network error, etc.)
        navigate("/signin", { replace: true });
      }
    };

    handleLogin();
  }, [searchParams, navigate, login]);

  return (
    <div className="flex items-center justify-center h-screen font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto" />
        <p className="mt-4 text-gray-600">Syncing with Aetherflow...</p>
      </div>
    </div>
  );
};

export default LoginSuccess;
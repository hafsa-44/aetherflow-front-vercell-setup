
{/*import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
//const [isAuthReady, setIsAuthReady] = useState(false);
import axios from "axios";
import api, { setAccessToken } from "../api";

// ── Types ─────────────────────────────────────────────────────────────────
export interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  country?: string;
  profilePicture?: string | null;
  googleId?: string | null;
}

export interface Session {
  _id: string;
  userAgent: string;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  isAuthReady: boolean; 
  sessions: Session[];
  
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ── Fetch /users/me (access token is attached by api.ts interceptor) ───
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/users/me");
      setCurrentUser(res.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setCurrentUser(null);
        setAccessToken(null);
      } else {
        console.error("fetchUser error:", err);
      }
    }
  }, []);

  // ── App load: silently restore session via refresh cookie ──────────────
  // This runs ONCE on every page load/refresh.
  // If the user has a valid 7-day refresh cookie, they stay logged in.
  // If not, they see the login page — no daily logout.
  //const [isAuthReady, setIsAuthReady] = useState(false);
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        if (data?.accessToken) {
          // 2. IMPORTANT: Update the header DIRECTLY before the next call.
          // This ensures fetchUser() doesn't fire with an empty header.
          //setAccessToken(data.accessToken);
           setAccessToken(data.accessToken);
        await fetchUser();
      }  
    }  catch(err) {
        // No valid cookie → not logged in. This is normal, not an error.
        setCurrentUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
        setIsAuthReady(true);  //new addition 
      }
    };

    init();
  }, [fetchUser]);

  // ── LOGIN ─────────────────────────────────────────────────────────────
  // Call this after signin, signup, or Google OAuth with the accessToken
  // returned from the server. The refresh cookie is set automatically
  // by the server response — nothing to do for it on the frontend.
  const login = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      await fetchUser();
    },
    [fetchUser]
  );

  // ── LOGOUT (this device only) ─────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setSessions([]);
    }
  }, []);

  // ── LOGOUT ALL devices ────────────────────────────────────────────────
  const logoutAll = useCallback(async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.error("Logout-all failed:", err);
    } finally {
      setAccessToken(null);
      setCurrentUser(null);
      setSessions([]);
    }
  }, []);

  // ── FETCH SESSIONS (for device management UI) ─────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data.sessions);
    } catch (err) {
      console.error("fetchSessions error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthReady,
        sessions,
        login,
        logout,
        logoutAll,
        fetchSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
//this new updated code its well  strcutured and well commented and has error free 
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import api, { setAccessToken } from "../api";

// ── Types ──────────────────────────────────────────────────────────────────
export interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  country?: string;
  profilePicture?: string | null;
  googleId?: string | null;
}

export interface Session {
  _id: string;
  userAgent: string;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  // Single flag: false during initial restore, true once we know auth state.
  // ProtectedRoute and RootRedirect must wait for this before making decisions.
  isAuthReady: boolean;
  sessions: Session[];
  login: (accessToken: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

// ── Context ────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  // false = still checking, true = we know the answer (logged in or not)
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Ref so the 401 interceptor can always call the latest logout without
  // capturing a stale closure.
  const logoutRef = useRef<() => void>(() => {});

  // ── Shared: fetch /users/me and populate context ──────────────────────
  // Returns the user so callers can await it and navigate immediately after.
  const fetchUser = useCallback(async (): Promise<CurrentUser> => {
    const res = await api.get("/users/me");
    setCurrentUser(res.data);
    return res.data;
  }, []);

  // ── Shared: clear everything without touching the server ──────────────
  const clearSession = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(null);
    setSessions([]);
  }, []);

  // ── 401 interceptor: handles token expiry mid-session ─────────────────
  // Runs once on mount. Tries a silent refresh on any 401; if that also
  // fails, clears the session so the router redirects to /signin cleanly.
  {/*useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;

        // Only handle 401s that aren't themselves from /auth/refresh or /auth/logout
        // and haven't already been retried (prevents infinite loops).
        const isAuthEndpoint =
          original?.url?.includes("/auth/refresh") ||
          original?.url?.includes("/auth/logout");

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401 &&
          !original._retried &&
          !isAuthEndpoint
        ) {
          original._retried = true;
          try {
            const { data } = await api.post("/auth/refresh");
            if (data?.accessToken) {
              setAccessToken(data.accessToken);
              // Retry the original request with the new token
              return api(original);
            }
          } catch {
            // Refresh failed — session is truly over
            logoutRef.current();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, []);

  // ── On mount: restore session from refresh cookie ─────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.post("/auth/refresh");
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          await fetchUser();
        }
        // If no accessToken in response: server said no valid cookie.
        // currentUser stays null — user is logged out. That's fine.
      } catch {
        // No valid refresh cookie, or server error.
        // Either way: not logged in. Don't touch anything else.
        clearSession();
      } finally {
        // Always mark ready so ProtectedRoute stops blocking.
        setIsAuthReady(true);
      }
    };

    init();
  }, [fetchUser, clearSession]);

  // Keep logoutRef current so the interceptor closure always has the
  // latest version, even after re-renders.
  useEffect(() => {
    logoutRef.current = () => {
      clearSession();
      setIsAuthReady(true);
    };
  }, [clearSession]);

  // ── LOGIN ─────────────────────────────────────────────────────────────
  // Call with the accessToken from your backend after any successful auth.
  // Returns the user object — callers can await login() then navigate()
  // immediately, with no setTimeout needed.
  const login = useCallback(
    async (accessToken: string): Promise<CurrentUser> => {
      setAccessToken(accessToken);
      const user = await fetchUser();
      return user;
    },
    [fetchUser]
  );

  // ── LOGOUT (this device) ──────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // ── LOGOUT ALL devices ────────────────────────────────────────────────
  const logoutAll = useCallback(async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.error("Logout-all failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  // ── FETCH SESSIONS ────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data.sessions);
    } catch (err) {
      console.error("fetchSessions error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthReady,
        sessions,
        login,
        logout,
        logoutAll,
        fetchSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}*/}
///the new authcontext.tsx file 
{/*import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import api, { setAccessToken } from "../api";

export interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  country?: string;
  profilePicture?: string | null;
  googleId?: string | null;
}

export interface Session {
  _id: string;
  userAgent: string;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthReady: boolean;
  sessions: Session[];
  login: (accessToken: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ── Prevents React StrictMode from calling refresh twice ─────────────
  const refreshCalledRef = useRef(false);

  const fetchUser = useCallback(async (): Promise<CurrentUser> => {
    const res = await api.get("/users/me");
    setCurrentUser(res.data);
    return res.data;
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(null);
    setSessions([]);
  }, []);

  // ── Listen for forced logout from api.ts interceptor ─────────────────
  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setIsAuthReady(true);
      window.location.href = "/signin";
    };
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:sessionExpired", handleSessionExpired);
    };
  }, [clearSession]);

  // ── On mount: restore session from refresh cookie ─────────────────────
  useEffect(() => {
    const init = async () => {
      // ── Block StrictMode double-invoke ────────────────────────────────
      if (refreshCalledRef.current) return;
      refreshCalledRef.current = true;

      try {
        const { data } = await api.post("/auth/refresh");
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          await fetchUser();
        }
      } catch {
        clearSession();
      } finally {
        setIsAuthReady(true);
      }
    };

    init();
  }, [fetchUser, clearSession]);

  const login = useCallback(
    async (accessToken: string): Promise<CurrentUser> => {
      setAccessToken(accessToken);
      const user = await fetchUser();
      return user;
    },
    [fetchUser]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.error("Logout-all failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data.sessions);
    } catch (err) {
      console.error("fetchSessions error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthReady,
        sessions,
        login,
        logout,
        logoutAll,
        fetchSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}*/}
//new file 
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
// ── CHANGED: Imported authApi ──
import api, { authApi, setAccessToken } from "../api"; 

export interface CurrentUser {
  _id: string;
  name: string;
  email: string;
  country?: string;
  profilePicture?: string | null;
  googleId?: string | null;
}

export interface Session {
  _id: string;
  userAgent: string;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthReady: boolean;
  sessions: Session[];
  login: (accessToken: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  fetchSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshCalledRef = useRef(false);

  const fetchUser = useCallback(async (): Promise<CurrentUser> => {
    const res = await api.get("/users/me");
    setCurrentUser(res.data);
    return res.data;
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setCurrentUser(null);
    setSessions([]);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      setIsAuthReady(true);
      window.location.href = "/signin";
    };
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:sessionExpired", handleSessionExpired);
    };
  }, [clearSession]);

  // On mount: restore session from refresh cookie
  // On mount: restore session from refresh cookie
  useEffect(() => {
    const init = async () => {
      if (refreshCalledRef.current) return;
      refreshCalledRef.current = true;

      try {
        // Use authApi to run initial handshake cleanly
        const { data } = await authApi.post("/auth/refresh");
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          
          // ── FIX: Isolate fetchUser so network drops don't wipe your session data ──
          try {
            await fetchUser();
          } catch (fetchError: any) {
            console.warn("Could not load user profile details due to internet dropout.");
            return; // Exit safely. Do NOT run clearSession().
          }
        }
      } catch (err: any) {
        // Only drop session data if the server explicitly rejected the tokens (401)
        if (err.response && err.response.status === 401) {
          clearSession();
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    init();
  }, [fetchUser, clearSession]);
 /* useEffect(() => {
    const init = async () => {
      if (refreshCalledRef.current) return;
      refreshCalledRef.current = true;

      try {
        // ── CHANGED: Uses authApi here to initialize cleanly ──
        const { data } = await authApi.post("/auth/refresh");
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          await fetchUser();
        }
      } catch (err: any) {
        // ── CHANGED: Only wipe the session on explicit auth rejections ──
        if (err.response && err.response.status === 401) {
          clearSession();
        }
        // If it's a physical network disconnect (!err.response), we do nothing.
        // Your current state remains active so you stay logged in.
      } finally {
        setIsAuthReady(true);
      }
    };

    init();
  }, [fetchUser, clearSession]);*/

  const login = useCallback(
    async (accessToken: string): Promise<CurrentUser> => {
      setAccessToken(accessToken);
      const user = await fetchUser();
      return user;
    },
    [fetchUser]
  );

  const logout = useCallback(async () => {
    try {
      // ── CHANGED: Uses authApi for logout ──
      await authApi.post("/auth/logout"); 
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const logoutAll = useCallback(async () => {
    try {
      await api.post("/auth/logout-all");
    } catch (err) {
      console.error("Logout-all failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data.sessions);
    } catch (err) {
      console.error("fetchSessions error:", err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthReady,
        sessions,
        login,
        logout,
        logoutAll,
        fetchSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}


/*import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getAccessToken = () => _accessToken;

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshDone = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const onRefreshFailed = () => {
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");
      const newToken: string = data.accessToken;

      setAccessToken(newToken);
      onRefreshDone(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onRefreshFailed();
      // ── Notify AuthContext cleanly instead of hard redirecting ──
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;*/
//old logic that handles internet  connectivity issues by dispatching a custom event "network:offline" when a request fails due to network problems, and "network:online" when the connection is restored.
/*import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

// ── Request interceptor — attach token (UNCHANGED) ────────────────────────
api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// ── Token refresh queue (UNCHANGED) ──────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};
const onRefreshDone = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};
const onRefreshFailed = () => { refreshSubscribers = []; };

// ── Response interceptor — ADDED dropout + 500 handling ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── ADDED: Case 1 — No response at all = internet is down ────────────
    // The request never reached the server. Token is still valid.
    // Show a toast, do NOT touch the token, do NOT redirect.
    if (!error.response) {
      toast.error("Connection lost. Please check your internet.", {
        id:       "net-err",   // prevents duplicate toasts on repeated failures
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // ── ADDED: Case 2 — Server/DB crashed (500-599) ───────────────────────
    // Token is still valid — this is a server-side problem.
    // Show a toast, keep the user logged in, do NOT redirect.
    if (error.response.status >= 500) {
      toast.error("Server unavailable. Please try again shortly.", {
        id:       "server-err",
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // ── UNCHANGED: Case 3 — 401 handling with token refresh ──────────────
    // Only now do we treat it as an auth problem.
    if (
      error.response?.status !== 401 ||
      originalRequest._retried   ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await api.post("/auth/refresh");
      const newToken: string = data.accessToken;
      setAccessToken(newToken);
      onRefreshDone(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      setAccessToken(null);
      onRefreshFailed();
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;*/
 { /* New logic for handling internet connectivity issues */}
{/*import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// ── ADDED: Clean instance specifically for authentication (prevents loops) ──
export const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Main instance for regular data fetching
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

// Request Interceptor
api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};
const onRefreshDone = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};
const onRefreshFailed = () => { refreshSubscribers = []; };

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Case 1: Physical Internet Disconnect
    if (!error.response) {
      toast.error("Connection lost. Please check your internet.", {
        id: "net-err",
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // Case 2: Backend Server Crash
    if (error.response.status >= 500) {
      toast.error("Server unavailable. Please try again shortly.", {
        id: "server-err",
        duration: 4000,
      });
      return Promise.reject(error);
    }

    // Case 3: Normal Non-401 Errors
    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      // ── CHANGED: Using authApi here so it bypasses this interceptor ──
      const { data } = await authApi.post("/auth/refresh");
      const newToken: string = data.accessToken;
      
      setAccessToken(newToken);
      onRefreshDone(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      onRefreshFailed();

      // ── CHANGED: If internet is down or server crashed, DO NOT log out ──
      if (!refreshError.response || refreshError.response.status >= 500) {
        return Promise.reject(refreshError);
      }

      // Only kick out if backend explicitly returns a bad credential status (401/403)
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;*/}
//this new update version
{ /* New logic for handling internet connectivity issues */}
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

api.interceptors.request.use((config) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

let isRefreshing = false;

// CHANGED: each queued request now stores BOTH resolve and reject,
// so a failed refresh can actually settle every waiting request
// instead of leaving them hanging forever.
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (err: any) => void
) => {
  refreshSubscribers.push({ resolve, reject });
};

const onRefreshDone = (newToken: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(newToken));
  refreshSubscribers = [];
};

// CHANGED: now actually rejects every queued subscriber instead of
// silently clearing the array — this is the bug fix.
const onRefreshFailed = (err: any) => {
  refreshSubscribers.forEach(({ reject }) => reject(err));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      toast.error("Connection lost. Please check your internet.", {
        id: "net-err",
        duration: 4000,
      });
      return Promise.reject(error);
    }

    if (error.response.status >= 500) {
      toast.error("Server unavailable. Please try again shortly.", {
        id: "server-err",
        duration: 4000,
      });
      return Promise.reject(error);
    }

    if (
      error.response?.status !== 401 ||
      originalRequest._retried ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    if (isRefreshing) {
      // CHANGED: now passes both resolve and reject through
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          },
          (err) => reject(err)
        );
      });
    }

    isRefreshing = true;

    try {
      const { data } = await authApi.post("/auth/refresh");
      const newToken: string = data.accessToken;

      setAccessToken(newToken);
      onRefreshDone(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      // CHANGED: pass the error through so queued requests reject with it
      onRefreshFailed(refreshError);

      if (!refreshError.response || refreshError.response.status >= 500) {
        return Promise.reject(refreshError);
      }

      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
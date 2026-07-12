
{ /* New logic for handling internet connectivity issues */ }
import axios from "axios";
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

export default api;
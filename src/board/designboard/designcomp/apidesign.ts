// src/api.ts
/*import axios from 'axios';

// Use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
     baseURL: API_BASE_URL,
     headers: {
          'Content-Type': 'application/json',
     },
     timeout: 30000, // 30 seconds for AI requests
});

// Request interceptor to add auth token if needed
api.interceptors.request.use(
     (config) => {
          const token = localStorage.getItem('authToken');
          if (token) {
               config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
     },
     (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
     (response) => response,
     (error) => {
          console.error('API Error:', error.response?.data || error.message);
          return Promise.reject(error);
     }
);

// --- Project endpoints (adjust to match your backend) ---
export const projectApi = {
     // Get planning context for a project
     getContext: (projectId: string) => api.get(`/aiContext/${projectId}`),

     // Save project design data
     saveDesign: (projectId: string, designData: any) =>
          api.post(`/projects/${projectId}/design`, designData),

     // Load project design
     loadDesign: (projectId: string) => api.get(`/projects/${projectId}/design`),
};

// --- AI endpoints (for the AI features we're adding) ---
export const aiApi = {
     // Chat with AI assistant (existing)
     chat: (data: { messages: any[]; phase: string; projectContext?: any; extras?: any }) =>
          api.post('/ai/chat', data),

     // Generate layout from text prompt
     generateLayout: (data: { prompt: string; device: 'mobile' | 'web' }) =>
          api.post('/ai/generate', data),

     // Modify existing element
     modifyElement: (data: { element: any; instruction: string }) =>
          api.post('/ai/modify', data),

     // Generate image from description
     generateImage: (data: { prompt: string }) =>
          api.post('/ai/generate-image', data),
};

// --- User/auth endpoints (if you have them) ---
export const authApi = {
     login: (email: string, password: string) => api.post('/auth/login', { email, password }),
     register: (email: string, password: string, name: string) =>
          api.post('/auth/register', { email, password, name }),
     logout: () => api.post('/auth/logout'),
     getProfile: () => api.get('/auth/profile'),
};

// Default export for backward compatibility
export default api;*/
// src/api.ts
import axios from 'axios';
import { getAccessToken } from '../../../api'; // same token source the rest of the app uses

// Use environment variable or fallback to localhost
// API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
     baseURL: API_BASE_URL,
     headers: {
          'Content-Type': 'application/json',
     },
     timeout: 30000, // 30 seconds for AI requests
});

// Request interceptor to add auth token if needed
api.interceptors.request.use(
     (config) => {
          const token = getAccessToken();
          if (token) {
               config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
     },
     (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
     (response) => response,
     (error) => {
          console.error('API Error:', error.response?.data || error.message);
          return Promise.reject(error);
     }
);

// --- Project endpoints (adjust to match your backend) ---
export const projectApi = {
     // Get planning context for a project
     getContext: (projectId: string) => api.get(`/aiContext/${projectId}`),

     // Save project design data
     saveDesign: (projectId: string, designData: any) =>
          api.post(`/projects/${projectId}/design`, designData),

     // Load project design
     loadDesign: (projectId: string) => api.get(`/projects/${projectId}/design`),
};

// --- AI endpoints (for the AI features we're adding) ---
export const aiApi = {
     // Chat with AI assistant (existing)
     chat: (data: { messages: any[]; phase: string; projectContext?: any; extras?: any }) =>
          api.post('/ai/chat', data),

     // Generate layout from text prompt
     generateLayout: (data: { prompt: string; device: 'mobile' | 'web' }) =>
          api.post('/ai/generate', data),

     // Modify existing element
     modifyElement: (data: { element: any; instruction: string }) =>
          api.post('/ai/modify', data),

     // Generate image from description
     generateImage: (data: { prompt: string }) =>
          api.post('/ai/generate-image', data),
};

// --- User/auth endpoints (if you have them) ---
export const authApi = {
     login: (email: string, password: string) => api.post('/auth/login', { email, password }),
     register: (email: string, password: string, name: string) =>
          api.post('/auth/register', { email, password, name }),
     logout: () => api.post('/auth/logout'),
     getProfile: () => api.get('/auth/profile'),
};

// Default export for backward compatibility
export default api;
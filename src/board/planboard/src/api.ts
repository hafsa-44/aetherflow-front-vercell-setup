// src/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const api = axios.create({
     baseURL: API_BASE_URL,
     headers: { 'Content-Type': 'application/json' },
     timeout: 30000,
});

api.interceptors.request.use(
     (config) => {
          const token = localStorage.getItem('authToken');
          if (token) config.headers.Authorization = `Bearer ${token}`;
          return config;
     },
     (error) => Promise.reject(error)
);

api.interceptors.response.use(
     (response) => response,
     (error) => {
          console.error('API Error:', error.response?.data || error.message);
          return Promise.reject(error);
     }
);

// --- Existing API objects (RESTORED) ---
export const projectApi = {
     getContext: (projectId: string) => api.get(`/aiContext/${projectId}`),
     saveDesign: (projectId: string, designData: any) => api.post(`/projects/${projectId}/design`, designData),
     loadDesign: (projectId: string) => api.get(`/projects/${projectId}/design`),
};

export const aiApi = {
     // ✅ This is what your AI Panel needs
     chat: (data: { messages: any[]; phase: string; projectContext?: any; extras?: any }) =>
          api.post('/ai/chat', data),
     generateLayout: (data: { prompt: string; device: 'mobile' | 'web' }) => api.post('/ai/generate', data),
     modifyElement: (data: { element: any; instruction: string }) => api.post('/ai/modify', data),
     generateImage: (data: { prompt: string }) => api.post('/ai/generate-image', data),
};

export const authApi = {
     login: (email: string, password: string) => api.post('/auth/login', { email, password }),
     register: (email: string, password: string, name: string) => api.post('/auth/register', { email, password, name }),
     logout: () => api.post('/auth/logout'),
     getProfile: () => api.get('/auth/profile'),
};

// --- Your direct OpenRouter function (keep it, but not used by AI Panel) ---
export async function directAIChat(
     messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
     onStream?: (partial: string) => void,
     signal?: AbortSignal
): Promise<string> {
     const API_URL = import.meta.env.VITE_AI_ROUTER_URL || 'https://openrouter.ai/api/v1';
     const API_KEY = import.meta.env.VITE_AI_ROUTER_KEY;
     // const MODEL = 'mistralai/mistral-7b-instruct:free';
     const MODEL = 'mistralai/mistral-7b-instruct:free';
     // const MODEL = import.meta.env.VITE_AI_MODEL || 'mistralai/mistral-7b-instruct:free';
     // const MODEL = (import.meta.env.VITE_AI_MODEL as string) || " mistralai/mistral-7b-instruct:free";
     if (!API_KEY) throw new Error('Missing VITE_AI_ROUTER_KEY – AI features disabled');
     const response = await fetch(`${API_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: MODEL, messages, stream: !!onStream, temperature: 0.2 }),
          signal,
     });
     if (!response.ok) throw new Error(`AI API error (${response.status}): ${await response.text()}`);
     if (!onStream) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content ?? 'No response.';
     }
     const reader = response.body!.getReader();
     const decoder = new TextDecoder();
     let full = '';
     while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
               const trimmed = line.trim();
               if (!trimmed.startsWith('data: ')) continue;
               const jsonStr = trimmed.slice(6);
               if (jsonStr === '[DONE]') continue;
               try {
                    const parsed = JSON.parse(jsonStr);
                    const delta = parsed.choices?.[0]?.delta?.content ?? '';
                    if (delta) { full += delta; onStream(full); }
               } catch { /* ignore */ }
          }
     }
     return full;
}

export default api;
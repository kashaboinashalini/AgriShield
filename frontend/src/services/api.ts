import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(e);
  }
);

// Extract a friendly error message from the backend's { success, message } shape
export const errMsg = (e: any, fallback = 'Something went wrong. Please try again.'): string =>
  e?.response?.data?.message || e?.response?.data?.error || e?.message || fallback;

export const uploadImage = (url: string, file: File, extra: Record<string, string> = {}) => {
  const fd = new FormData();
  fd.append('image', file);
  Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
  return api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

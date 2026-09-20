import axios from 'axios';

// Read VITE_API_URL from environment, trimming any accidental whitespace or wrapping quotes
const rawEnvUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/^["']|["']$/g, '');

// If an absolute URL is provided (e.g. Render backend), ensure it points to the /api namespace
export const resolvedApiBaseUrl = rawEnvUrl
  ? (rawEnvUrl.endsWith('/api') ? rawEnvUrl : `${rawApiUrlClean(rawEnvUrl)}/api`)
  : '/api';

function rawApiUrlClean(url) {
  return url.replace(/\/+$/, '');
}

// Log startup resolution immediately so developers can inspect in browser DevTools
if (typeof window !== 'undefined') {
  if (rawEnvUrl) {
    console.log(
      `%c[SmartRide API]%c Configured Backend: ${resolvedApiBaseUrl}`,
      'background: #047857; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #047857; font-weight: bold; margin-left: 6px;'
    );
  } else {
    console.warn(
      `%c[SmartRide API WARNING]%c VITE_API_URL is NOT set! Falling back to relative path: "${resolvedApiBaseUrl}".\n` +
      `If deployed to production (e.g. Vercel), set VITE_API_URL in your Vercel Project Settings > Environment Variables ` +
      `to your Render backend URL (e.g. https://your-backend.onrender.com) and trigger a new deployment.`,
      'background: #dc2626; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #dc2626; font-weight: bold; margin-left: 6px;'
    );
  }
}

const api = axios.create({
  baseURL: resolvedApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartride_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction & session handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // If token expired or invalid, clear local auth
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('smartride_token');
        localStorage.removeItem('smartride_user');
        window.location.href = '/login?expired=true';
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    const errors = error.response?.data?.errors;

    return Promise.reject({
      message,
      errors,
      status: error.response?.status,
    });
  }
);

export default api;

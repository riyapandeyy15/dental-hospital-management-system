import axios from 'axios';

import { AUTH_TOKEN_STORAGE_KEY } from '../utils/constants.js';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT (if we have one) to every outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthProvider registers a handler here so that a 401 from any protected
// request (e.g. an expired token) can clear auth state and redirect to
// /login using React Router's navigate, instead of a hard page reload.
let onAuthFailure = null;

export function setOnAuthFailure(handler) {
  onAuthFailure = handler;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest && onAuthFailure) {
      onAuthFailure();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

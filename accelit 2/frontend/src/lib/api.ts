// src/lib/api.ts
// Centralised Axios instance.
// - In development: Vite proxy forwards /api → localhost:3001
// - In production: VITE_API_URL points directly to the backend (e.g. Railway)

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';   // falls back to Vite proxy in dev

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accelit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accelit_token');
      localStorage.removeItem('accelit_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

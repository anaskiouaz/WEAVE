import { Capacitor } from '@capacitor/core';

const IP_LOCALE = '10.138.43.170'; 
const PORT = '4000';

// Détection Mobile vs Web
const isNative = Capacitor.isNativePlatform();

// Si Mobile -> IP Locale. Si Web -> Localhost ou Vercel.
let baseUrl = isNative 
  ? `http://${IP_LOCALE}:${PORT}/api`
  : (import.meta.env.VITE_API_BASE_URL || `http://localhost:${PORT}/api`);

// Nettoyage de l'URL
const API_BASE_URL = baseUrl.replace(/\/$/, '').replace(/\/api$/, '') + '/api';

console.log(`🔌 API Cible (${isNative ? 'Mobile' : 'Web'}): ${API_BASE_URL}`);

// --- GESTION HEADERS ---
const getHeaders = (options = {}) => {
  const token = localStorage.getItem('weave_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse(res) {
  if (!res.ok) {
    if (res.status === 401) console.warn("⚠️ Token invalide");
    const errorData = await res.json().catch(() => null);
    if (errorData && errorData.error) throw new Error(errorData.error);
    throw new Error(`Erreur API (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    method: 'GET',
    headers: getHeaders(options),
  });
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${normalizePath(path)}`, {
    method: 'PUT',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path, data = null) {
  const config = { method: 'DELETE', headers: getHeaders() };
  if (data) config.body = JSON.stringify(data);
  const res = await fetch(`${API_BASE_URL}${normalizePath(path)}`, config);
  return handleResponse(res);
}

// Normalize certain legacy/alternate paths to current backend routes.
function normalizePath(path) {
  if (!path) return path;
  // If frontend calls /users/me but backend exposes /auth/me, map it here.
  if (path === '/users/me') return '/auth/me';
  return path;
}
import { Capacitor } from '@capacitor/core';

const PROD_URL = 'https://weave-be-server-d8badmaafzdvc8aq.swedencentral-01.azurewebsites.net';

// Détection Mobile vs Web
const isNative = Capacitor.isNativePlatform();

// --- LOGIQUE SIMPLIFIÉE ---
// On utilise TOUJOURS l'URL de production sur mobile pour éviter les soucis de réseau local
let baseUrl = isNative 
  ? PROD_URL 
  : (import.meta.env.VITE_API_BASE_URL || PROD_URL); 

// Nettoyage de l'URL pour éviter les doublons (/api/api)
const API_BASE_URL = baseUrl.replace(/\/$/, '').replace(/\/api$/, '') + '/api';

console.log(`🔌 API Cible: ${API_BASE_URL}`);

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
  if (!path) return '';

  // Keep legacy mapping if present
  if (path === '/users/me') return '/auth/me';

  // Ensure we work with a leading slash
  let p = path.startsWith('/') ? path : `/${path}`;

  // If the requested path already contains a leading /api (causing /api/api),
  // remove the first /api occurrence so final url becomes /api/whatever (single api).
  if (p === '/api') return '';
  if (p.startsWith('/api/')) {
    p = p.replace(/^\/api/, '');
  }

  return p;
}
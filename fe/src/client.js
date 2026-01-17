const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// Fonction pour gérer les headers (notamment l'ID utilisateur)
const getHeaders = (options = {}) => {
  return {
    'Content-Type': 'application/json',
    ...options.headers,
  };
};

// --- GET ---
export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getHeaders(options),
  });
  if (!res.ok) throw new Error(`API GET error: ${res.status}`);
  return res.json();
}

// --- POST ---
export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST error: ${res.status}`);
  return res.json();
}

// --- PUT (Indispensable pour le profil) ---
export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PUT error: ${res.status}`);
  return res.json();
}

// --- DELETE ---
export async function apiDelete(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(options),
  });
  if (!res.ok) throw new Error(`API DELETE error: ${res.status}`);
  return res.json();
}
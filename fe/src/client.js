const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = localStorage.getItem('weave_token'); 
  if (token) {
    headers['Authorization'] = `Bearer ${token}`; 
  }
  return headers;
};

// --- GET ---
export async function apiGet(path, options = {}) {
  // On fusionne les options (pour permettre l'ajout de signaux d'annulation, etc.)
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 
      ...getHeaders(), 
      ...options.headers 
    }, 
  });

  if (!res.ok) {
    // On essaie de lire l'erreur renvoyée par le serveur
    const errorData = await res.json().catch(() => ({}));
    console.error("❌ API GET Error:", path, res.status, errorData);
    throw new Error(errorData.message || errorData.error || `Erreur API (${res.status})`);
  }
  return res.json();
}

// --- POST ---
export async function apiPost(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("❌ API POST Error:", path, res.status, errorData);
    throw new Error(errorData.message || errorData.error || `Erreur API (${res.status})`);
  }
  return res.json();
}

// --- PUT ---
export async function apiPut(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("❌ API PUT Error:", path, res.status, errorData);
    throw new Error(errorData.message || errorData.error || `Erreur API (${res.status})`);
  }
  return res.json();
}

// --- DELETE ---
export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("❌ API DELETE Error:", path, res.status, errorData);
    throw new Error(errorData.message || errorData.error || `Erreur API (${res.status})`);
  }
  return res.json();
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// src/api/client.js

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function apiPost(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

// --- C'est cette fonction qu'il te manquait ---
// Dans client.js

export async function apiPut(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json', // <--- INDISPENSABLE
    },
    body: JSON.stringify(data), // <--- INDISPENSABLE : Convertir l'objet JS en texte JSON
  });

  if (!res.ok) {
    // Cela nous aidera à voir l'erreur renvoyée par le backend (res.statusText ou le JSON d'erreur)
    const errorData = await res.json().catch(() => ({})); 
    throw new Error(`API error ${res.status}: ${errorData.error || res.statusText}`);
  }

  return res.json();
}// ----------------------------------------------

export async function apiDelete(path, data = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const config = {
    method: 'DELETE',
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, config);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`API error ${res.status}: ${errorData.message || errorData.error || res.statusText}`);
  }

  return res.json();
}
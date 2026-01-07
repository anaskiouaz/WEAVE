// src/api/client.js

// Si une variable d'environnement est définie (par le fichier .env), on l'utilise.
// Sinon, on utilise localhost par défaut (parfait pour le développement PC).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

console.log("API URL utilisée :", API_BASE_URL); // Pour vérifier dans la console (F12)

export async function apiGet(path) {
  // ... le reste ne change pas ...
  const res = await fetch(`${API_BASE_URL}${path}`, {
// ...

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

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}


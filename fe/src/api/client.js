const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

// --- CORRECTION ICI ---
const getHeaders = (options = {}) => {
  // 1. On récupère le token du stockage
  const token = localStorage.getItem('weave_token');

  // 2. On prépare les headers de base
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // 3. Si le token existe, on l'ajoute ! (C'est ça qui manquait)
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Fonction utilitaire pour gérer la réponse du fetch.
 */
async function handleResponse(res) {
  if (!res.ok) {
    // Si on a une erreur 401 (Non autorisé), c'est souvent que le token est périmé
    if (res.status === 401) {
        console.warn("⚠️ Erreur 401 : Token invalide ou manquant");
        // Optionnel : rediriger vers le login si besoin
        // window.location.href = '/login';
    }

    const errorData = await res.json().catch(() => null);

    if (errorData && errorData.error) {
      throw new Error(errorData.error);
    }
    
    // Fallback message
    throw new Error(`Erreur API (${res.status}): ${res.statusText}`);
  }

  return res.json();
}

export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getHeaders(options), // Maintenant ça envoie le token !
  });
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function apiDelete(path, data = null) {
  const config = {
    method: 'DELETE',
    headers: getHeaders(), // Correction : utiliser getHeaders ici aussi
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, config);
  return handleResponse(res);
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const getHeaders = (options = {}) => {
  return {
    'Content-Type': 'application/json',
    ...(options.headers || {}), // Permet de passer x-user-id
  };
};
/**
 * Fonction utilitaire pour gérer la réponse du fetch.
 * Si le statut est en erreur (4xx, 5xx), on tente de lire le JSON 
 * pour récupérer le message "error" précis envoyé par le backend.
 */
async function handleResponse(res) {
  if (!res.ok) {
    // On essaie de parser le corps de la réponse en JSON
    const errorData = await res.json().catch(() => null);

    // Cas 1 : Le backend a renvoyé un JSON avec un champ "error" (C'est ce qu'on veut !)
    if (errorData && errorData.error) {
      throw new Error(errorData.error);
    }

    // Cas 2 : Pas de JSON ou pas de champ error, on renvoie le statut HTTP
    throw new Error(`Erreur API (${res.status}): ${res.statusText}`);
  }

  // Si tout va bien, on renvoie le JSON de succès
  return res.json();
}

export async function apiGet(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: getHeaders(options),
  });
  if (!res.ok) throw new Error(`API GET error: ${res.status}`);
  return res.json();
  return handleResponse(res);
}

export async function apiPost(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API POST error: ${res.status}`);
  return res.json();
}

export async function apiPut(path, body, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: getHeaders(options),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PUT error: ${res.status}`);
  return res.json();
}

export async function apiDelete(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getHeaders(options),
  });
  if (!res.ok) throw new Error(`API DELETE error: ${res.status}`);
  return res.json();
  return handleResponse(res);
}

export async function apiPut(path, data) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiDelete(path, data = null) {
  const config = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, config);
  return handleResponse(res);
}
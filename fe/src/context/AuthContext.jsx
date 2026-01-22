import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost } from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. INITIALISATION DIRECTE (Plus simple & plus rapide)
  // On regarde directement dans le localStorage au démarrage. 
  // Si c'est là, on le met dans le state tout de suite.
  const [token, setToken] = useState(() => localStorage.getItem('weave_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('weave_user');
    return saved ? JSON.parse(saved) : null;
  });
  // `circleId` and `circleNom` are normally set when the user selects a circle
  // (via `SelectCirclePage`). Read them from localStorage on init so the
  // context is usable after a full page reload. Keep localStorage in sync
  // whenever the app updates the circle.
  const [circleId, setCircleId] = useState(() => {
    try { return localStorage.getItem('circle_id') || null; } catch { return null; }
  });
  const [circleNom, setCircleNom] = useState(() => {
    try { return localStorage.getItem('circle_nom') || null; } catch { return null; }
  });
  // si local storage est vide, ce sera null par défaut

  const [loading, setLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // 2. FONCTION UTILITAIRE (Pour éviter de répéter le code)
  // Sert à sauvegarder les infos du cercle partout en même temps
  const saveCircleData = (id, nom) => {
    if (id) {
      setCircleId(id);
      try { localStorage.setItem('circle_id', id); } catch { }
    }
    if (nom) {
      setCircleNom(nom);
      try { localStorage.setItem('circle_nom', nom); } catch { }
    }
  };

  // 3. LOGIN
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiPost('/auth/login', { email, password });
      if (data.success) {
        // Mise à jour du Token et User
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('weave_token', data.token);
        localStorage.setItem('weave_user', JSON.stringify(data.user));

        // Le cercle n'est pas initialisé ici : la sélection doit se faire
        // uniquement depuis la page de sélection.

        return { success: true };
      }
    } catch (error) {
      console.error("Erreur auth:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // 6. Rafraîchir les données utilisateur depuis le backend
  const refreshUser = async () => {
    const t = localStorage.getItem('weave_token') || token;
    if (!t) return null;
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.user) {
        // Mettre à jour l'utilisateur avec ses cercles mis à jour
        setUser(data.user);
        try { localStorage.setItem('weave_user', JSON.stringify(data.user)); } catch { }
        
        // Ne mettre à jour le cercle principal QUE s'il n'y a pas déjà un cercle sélectionné
        const currentCircleId = localStorage.getItem('circle_id');
        if (!currentCircleId && data.circle_id) {
          setCircleId(data.circle_id);
          try { localStorage.setItem('circle_id', data.circle_id); } catch { }
        }
        
        return data.user;
      }
    } catch (err) {
      console.error('refreshUser failed', err);
      return null;
    }
    return null;
  };

  // 4. LOGOUT (Nettoyage complet)
  const logout = () => {
    // Remove only auth-related keys to avoid deleting unrelated data
    try {
      localStorage.removeItem('weave_token');
      localStorage.removeItem('weave_user');
      localStorage.removeItem('circle_id');
      localStorage.removeItem('circle_nom');
    } catch { }
    setToken(null);
    setUser(null);
    setCircleId(null);
    setCircleNom(null);
  };

  // 5. FONCTION D'INSCRIPTION (Register)
  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await apiPost('/auth/register', userData);
      return { success: data.success };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // NOTE: Synchronisation automatique supprimée — le cercle doit être choisi
  // explicitement par l'utilisateur depuis `SelectCirclePage`.

  // Keep in sync across tabs: if another tab changes localStorage, reflect it here.
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === 'circle_id') {
        setCircleId(e.newValue || null);
      }
      if (e.key === 'circle_nom') {
        setCircleNom(e.newValue || null);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, circleId, circleNom,
      login, register, logout, loading,
      unreadMessages, setUnreadMessages,
      // Expose a combined setter that updates both values atomically
      setCircle: (id, nom) => {
        if (id) {
          setCircleId(id);
          try { localStorage.setItem('circle_id', id); } catch { }
        }
        if (nom) {
          setCircleNom(nom);
          try { localStorage.setItem('circle_nom', nom); } catch { }
        }
      },
      // Individual setters for backward compatibility
      setCircleId: (id) => {
        if (id) {
          setCircleId(id);
          try { localStorage.setItem('circle_id', id); } catch { }
        }
      },
      setCircleNom: (nom) => {
        if (nom) {
          setCircleNom(nom);
          try { localStorage.setItem('circle_nom', nom); } catch { }
        }
      },
      // Expose setUser and refresh helper so pages can update context after actions
      setUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
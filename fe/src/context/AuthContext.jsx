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

  // 2. FONCTION UTILITAIRE (Pour éviter de répéter le code)
  // Sert à sauvegarder les infos du cercle partout en même temps
  const saveCircleData = (id, nom) => {
    if (id) {
        setCircleId(id);
        try { localStorage.setItem('circle_id', id); } catch {}
    }
    if (nom) {
        setCircleNom(nom);
        try { localStorage.setItem('circle_nom', nom); } catch {}
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

  // 4. LOGOUT (Nettoyage complet)
  const logout = () => {
    // Remove only auth-related keys to avoid deleting unrelated data
    try {
      localStorage.removeItem('weave_token');
      localStorage.removeItem('weave_user');
      localStorage.removeItem('circle_id');
      localStorage.removeItem('circle_nom');
    } catch {}
    setToken(null);
    setUser(null);
    setCircleId(null);
    setCircleNom(null);
  };

  // 5. FONCTION D'INSCRIPTION (Register)
  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await apiPost('/users', userData);
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
      // Expose setters which persist to localStorage via saveCircleData
      setCircleId: (id) => saveCircleData(id, circleNom),
      setCircleNom: (nom) => saveCircleData(circleId, nom),
      // Also expose a convenience to set both
      setCircle: (id, nom) => saveCircleData(id, nom),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
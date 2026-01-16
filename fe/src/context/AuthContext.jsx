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
  const [circleId, setCircleId] = useState(() => localStorage.getItem('circle_id'));
  const [circleNom, setCircleNom] = useState(() => localStorage.getItem('circle_nom'));
  // si local storage est vide, ce sera null par défaut
  
  const [loading, setLoading] = useState(false);

  // 2. FONCTION UTILITAIRE (Pour éviter de répéter le code)
  // Sert à sauvegarder les infos du cercle partout en même temps
  const saveCircleData = (id, nom) => {
    if (id) {
        setCircleId(id);
        localStorage.setItem('circle_id', id);
    }
    if (nom) {
        setCircleNom(nom);
        localStorage.setItem('circle_nom', nom);
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

        // Mise à jour du Cercle (via notre utilitaire)
        saveCircleData(data.circle_id, data.circle_nom);
        
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
    localStorage.clear(); // Ou supprimer item par item si tu veux garder d'autres trucs
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

  // 6. SYNCHRONISATION (Refresh)
  // Si on a un token mais PAS d'info de cercle (ex: refresh page), on va les chercher.
  useEffect(() => {
    const fetchCircleInfo = async () => {
      if (!token) return;

      try {
        // Note: Assure-toi que apiPost ou un équivalent apiGet gère le header Authorization
        // Ici je garde le fetch natif pour être sûr que ça marche avec ton token
        const res = await fetch('/api/circles/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            saveCircleData(data.circle_id, data.circle_nom);
        }
      } catch (err) {
        console.error("Erreur auto-fetch cercle:", err);
      }
    };

    if (token && (!circleId || !circleNom)) {
      fetchCircleInfo();
    }
  }, [token, circleId, circleNom]);

  return (
    <AuthContext.Provider value={{
      user, token, circleId, circleNom,
      login, register, logout, loading,
      setCircleId: (id) => saveCircleData(id, circleNom), // Wrapper pour garder la synchro
      setCircleNom: (nom) => saveCircleData(circleId, nom)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
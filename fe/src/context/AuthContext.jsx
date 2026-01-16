import { createContext, useContext, useState } from 'react';
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
  // `circleId` and `circleNom` are set only when the user selects a circle
  // (via `SelectCirclePage`). We don't read them from localStorage here so
  // initialization happens in a single place.
  const [circleId, setCircleId] = useState(null);
  const [circleNom, setCircleNom] = useState(null);
  // si local storage est vide, ce sera null par défaut
  
  const [loading, setLoading] = useState(false);

  // 2. FONCTION UTILITAIRE (Pour éviter de répéter le code)
  // Sert à sauvegarder les infos du cercle partout en même temps
  const saveCircleData = (id, nom) => {
    if (id) {
        setCircleId(id);
    }
    if (nom) {
        setCircleNom(nom);
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

  // NOTE: Synchronisation automatique supprimée — le cercle doit être choisi
  // explicitement par l'utilisateur depuis `SelectCirclePage`.

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
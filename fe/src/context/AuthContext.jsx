
import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost } from '../api/client';

export const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('weave_token'));
  const [loading, setLoading] = useState(false);
  const [circleId, setCircleId] = useState(null);
  const [circleNom, setCircleNom] = useState(null);

  // Fonction de Connexion
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiPost('./../auth/login', { email, password });
      if (data.success) {
        // Sauvegarde du token, de l'user et du cercle
        localStorage.setItem('weave_token', data.token);
        localStorage.setItem('weave_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setCircleId(data.circle_id);
        setCircleNom(data.circle_nom);
        localStorage.setItem('circle_id', data.circle_id);
        localStorage.setItem('circle_nom', data.circle_nom);
        return { success: true };
      }
    } catch (error) {
      console.error("Erreur auth:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'Inscription
  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await apiPost('/users', userData);
      if (data.success) {
        // On connecte l'utilisateur directement après l'inscription ?
        // Pour l'instant, on renvoie juste le succès
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de Déconnexion
  const logout = () => {
    localStorage.removeItem('weave_token');
    localStorage.removeItem('weave_user');
    localStorage.removeItem('circle_id');
    localStorage.removeItem('circle_nom');
    setToken(null);
    setUser(null);
    setCircleId(null);
    setCircleNom(null);
  };

  // Au chargement de l'app, on vérifie si on a déjà des données
  useEffect(() => {
    const storedUser = localStorage.getItem('weave_user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    if (!circleId && localStorage.getItem('circle_id'))
      setCircleId(localStorage.getItem('circle_id'));
    if (!circleNom && localStorage.getItem('circle_nom'))
      setCircleNom(localStorage.getItem('circle_nom'));
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user, token, circleId, circleNom, setCircleId, setCircleNom,
      login, register, logout, loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('weave_token'));
  const [loading, setLoading] = useState(false);

  // Fonction de Connexion
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiPost('/auth/login', { email, password });
      if (data.success) {
        // Sauvegarde du token et de l'user
        localStorage.setItem('weave_token', data.token);
        localStorage.setItem('weave_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
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
    setToken(null);
    setUser(null);
  };

  // Au chargement de l'app, on vérifie si on a déjà des données
  useEffect(() => {
    const storedUser = localStorage.getItem('weave_user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
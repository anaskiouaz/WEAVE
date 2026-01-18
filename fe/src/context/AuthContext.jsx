import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Le cercle actif est stocké dans le localStorage
  const [circleId, setCircleId] = useState(localStorage.getItem('circle_id'));
  const [circleNom, setCircleNom] = useState(localStorage.getItem('circle_nom'));
  
  const [loading, setLoading] = useState(true);

  // Fonction appelée après le Login réussi
  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser); // On met à jour le user immédiatement
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('circle_id');
    localStorage.removeItem('circle_nom');
    setToken(null);
    setUser(null);
    setCircleId(null);
    window.location.href = '/login';
  };

  // Chargement automatique au démarrage
  useEffect(() => {
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user); // On stocke le user et ses cercles
        } else {
          logout();
        }
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, [token]);

  return (
    <AuthContext.Provider value={{ 
        user, token, login, logout, loading, 
        circleId, setCircleId, circleNom, setCircleNom 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
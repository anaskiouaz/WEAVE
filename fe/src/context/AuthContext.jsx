import { createContext, useContext, useState, useEffect } from 'react';
import { apiPost, apiGet } from '../api/client';
import { io } from 'socket.io-client';

// URL du socket (dérivée de l'API URL)
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') 
  : 'http://localhost:4000';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1. CHARGEMENT IMMÉDIAT (Synchrone)
  // On lit le localStorage tout de suite pour que l'app mobile ne clignote pas sur "Login"
  const [token, setToken] = useState(() => localStorage.getItem('weave_token'));
  const [user, setUser] = useState(() => {
    try {
        const saved = localStorage.getItem('weave_user');
        return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  // États du cercle
  const [circleId, setCircleIdState] = useState(() => localStorage.getItem('circle_id'));
  const [circleNom, setCircleNomState] = useState(() => localStorage.getItem('circle_nom')); // AJOUTÉ
  
  const [loading, setLoading] = useState(false);

  // Setters avec persistance localStorage
  const setCircleId = (id) => {
    if (id) {
        localStorage.setItem('circle_id', id);
        setCircleIdState(id);
    } else {
        localStorage.removeItem('circle_id');
        setCircleIdState(null);
    }
  };

  // --- FONCTION MANQUANTE AJOUTÉE ---
  const setCircleNom = (nom) => {
    if (nom) {
        localStorage.setItem('circle_nom', nom);
        setCircleNomState(nom);
    } else {
        localStorage.removeItem('circle_nom');
        setCircleNomState(null);
    }
  };

  // --- ACTIONS ---
  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiPost('/auth/login', { email, password });      
      if (data.success) {
        localStorage.setItem('weave_token', data.token);
        localStorage.setItem('weave_user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        
        // Si le backend renvoie déjà les infos du cercle
        if (data.circle_id) setCircleId(data.circle_id);
        if (data.circle_nom) setCircleNom(data.circle_nom);
        
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("Déconnexion demandée");
    localStorage.clear();
    setToken(null);
    setUser(null);
    setCircleId(null);
    setCircleNom(null);
  };

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

  // --- RESTAURATION DE SESSION ---
  useEffect(() => {
    const verifySession = async () => {
        if (!token) return;

        try {
            const res = await apiGet('/users/me');
            if (res.success) {
                setUser(res.user);
                localStorage.setItem('weave_user', JSON.stringify(res.user));
                
                // Mise à jour si le user a un cercle actif dans la DB
                if (res.user.current_circle_id) {
                    setCircleId(res.user.current_circle_id);
                }
            }
        } catch (err) {
            console.warn("⚠️ Vérification session échouée :", err.message);
            if (err.message.includes('401') || err.message.includes('403')) {
                logout();
            }
        }
    };

    verifySession();
  }, [token]);

  // --- SOCKET.IO ---
  useEffect(() => {
    if (!token || !circleId) return;

    const socket = io(SOCKET_URL);
    socket.emit('join_circle', circleId);

    socket.on('notification', (data) => {
        console.log("🔔 Notif reçue:", data);
        // Ici tu peux ajouter une logique pour afficher un badge ou autre
    });

    return () => {
        socket.disconnect();
    };
  }, [token, circleId]);

  return (
    <AuthContext.Provider value={{
      user, token, circleId, circleNom, // On expose circleNom
      login, register, logout, loading,
      setUser, setCircleId, setCircleNom // On expose setCircleNom (C'EST ÇA QUI MANQUAIT)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
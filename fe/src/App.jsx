import { BrowserRouter, Routes, Route, Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react'; // Ajout de useEffect
import { Capacitor } from '@capacitor/core'; // Ajout pour les notifs
import { PushNotifications } from '@capacitor/push-notifications'; // Ajout pour les notifs
import { fetchUnreadMessagesCount } from './utils/unreadMessages';

// Composants
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Memories from './components/Memories';
import Messages from './components/messagerie/Messages';
import Profile from './components/Profile';
import Admin from './components/Admin';
import EmergencyDialog from './components/EmergencyDialog';
// Assure-toi que le chemin correspond bien à l'emplacement de ton fichier de navigation mobile
import Navigation from './components/ui-mobile/navigation'; 
import OnboardingTour from './components/OnboardingTour';

import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SelectCirclePage from './components/auth/SelectCirclePage';
import { useAuth } from './context/AuthContext';
import { apiPost } from './api/client'; // Ajout pour envoyer le token

// RGPD - Gestion des cookies
import { CookieProvider } from './context/CookieContext';
import CookieBanner from './components/CookieBanner';
import CookiePreferences from './components/CookiePreferences';
import PrivacyPolicy from './components/PrivacyPolicy';
import LegalNotice from './components/LegalNotice';

function ProtectedLayout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/select-circle');
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // 1. On récupère 'user' ici pour vérifier le rôle
  const { token, logout, user, unreadMessages, setUnreadMessages, circleId, refreshUser } = useAuth();
  const navigate = useNavigate();

  // --- RAFRAÎCHIR LES DONNÉES UTILISATEUR AU CHARGEMENT ---
  useEffect(() => {
    // Rafraîchir les données utilisateur (incluant les cercles et rôles) au chargement
    if (user && refreshUser) {
      refreshUser();
    }
  }, []); // Une seule fois au montage du composant

  // --- RAFRAÎCHISSEMENT DES MESSAGES NON LUS ---
  useEffect(() => {
    const refreshUnreadMessages = async () => {
      if (user) {
        const count = await fetchUnreadMessagesCount(circleId);
        setUnreadMessages(count);
      }
    };
    
    refreshUnreadMessages();
    
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(refreshUnreadMessages, 30000);
    
    return () => clearInterval(interval);
  }, [location.pathname, user, circleId, setUnreadMessages]);

  // --- INITIALISATION DES NOTIFICATIONS (Déplacé ici pour être actif partout) ---
  useEffect(() => {
    const initNotifications = async () => {
        // Ne rien faire si on est sur le web
        if (Capacitor.getPlatform() === 'web') return; 
        
        try {
            const userId = user?.id;
            if (!userId) return;

            // Nettoyage des listeners existants pour éviter les doublons
            await PushNotifications.removeAllListeners(); 

            // Enregistrement du token auprès du backend
            await PushNotifications.addListener('registration', async (token) => {
                console.log('📱 Token FCM reçu:', token.value);
                await apiPost('/users/device-token', { userId, token: token.value });
            });

            // Réception d'une notif quand l'app est ouverte (foreground)
            await PushNotifications.addListener('pushNotificationReceived', (n) => {
                console.log('🔔 Notif reçue:', n);
                // Optionnel: Afficher un toast/alerte ici si voulu
                // alert(`${n.title}\n${n.body}`);
            });
            
            // Demande de permission
            let perm = await PushNotifications.checkPermissions();
            if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
            if (perm.receive === 'granted') await PushNotifications.register();

        } catch (e) { console.error(`Erreur Notifs: ${e.message}`); }
    };

    if (user) {
        initNotifications();
    }
  }, [user]);
  // --------------------------------------------------------------------------

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) return <Navigate to="/" replace />;

  // --- LOGIQUE DE SÉCURITÉ ADMIN ---
  const globalRole = user?.role_global ? user.role_global.toUpperCase() : '';
  const hasCircleAdmin = Array.isArray(user?.circles) && user.circles.some(c => (c.role || '').toUpperCase() === 'ADMIN' || (c.role || '').toUpperCase() === 'SUPERADMIN');

  // 2. Liste des liens DE BASE (accessibles à tous sur Desktop)
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/calendar', icon: Calendar, label: 'Calendrier' },
    { path: '/memories', icon: Heart, label: 'Souvenirs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/admin', icon: Settings, label: 'Administration' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <OnboardingTour />

      {/* --- SIDEBAR (VISIBLE UNIQUEMENT SUR DESKTOP) --- */}
      {!hideNav && (
        <aside className="hidden md:flex w-64 bg-white shadow-lg flex-col z-50">
          <div className="p-6 border-b">
            <h1 className="text-blue-600 text-2xl font-bold">Weave</h1>
            <p className="text-gray-600 mt-1 text-sm">Plateforme d'entraide</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                data-tour={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg relative ${location.pathname === path
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {label === 'Messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg text-gray-700 hover:bg-red-50 hover:text-red-600 mt-4">
              <LogOut className="w-6 h-6" />
              <span>Déconnexion</span>
            </button>
          </nav>
          <div className="p-4 border-t">
            <button onClick={() => setEmergencyOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md">
              <AlertCircle className="w-6 h-6" />
              <span className="text-lg font-bold">Urgence</span>
            </button>
          </div>
        </aside>
      )}
{/* --- CONTENU PRINCIPAL --- */}
      <main className="flex-1 overflow-auto w-full relative pb-28 md:pb-0 bg-gray-50">

        {/* HEADER MOBILE */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white border-b shadow-sm">
          
          {/* Groupe Gauche : Profil + Titre */}
          <div className="flex items-center gap-3">
            <Link 
              to="/profile" 
              className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              aria-label="Mon profil"
            >
              <User className="w-5 h-5" />
            </Link>
            <p className="text-lg font-bold text-blue-600">Weave</p>
          </div>

          {/* Bouton Urgence */}
          <button
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
            aria-label="Urgence"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Urgence</span>
          </button>
        </div>
        
        <Outlet />
      </main>

      {/* --- NAV MOBILE (Intégration) --- */}
      {/* On vérifie hideNav et on ajoute md:hidden pour cacher sur PC */}
      {!hideNav && (
        <div className="md:hidden">
          <Navigation />
        </div>
      )}

      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <CookieProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
          <Route path="/mentions-legales" element={<LegalNotice />} />

          {/* Routes Protégées */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />

            {/* Route Admin protégée par le Guard */}
            <Route path="/admin" element={<Admin />} />

            <Route path="/select-circle" element={<SelectCirclePage />} />
          </Route>
        </Routes>
        
        {/* RGPD */}
        <CookieBanner />
        <CookiePreferences />
      </BrowserRouter>
    </CookieProvider>
  );
}
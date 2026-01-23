import { BrowserRouter, Routes, Route, Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react'; // Ajout de useEffect
import { Capacitor } from '@capacitor/core'; // Ajout pour les notifs
import { PushNotifications } from '@capacitor/push-notifications'; // Ajout pour les notifs
import { fetchUnreadMessagesCount } from './utils/unreadMessages';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle, LogOut, RefreshCw } from 'lucide-react';
import JoinCircle from './components/JoinCircle'; 


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
import ThemeToggle from './components/ui/ThemeToggle';

// --- Auth Components ---
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SelectCirclePage from './components/auth/SelectCirclePage';
import { ThemeProvider } from './context/ThemeContext';
import { apiPost } from './api/client'; // Ajout pour envoyer le token
import AdminGuard from './components/auth/AdminGuard';
import { useAuth, AuthProvider } from './context/AuthContext';

// --- Email & Join Components (Missing in your previous version) ---
import ForgotPasswordPage from './components/auth/ForgotPassword';
import ResetPasswordPage from './components/auth/ResetPassword';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import JoinPage from './components/auth/JoinPage';

// ✅ IMPORT CONTEXT

// RGPD
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
    { path: '/admin', icon: Settings, label: 'Administration' },
    { path: '/select-circle', icon: RefreshCw, label: 'Changer de cercle' }
  ];

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <OnboardingTour />

      {!hideNav && (
        <aside className="hidden md:flex w-64 flex-col z-50 border-r" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-light)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--soft-coral)' }}>Weave</h1>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Plateforme d'entraide</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                data-tour={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-lg relative ${location.pathname === path ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                style={{
                  backgroundColor: location.pathname === path ? 'var(--soft-coral)' : 'transparent',
                  color: location.pathname === path ? 'white' : 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== path) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== path) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {label === 'Messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: 'var(--soft-coral)' }}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span>{label}</span>
              </Link>
            ))}
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 text-lg mt-4 hover:-translate-y-0.5"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(240, 128, 128, 0.1)';
                e.currentTarget.style.color = 'var(--soft-coral)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <LogOut className="w-6 h-6" />
              <span>Déconnexion</span>
            </button>
          </nav>
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
            <button 
              onClick={() => setEmergencyOpen(true)} 
              className="w-full flex items-center justify-center gap-2 px-4 py-4 text-white rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: '#DC2626', boxShadow: '0 4px 16px rgba(220, 38, 38, 0.35)' }}
            >
              <AlertCircle className="w-6 h-6" />
              <span className="text-lg font-bold">Urgence</span>
            </button>
          </div>
        </aside>
      )}
{/* --- CONTENU PRINCIPAL --- */}
      <main className="flex-1 overflow-auto w-full relative pb-28 md:pb-0" style={{ backgroundColor: 'var(--bg-primary)' }}>

        {/* HEADER MOBILE */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 border-b" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }}>
          
          {/* Groupe Gauche : Profil + Titre */}
          <div className="flex items-center gap-3">
            <Link 
              to="/profile" 
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)', color: 'var(--soft-coral)' }}
              aria-label="Mon profil"
            >
              <User className="w-5 h-5" />
            </Link>
            <p className="text-lg font-bold" style={{ color: 'var(--soft-coral)' }}>Weave</p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Bouton Urgence */}
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-full transition-all text-white"
              style={{ backgroundColor: '#DC2626', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' }}
              aria-label="Urgence"
            >
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Urgence</span>
            </button>
          </div>
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
    <ThemeProvider>
      <AuthProvider>
        <CookieProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/politique-confidentialite" element={<PrivacyPolicy />} />
              <Route path="/mentions-legales" element={<LegalNotice />} />

              {/* ✅ NEW: Email Verification Routes */}
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/join" element={<JoinCircle />} />

              {/* Protected Routes */}
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
      </AuthProvider>
    </ThemeProvider>
  );
}
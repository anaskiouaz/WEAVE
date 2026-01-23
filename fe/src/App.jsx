import { BrowserRouter, Routes, Route, Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle, LogOut } from 'lucide-react';
import { useState } from 'react';
import JoinCircle from './components/JoinCircle'; 


// Composants
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Memories from './components/Memories';
import Messages from './components/messagerie/Messages';
import Profile from './components/Profile';
import Admin from './components/Admin';
import EmergencyDialog from './components/EmergencyDialog';
import Navigation from './components/ui-mobile/navigation';
import OnboardingTour from './components/OnboardingTour';

// --- Auth Components ---
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SelectCirclePage from './components/auth/SelectCirclePage';
import AdminGuard from './components/auth/AdminGuard';

// --- Email & Join Components (Missing in your previous version) ---
import ForgotPasswordPage from './components/auth/ForgotPassword';
import ResetPasswordPage from './components/auth/ResetPassword';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import JoinPage from './components/auth/JoinPage';

// ✅ IMPORT CONTEXT
import { useAuth, AuthProvider } from './context/AuthContext';

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

  // This line caused the crash if AuthProvider was missing
  const { token, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) return <Navigate to="/" replace />;

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
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg ${location.pathname === path
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-6 h-6" />
                <span>{label}</span>
              </Link>
            ))}
            <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg text-gray-700 hover:bg-red-50 hover:text-red-600 mt-4">
              <LogOut className="w-6 h-6" />
              <span>Déconnexion</span>
            </button>
          </nav>
        </aside>
      )}

      <main className="flex-1 overflow-auto w-full relative pb-28 md:pb-0 bg-gray-50">
         <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white border-b shadow-sm">
           <div className="flex items-center gap-3">
             <Link to="/profile" className="flex items-center justify-center w-9 h-9 bg-blue-50 text-blue-600 rounded-full">
               <User className="w-5 h-5" />
             </Link>
             <p className="text-lg font-bold text-blue-600">Weave</p>
           </div>
           <button onClick={() => setEmergencyOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-full">
             <AlertCircle className="w-5 h-5" />
             <span className="font-medium">Urgence</span>
           </button>
         </div>
        <Outlet />
      </main>

      {!hideNav && <div className="md:hidden"><Navigation /></div>}
      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    // ✅ FIX: AuthProvider IS HERE NOW (Guarantees context exists)
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
              <Route path="/admin" element={<Admin />} />
              <Route path="/select-circle" element={<SelectCirclePage />} />
            </Route>
          </Routes>
          
          <CookieBanner />
          <CookiePreferences />
        </BrowserRouter>
      </CookieProvider>
    </AuthProvider>
  );
}
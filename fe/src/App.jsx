import { BrowserRouter, Routes, Route, Link, useLocation, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle, LogOut, Users } from 'lucide-react'; 
import { useState } from 'react';

// --- IMPORTS ---
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Memories from './components/Memories';
import Messages from './components/messagerie/Messages'; 
import Profile from './components/Profile';
import Admin from './components/Admin';
import EmergencyDialog from './components/EmergencyDialog';
import Navigation from './components/ui-mobile/navigation';

import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SelectCirclePage from './components/auth/SelectCirclePage';
import AdminGuard from './components/auth/AdminGuard'; 
import { useAuth } from './context/AuthContext'; 

function ProtectedLayout() {
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/select-circle');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  
  const { token, logout, user, circleId } = useAuth(); 
  const navigate = useNavigate();

  // 1. On récupère l'ID du cercle actif
  const currentCircleId = circleId || localStorage.getItem('circle_id');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!token) return <Navigate to="/" replace />;

  // --- 🔐 LOGIQUE DE DÉCISION (Roles) ---
  let isAdmin = false;

  // 1. Est-ce un Super Admin Global ?
  const isGlobalAdmin = user?.role_global === 'SUPERADMIN' || user?.role_global === 'ADMIN';

  // 2. Est-ce un Admin Local ?
  if (user?.circles && currentCircleId) {
      // Comparaison robuste (String vs String)
      const foundCircle = user.circles.find(c => String(c.id) === String(currentCircleId));
      
      if (foundCircle && foundCircle.role === 'ADMIN') {
          isAdmin = true;
      }
  }

  // Si Global Admin, on écrase tout
  if (isGlobalAdmin) isAdmin = true;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/calendar', icon: Calendar, label: 'Calendrier' },
    { path: '/memories', icon: Heart, label: 'Souvenirs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' }, 
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/admin', icon: Settings, label: 'Administration' });
  }

  return (
    <div className="flex h-screen bg-gray-50">

      {/* --- SIDEBAR (DESKTOP) --- */}
      {!hideNav && (
        <aside className="hidden md:flex w-64 bg-white shadow-lg flex-col z-50">
          <div className="p-6 border-b">
            <h1 className="text-blue-600 text-2xl font-bold">Weave</h1>
            <p className="text-gray-600 mt-1 text-sm">Plateforme d'entraide</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 flex flex-col">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg ${
                  location.pathname === path
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span>{label}</span>
              </Link>
            ))}

            <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
                <Link
                    to="/select-circle"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                >
                    <Users className="w-6 h-6" />
                    <span>Changer de cercle</span>
                </Link>

                <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-lg transition-colors text-lg text-gray-700 hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut className="w-6 h-6" />
                    <span>Déconnexion</span>
                </button>
            </div>
          </nav>

          <div className="p-4 border-t">
            <button onClick={() => setEmergencyOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md">
              <AlertCircle className="w-6 h-6" />
              <span className="text-lg font-bold">Urgence</span>
            </button>
          </div>
        </aside>
      )}

      {/* --- CONTENU --- */}
      <main className="flex-1 overflow-auto w-full relative pb-28 md:pb-0 bg-gray-50">
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-4 bg-white border-b shadow-sm">
          <div><p className="text-lg font-bold text-blue-600">Weave</p></div>
          <button onClick={() => setEmergencyOpen(true)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
            <AlertCircle className="w-5 h-5" /><span className="font-medium">Urgence</span>
          </button>
        </div>

        <Outlet />
      </main>

      {!hideNav && (<div className="md:hidden"><Navigation /></div>)}
      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          
          <Route path="/admin" element={
            <AdminGuard>
              <Admin />
            </AdminGuard>
          } />
          
          <Route path="/select-circle" element={<SelectCirclePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
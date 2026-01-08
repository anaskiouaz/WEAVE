import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle } from 'lucide-react';
import { useState } from 'react';

// Composants de l'application
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Memories from './components/Memories';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Admin from './components/Admin';
import EmergencyDialog from './components/EmergencyDialog';


// Nouvelles pages d'authentification et d'accueil
import LandingPage from './components/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import { AuthProvider } from './context/AuthContext';

// Layout avec Sidebar (Pour les utilisateurs connectés uniquement)
function ProtectedLayout() {
  const location = useLocation();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Note : J'ai changé le chemin de l'accueil de '/' vers '/dashboard'
  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' }, 
    { path: '/calendar', icon: Calendar, label: 'Calendrier' },
    { path: '/memories', icon: Heart, label: 'Souvenirs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/admin', icon: Settings, label: 'Administration' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col hidden md:flex z-50">
        <div className="p-6 border-b">
          <h1 className="text-blue-600 text-2xl font-bold">Weave</h1>
          <p className="text-gray-600 mt-1 text-sm">Plateforme d'entraide</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
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
        </nav>

        {/* Bouton d'urgence */}
        <div className="p-4 border-t">
          <button
            onClick={() => setEmergencyOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-md"
          >
            <AlertCircle className="w-6 h-6" />
            <span className="text-lg font-bold">Urgence</span>
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="flex-1 overflow-auto w-full relative">
        <Outlet />
      </main>

      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. La page que l'on voit en premier (Racine) */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 2. Les pages d'accès */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 3. L'application protégée (Dashboard, etc.) */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
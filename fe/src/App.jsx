import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react'; // Ajout de useEffect
import { PushNotifications } from '@capacitor/push-notifications'; // Ajout plugin notif
import { Capacitor } from '@capacitor/core'; // Pour vérifier si on est sur mobile
import { apiPost } from './api/client'; // Import correct de ta fonction API

import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import Memories from './components/Memories';
import Messages from './components/Messages';
import Profile from './components/Profile';
import Admin from './components/Admin';
import EmergencyDialog from './components/EmergencyDialog';

function AppLayout({ children }) {
  const location = useLocation();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // --- DÉBUT MODIFICATION NOTIFICATIONS ---
  useEffect(() => {
    // On ne lance la logique de notif que si on est sur une vraie app mobile (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      
      // 1. Demander la permission à l'utilisateur
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          // Si autorisé, on enregistre l'appareil auprès de Google/Apple
          PushNotifications.register();
        }
      });

      // 2. Écouter le succès de l'enregistrement pour récupérer le token
      const registrationListener = PushNotifications.addListener('registration', (token) => {
        console.log('Push Token reçu:', token.value);
        
        // 3. Envoyer ce token à ton backend pour le sauvegarder
        // (Ici on met userId: 1 en dur pour le test, à remplacer plus tard par le vrai ID user)
        apiPost('/users/device-token', { 
          userId: 1, 
          token: token.value 
        }).then(() => {
          console.log('Token envoyé au serveur avec succès');
        }).catch(err => {
          console.error('Erreur envoi token serveur:', err);
        });
      });

      // 4. Gérer les erreurs d'enregistrement
      const errorListener = PushNotifications.addListener('registrationError', (error) => {
        console.error('Erreur inscription notifs:', error);
      });

      // 5. Optionnel : Écouter les notifs reçues pendant que l'app est ouverte
      const notificationListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
        alert(`🔔 Nouvelle notif : ${notification.title}`);
      });

      // Nettoyage des écouteurs quand le composant est démonté
      return () => {
        registrationListener.remove();
        errorListener.remove();
        notificationListener.remove();
      };
    }
  }, []);
  // --- FIN MODIFICATION NOTIFICATIONS ---

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/calendar', icon: Calendar, label: 'Calendrier' },
    { path: '/memories', icon: Heart, label: 'Souvenirs' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/admin', icon: Settings, label: 'Administration' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-blue-600">Weave</h1>
          <p className="text-gray-600 mt-1">Plateforme d'entraide</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Emergency Button */}
        <div className="p-4 border-t">
          <button
            onClick={() => setEmergencyOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Urgence</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/memories" element={<Memories />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
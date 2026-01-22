import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, Settings } from 'lucide-react';
// On importe Framer Motion
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function MobileNavigation() {
  const location = useLocation();
  const { unreadMessages } = useAuth();
  
  // Petite fonction pour vérifier si un chemin est actif (y compris les sous-routes)
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') return true;
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/memories', icon: Heart, label: 'Souvenirs' },
    { path: '/calendar', icon: Calendar, label: 'Agenda' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/admin', icon: Settings, label: 'Admin' }, 
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1"
            >
              {/* Conteneur de l'icône et du fond animé */}
              <div className="relative px-3 py-1.5 rounded-xl">
                
                {/* 1. FOND ANIMÉ (Le carré bleu qui glisse) */}
                {active && (
                  <motion.div
                    layoutId="nav-background" // C'est cette prop magique qui crée le glissement
                    className="absolute inset-0 bg-blue-50 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* 2. ICÔNE (Avec effet de pop) */}
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative z-10" // z-10 pour être au-dessus du fond bleu
                >
                  <item.icon 
                    className={`w-6 h-6 transition-colors duration-200 ${
                      active ? 'text-blue-600 stroke-[2.5px]' : 'text-gray-400 stroke-2'
                    }`} 
                  />
                  {/* Badge de messages non lus */}
                  {item.label === 'Messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </motion.div>
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                active ? 'text-blue-600 font-bold' : 'text-gray-400'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
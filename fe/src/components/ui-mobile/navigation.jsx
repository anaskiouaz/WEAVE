import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, ClipboardList, MessageSquare, User } from 'lucide-react';

export default function MobileNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => currentPath === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Accueil' },
    { path: '/tasks', icon: ClipboardList, label: 'Tâches' },
    { path: '/calendar', icon: Calendar, label: 'Agenda' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
                <item.icon 
                  className={`w-6 h-6 ${active ? 'fill-blue-600/20 stroke-[2.5px]' : 'stroke-2'}`} 
                />
              </div>
              <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
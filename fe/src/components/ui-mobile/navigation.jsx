import { useLocation, Link } from 'react-router-dom';
import { Home, Calendar, Heart, MessageSquare, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

export default function Navigation() {
    const location = useLocation();
    const { user } = useAuth(); 

    // Logique Admin (Sécurisée)
    const userRole = user?.onboarding_role ? user.onboarding_role.toUpperCase() : '';
    const globalRole = user?.role_global ? user.role_global.toUpperCase() : '';
    const isAdmin = userRole === 'ADMIN' || globalRole === 'ADMIN' || globalRole === 'SUPERADMIN';

    // Liste de base
    const navItems = [
        { path: '/dashboard', label: 'Accueil', icon: Home },
        { path: '/calendar', label: 'Calendrier', icon: Calendar },
        { path: '/memories', label: 'Souvenirs', icon: Heart },
        { path: '/messages', label: 'Messages', icon: MessageSquare },
        { path: '/profile', label: 'Profil', icon: User },
    ];

    // Ajout conditionnel
    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'Admin', icon: Settings });
    }

    return (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
            <div className="bg-white pointer-events-auto rounded-3xl shadow-xl px-2 py-2 flex items-center gap-1 sm:gap-2 border border-gray-100 max-w-fit overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex flex-col items-center justify-center
                                px-3 py-2 rounded-xl transition-all duration-200
                                min-w-[70px] sm:min-w-[80px]
                                ${isActive
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 border border-transparent'
                                }
                            `}
                        >
                            <Icon
                                className={`w-5 h-5 mb-1 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`}
                            />
                            <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
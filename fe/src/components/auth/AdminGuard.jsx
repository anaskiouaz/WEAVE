import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Chargement
  if (loading) {
    return <div className="p-10 text-center">Chargement...</div>;
  }

  // 2. Si pas connecté du tout -> Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Vérification du Rôle (ROBUSTE)
  // On met tout en MAJUSCULES pour éviter les bugs 'Admin' vs 'admin'
  const userRole = user.onboarding_role ? user.onboarding_role.toUpperCase() : '';
  const globalRole = user.role_global ? user.role_global.toUpperCase() : '';

  // On accepte soit le rôle local d'admin (choisi à l'inscription), soit un superadmin global
  const isAdmin = userRole === 'ADMIN' || globalRole === 'ADMIN' || globalRole === 'SUPERADMIN';

  if (!isAdmin) {
    // Si pas admin, on le renvoie au Dashboard
    console.warn(`⛔ Accès refusé pour ${user.email} (Rôle détecté: ${userRole})`);
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Si tout est bon, on affiche la page Admin
  return children;
};

export default AdminGuard;
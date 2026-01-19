import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  // 1. Si pas connecté du tout -> Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Vérification du Rôle
  // On vérifie si l'utilisateur a le role "admin" (celui qu'on a mis dans la base de données)
  const isAdmin = user.onboarding_role === 'admin' || user.role_global === 'ADMIN';

  if (!isAdmin) {
    console.warn("⛔ Accès refusé : Utilisateur non-admin a tenté d'accéder au backoffice.");
    // Si pas admin, on le renvoie au Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Si tout est bon, on laisse passer (on affiche la page Admin)
  return children;
};

export default AdminGuard;
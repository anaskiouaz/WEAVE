import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminGuard({ children }) {
  const { user, circleId } = useAuth();
  
  // 1. On récupère l'ID du cercle actif (Priorité au Context, sinon LocalStorage)
  const currentCircleId = circleId || localStorage.getItem('circle_id');

  // Si pas d'utilisateur ou pas de cercle sélectionné -> Dehors
  if (!user || !currentCircleId) {
    console.warn("⛔ AdminGuard: Pas de user ou pas de circle_id");
    return <Navigate to="/dashboard" replace />;
  }

  // 2. On cherche le rôle DANS CE CERCLE PRÉCIS
  // On force la conversion en String pour éviter les bugs (1 vs "1")
  const currentCircle = user.circles?.find(c => String(c.id) === String(currentCircleId));
  const userRoleInCircle = currentCircle?.role;

  // 3. On vérifie si SuperAdmin global
  const isGlobalAdmin = user.role_global === 'ADMIN' || user.role_global === 'SUPERADMIN';

  // 4. VERDICT
  if (userRoleInCircle === 'ADMIN' || isGlobalAdmin) {
    // ✅ C'est validé, on laisse entrer
    return children;
  }

  // ❌ Accès refusé
  console.error(`⛔ Accès refusé pour ${user.email}`);
  console.error(`- Cercle actuel ID: ${currentCircleId}`);
  console.error(`- Rôle trouvé: ${userRoleInCircle || 'AUCUN'}`);
  console.error(`- Rôle Global: ${user.role_global}`);
  
  // On renvoie vers le dashboard
  return <Navigate to="/dashboard" replace />;
}
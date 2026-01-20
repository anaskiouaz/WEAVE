import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
// Import des icônes pour le style
import { ShieldAlert, Lock, Loader2, Info } from 'lucide-react';

const AdminGuard = ({ children }) => {
  const { user, token, circleId, loading } = useAuth();

  // État local inchangé
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Logique inchangée ---
  useEffect(() => {
    if (loading) return; // Petit fix: attendre que useAuth ait fini avant de vérifier

    if (!token || !circleId || !user?.id) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    // Fast path: if the user object already contains the circle with ADMIN role,
    // grant access immediately without network call (useful just after create/join).
    if (Array.isArray(user?.circles)) {
      const localMatch = user.circles.find(c => (c.id === circleId || c.circle_id === circleId) && ((c.role || '').toUpperCase() === 'ADMIN' || (c.role || '').toUpperCase() === 'SUPERADMIN'));
      if (localMatch) {
        setIsAdmin(true);
        setChecking(false);
        return;
      }
    }

    const controller = new AbortController();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

    (async () => {
      try {
        setChecking(true);
        const res = await fetch(`${API_BASE}/auth/check-role?circle_id=${encodeURIComponent(circleId)}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const role = data?.role || null;
        setIsAdmin(role && (role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'SUPERADMIN'));
      } catch (err) {
        console.error('Vérif admin échouée:', err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    })();

    return () => controller.abort();
  }, [token, circleId, user?.id, loading]);

  // --- Composants de Style (UI) ---

  // 1. Écran de chargement amélioré
  if (loading || checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="font-medium text-lg">Vérification des autorisations...</p>
      </div>
    );
  }

  // 2. Composant Carte d'Erreur Réutilisable
  const AccessRestricted = ({ title, message, hint, icon: Icon, colorClass, bgClass }) => (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className={`p-6 flex flex-col items-center text-center`}>
          <div className={`p-4 rounded-full ${bgClass} mb-5`}>
            <Icon className={`w-8 h-8 ${colorClass}`} />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {hint && (
            <div className="flex items-start bg-gray-50 p-3 rounded-lg text-left w-full text-sm text-gray-500 border border-gray-100">
              <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{hint}</span>
            </div>
          )}
        </div>

        {/* Barre de couleur décorative en bas */}
        <div className={`h-1.5 w-full ${colorClass.replace('text-', 'bg-')}`} />
      </div>
    </div>
  );

  // --- Conditions d'affichage ---

  if (!user) {
    return (
      <AccessRestricted
        title="Connexion requise"
        message="Vous devez être identifié pour accéder à cette ressource sécurisée."
        hint="Utilisez le bouton de connexion en haut de page ou contactez votre administrateur."
        icon={Lock}
        colorClass="text-blue-600"
        bgClass="bg-blue-50"
      />
    );
  }

  if (!isAdmin) {
    console.warn(`⛔ Accès refusé pour ${user.email}`);
    return (
      <AccessRestricted
        title="Accès non autorisé"
        message="Cette zone est strictement réservée aux administrateurs du cercle."
        hint="Si vous pensez qu'il s'agit d'une erreur, demandez à un administrateur actuel de vérifier vos droits dans les paramètres du cercle."
        icon={ShieldAlert}
        colorClass="text-red-500"
        bgClass="bg-red-50"
      />
    );
  }

  // 3. Si tout est bon, on affiche les enfants
  return children;
};

export default AdminGuard;
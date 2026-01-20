import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';

export default function RestartOnboardingButton() {
  const { user } = useAuth();

  const handleRestartTour = () => {
    // Réinitialiser le flag du tour pour l'utilisateur courant
    const key = user?.id ? `weave_onboarding_seen_${user.id}` : 'weave_onboarding_seen';
    localStorage.removeItem(key);
    // Nettoyage de l'ancien flag global si présent
    if (key !== 'weave_onboarding_seen') {
      localStorage.removeItem('weave_onboarding_seen');
    }
    // Recharger la page pour que le tour redémarre
    window.location.reload();
  };

  return (
    <Button
      onClick={handleRestartTour}
      variant="outline"
      className="w-full flex items-center justify-center gap-2 py-2"
      title="Relancer le tour explicatif des fonctionnalités"
    >
      <RotateCcw className="w-4 h-4" />
      Relancer le tour explicatif
    </Button>
  );
}

import { RotateCcw } from 'lucide-react';
import { Button } from './ui/button';

export default function RestartOnboardingButton() {
  const handleRestartTour = () => {
    // Réinitialiser le flag du tour
    localStorage.removeItem('weave_onboarding_seen');
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

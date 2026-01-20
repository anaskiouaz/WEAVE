import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../context/AuthContext';
import '../style/joyride-custom.css';

export default function OnboardingTour() {
  const location = useLocation();
  const { user } = useAuth();
  const [tourVisible, setTourVisible] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(true); // Par défaut true pour éviter les bugs

  useEffect(() => {
    // Récupérer l'état du tour depuis localStorage
    const hasSeenOnboarding = localStorage.getItem('weave_onboarding_seen');
    
    // Afficher le tour si:
    // 1. L'utilisateur est connecté
    // 2. Il n'a pas encore vu le tour
    // 3. On est sur le dashboard
    if (user && !hasSeenOnboarding && location.pathname === '/dashboard') {
      setHasSeenTour(false);
      // Petit délai pour laisser les éléments se charger
      setTimeout(() => {
        setTourVisible(true);
      }, 500);
    }
  }, [user, location.pathname]);

  const steps = [
    {
      target: 'body',
      title: '👋 Bienvenue sur Weave!',
      content: 'Découvrez comment utiliser l\'application pour gérer vos cercles d\'entraide.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="nav-accueil"]',
      title: '🏠 Tableau de bord',
      content: 'Votre hub central pour voir les actualités de votre cercle et les tâches importantes.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-calendrier"]',
      title: '📅 Calendrier',
      content: 'Consultez les événements et les dates importantes de votre cercle.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-souvenirs"]',
      title: '❤️ Souvenirs',
      content: 'Créez et partagez des souvenirs avec les membres de votre cercle.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-messages"]',
      title: '💬 Messages',
      content: 'Communiquez directement avec les autres membres du cercle.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-profil"]',
      title: '👤 Profil',
      content: 'Gérez vos informations personnelles et vos préférences.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-administration"]',
      title: '⚙️ Administration',
      content: 'Gérez les paramètres de votre cercle et les rôles des membres (si vous êtes admin).',
      placement: 'right',
    },
    {
      target: 'body',
      title: '🎉 Vous êtes prêt!',
      content: 'N\'hésitez pas à explorer l\'application. Vous pouvez relancer ce tour depuis votre profil à tout moment.',
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;

    // Marquer le tour comme vu à la fin ou si l'utilisateur le ferme
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('weave_onboarding_seen', 'true');
      setTourVisible(false);
      setHasSeenTour(true);
    }
  };

  if (hasSeenTour || !tourVisible) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={tourVisible}
      continuous
      showProgress
      showSkipButton
      locale={{
        back: '← Précédent',
        close: '✕',
        last: 'Terminer',
        next: 'Suivant →',
        skip: 'Passer le tour',
      }}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#fff',
          backgroundColor: '#fff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
          primaryColor: '#2563eb',
          textColor: '#333',
          zIndex: 10000,
        },
        tooltip: {
          fontSize: 16,
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 'bold',
        },
        buttonSkip: {
          color: '#999',
          fontSize: '14px',
        },
        buttonBack: {
          color: '#666',
          marginRight: '8px',
        },
      }}
    />
  );
}

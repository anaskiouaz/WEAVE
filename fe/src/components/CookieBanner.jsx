import { useState } from 'react';
import { useCookieConsent, COOKIE_CATEGORIES } from '../context/CookieContext';
import { Cookie, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp, Check } from 'lucide-react';

/**
 * Bannière de consentement aux cookies conforme RGPD
 */
export default function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);

  // État local pour l'interface avant sauvegarde
  const [preferences, setPreferences] = useState({
    [COOKIE_CATEGORIES.ESSENTIAL]: true,
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.MARKETING]: false,
  });

  if (!showBanner) return null;

  const handleToggle = (category) => {
    if (category === COOKIE_CATEGORIES.ESSENTIAL) return;
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };

  const cookieInfo = [
    {
      category: COOKIE_CATEGORIES.ESSENTIAL,
      icon: Shield,
      title: 'Cookies essentiels',
      description: 'Nécessaires au fonctionnement du site (sécurité, connexion).',
      required: true,
    },
    {
      category: COOKIE_CATEGORIES.ANALYTICS,
      icon: BarChart3,
      title: 'Cookies analytiques',
      description: 'Nous aident à améliorer le site via des statistiques anonymes.',
      required: false,
    },
    {
      category: COOKIE_CATEGORIES.MARKETING,
      icon: Megaphone,
      title: 'Cookies marketing',
      description: 'Pour vous proposer du contenu pertinent.',
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 animate-in fade-in duration-300" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>

        {/* Header simplifié */}
        <div className="p-6 flex gap-4 items-start" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)' }}>
            <Cookie className="w-6 h-6" style={{ color: 'var(--soft-coral)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Gestion des cookies</h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Nous utilisons des cookies pour optimiser votre expérience. Les cookies essentiels sont obligatoires pour le fonctionnement de l'application.
            </p>
          </div>
        </div>

        {/* Bouton Toggle détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium transition-colors"
          style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}
        >
          <span>Personnaliser mes choix</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Liste des préférences (CheckBox) */}
        {showDetails && (
          <div className="max-h-64 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {cookieInfo.map(({ category, icon: Icon, title, description, required }) => (
              <div
                key={category}
                className="flex items-center gap-4 p-4 rounded-xl shadow-sm"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
              >
                {/* Icône catégorie */}
                <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: required ? 'rgba(167, 201, 167, 0.2)' : 'rgba(240, 128, 128, 0.15)', color: required ? 'var(--sage-green)' : 'var(--soft-coral)' }}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Texte */}
                <div className="flex-1">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
                </div>

                {/* --- NOUVEAU BOUTON : CHECKBOX SIMPLE --- */}
                <div className="shrink-0">
                  {required ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--sage-green)', color: 'white' }}>
                      <Check className="w-3 h-3" />
                      Requis
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggle(category)}
                      className="w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none"
                      style={{ backgroundColor: preferences[category] ? 'var(--soft-coral)' : 'var(--border-input)' }}
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow-md transform transition-transform duration-300"
                        style={{ backgroundColor: 'white', transform: preferences[category] ? 'translateX(10px)' : 'translateX(0)' }}
                      ></div>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 flex flex-col sm:flex-row gap-3" style={{ backgroundColor: 'var(--bg-card)' }}>
          <button
            onClick={rejectAll}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
          >
            Refuser
          </button>

          {showDetails && (
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)', color: 'var(--soft-coral)' }}
            >
              Enregistrer
            </button>
          )}

          <button
            onClick={acceptAll}
            className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-colors"
            style={{ backgroundColor: 'var(--soft-coral)', color: 'white', boxShadow: '0 4px 12px rgba(240, 128, 128, 0.3)' }}
          >
            Accepter tout
          </button>
        </div>

      </div>
    </div>
  );
}
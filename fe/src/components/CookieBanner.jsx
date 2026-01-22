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
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 border border-gray-100">

        {/* Header simplifié */}
        <div className="p-6 border-b border-gray-100 flex gap-4 items-start">
          <div className="p-3 bg-blue-50 rounded-xl shrink-0">
            <Cookie className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Gestion des cookies</h2>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Nous utilisons des cookies pour optimiser votre expérience. Les cookies essentiels sont obligatoires pour le fonctionnement de l'application.
            </p>
          </div>
        </div>

        {/* Bouton Toggle détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 bg-gray-50/50 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <span>Personnaliser mes choix</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Liste des préférences (CheckBox) */}
        {showDetails && (
          <div className="max-h-64 overflow-y-auto bg-gray-50 p-4 space-y-3">
            {cookieInfo.map(({ category, icon: Icon, title, description, required }) => (
              <div
                key={category}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                {/* Icône catégorie */}
                <div className={`p-2 rounded-lg shrink-0 ${required ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Texte */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>

                {/* --- NOUVEAU BOUTON : CHECKBOX SIMPLE --- */}
                <div className="shrink-0">
                  {required ? (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                      <Check className="w-3 h-3" />
                      Requis
                    </div>
                  ) : (
                    <button
                      onClick={() => handleToggle(category)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${preferences[category]
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-transparent hover:border-blue-400'
                        }`}
                    >
                      <Check className="w-4 h-4" strokeWidth={3} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 flex flex-col sm:flex-row gap-3 bg-white">
          <button
            onClick={rejectAll}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Refuser
          </button>

          {showDetails && (
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
          )}

          <button
            onClick={acceptAll}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            Accepter tout
          </button>
        </div>

      </div>
    </div>
  );
}
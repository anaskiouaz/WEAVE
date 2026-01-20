import { useState } from 'react';
import { useCookieConsent, COOKIE_CATEGORIES } from '../context/CookieContext';
import { Cookie, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp, X } from 'lucide-react';

/**
 * Bannière de consentement aux cookies conforme RGPD
 * S'affiche en bas de l'écran jusqu'à ce que l'utilisateur fasse un choix
 */
export default function CookieBanner() {
  const { showBanner, acceptAll, rejectAll, savePreferences, consent } = useCookieConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    [COOKIE_CATEGORIES.ESSENTIAL]: true,
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.MARKETING]: false,
  });

  if (!showBanner) return null;

  const handleToggle = (category) => {
    if (category === COOKIE_CATEGORIES.ESSENTIAL) return; // Toujours activé
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
      description: 'Nécessaires au fonctionnement du site. Ils permettent l\'authentification, la sécurité et la mémorisation de vos préférences.',
      required: true,
    },
    {
      category: COOKIE_CATEGORIES.ANALYTICS,
      icon: BarChart3,
      title: 'Cookies analytiques',
      description: 'Nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience. Données anonymisées.',
      required: false,
    },
    {
      category: COOKIE_CATEGORIES.MARKETING,
      icon: Megaphone,
      title: 'Cookies marketing',
      description: 'Utilisés pour vous proposer des contenus personnalisés et mesurer l\'efficacité de nos communications.',
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Cookie className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Nous respectons votre vie privée
              </h2>
              <p className="mt-1 text-gray-600 text-sm leading-relaxed">
                Weave utilise des cookies pour améliorer votre expérience. Vous pouvez choisir les cookies que vous acceptez. 
                Les cookies essentiels sont nécessaires au fonctionnement du site.
              </p>
            </div>
          </div>
        </div>

        {/* Toggle détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span>Personnaliser mes choix</span>
          {showDetails ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* Détails des cookies */}
        {showDetails && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-4 max-h-64 overflow-y-auto">
            {cookieInfo.map(({ category, icon: Icon, title, description, required }) => (
              <div
                key={category}
                className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200"
              >
                <div className={`p-2 rounded-lg ${required ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <Icon className={`w-5 h-5 ${required ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-medium text-gray-900">{title}</h3>
                    {required ? (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                        Toujours actif
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggle(category)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences[category] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            preferences[category] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3">
          <button
            onClick={rejectAll}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Refuser tout
          </button>
          
          {showDetails && (
            <button
              onClick={handleSavePreferences}
              className="flex-1 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Sauvegarder mes choix
            </button>
          )}
          
          <button
            onClick={acceptAll}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md"
          >
            Accepter tout
          </button>
        </div>

        {/* Lien politique de confidentialité */}
        <div className="px-6 pb-4 text-center">
          <a
            href="/politique-confidentialite"
            className="text-xs text-gray-500 hover:text-blue-600 underline"
          >
            Politique de confidentialité
          </a>
        </div>
      </div>
    </div>
  );
}

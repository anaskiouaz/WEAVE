import { useState, useEffect } from 'react';
import { useCookieConsent, COOKIE_CATEGORIES } from '../context/CookieContext';
import { Cookie, Shield, BarChart3, Megaphone, X, Check, Info } from 'lucide-react';

/**
 * Modal de gestion des préférences de cookies
 * Permet à l'utilisateur de modifier ses choix à tout moment
 */
export default function CookiePreferences() {
  const { 
    showPreferences, 
    closePreferences, 
    savePreferences, 
    consent, 
    getConsentInfo 
  } = useCookieConsent();
  
  const [preferences, setPreferences] = useState({
    [COOKIE_CATEGORIES.ESSENTIAL]: true,
    [COOKIE_CATEGORIES.ANALYTICS]: false,
    [COOKIE_CATEGORIES.MARKETING]: false,
  });
  const [consentDate, setConsentDate] = useState(null);

  // Synchroniser avec le consentement actuel
  useEffect(() => {
    if (consent) {
      setPreferences(consent);
    }
    const info = getConsentInfo();
    if (info?.timestamp) {
      setConsentDate(new Date(info.timestamp));
    }
  }, [consent, showPreferences, getConsentInfo]);

  if (!showPreferences) return null;

  const handleToggle = (category) => {
    if (category === COOKIE_CATEGORIES.ESSENTIAL) return;
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSave = () => {
    savePreferences(preferences);
  };

  const cookieInfo = [
    {
      category: COOKIE_CATEGORIES.ESSENTIAL,
      icon: Shield,
      title: 'Cookies essentiels',
      description: 'Ces cookies sont indispensables au fonctionnement du site. Ils permettent la navigation, l\'authentification sécurisée et la mémorisation de vos préférences de base.',
      examples: ['Session utilisateur', 'Token d\'authentification', 'Préférences de langue'],
      required: true,
      color: 'green',
    },
    {
      category: COOKIE_CATEGORIES.ANALYTICS,
      icon: BarChart3,
      title: 'Cookies analytiques',
      description: 'Ces cookies nous permettent de mesurer l\'audience et de comprendre comment le site est utilisé. Les données sont anonymisées.',
      examples: ['Nombre de visiteurs', 'Pages visitées', 'Durée de session'],
      required: false,
      color: 'blue',
    },
    {
      category: COOKIE_CATEGORIES.MARKETING,
      icon: Megaphone,
      title: 'Cookies marketing',
      description: 'Ces cookies sont utilisés pour vous proposer des contenus et publicités personnalisés en fonction de vos centres d\'intérêt.',
      examples: ['Publicités ciblées', 'Recommandations personnalisées', 'Réseaux sociaux'],
      required: false,
      color: 'purple',
    },
  ];

  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Cookie className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gérer mes cookies
              </h2>
              {consentDate && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Dernier choix : {consentDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={closePreferences}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous pouvez modifier vos préférences de cookies à tout moment. 
              Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires 
              au fonctionnement du site.
            </p>
          </div>
        </div>

        {/* Liste des cookies */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cookieInfo.map(({ category, icon: Icon, title, description, examples, required, color }) => {
            const colors = colorClasses[color];
            const isEnabled = preferences[category];
            
            return (
              <div
                key={category}
                className={`p-5 rounded-xl border-2 transition-all ${
                  isEnabled ? colors.border : 'border-gray-200'
                } ${isEnabled ? colors.bg : 'bg-gray-50'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${isEnabled ? colors.bg : 'bg-gray-100'}`}>
                    <Icon className={`w-5 h-5 ${isEnabled ? colors.text : 'text-gray-400'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className={`font-semibold ${isEnabled ? 'text-gray-900' : 'text-gray-600'}`}>
                        {title}
                      </h3>
                      {required ? (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Requis
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggle(category)}
                          className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isEnabled ? 'translate-x-2.5' : 'translate-x-0'}`}></div>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {examples.map((example, idx) => (
                        <span
                          key={idx}
                          className={`text-xs px-2 py-1 rounded-md ${
                            isEnabled 
                              ? `${colors.bg} ${colors.text}` 
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
          <button
            onClick={closePreferences}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Enregistrer mes préférences
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Pour plus d'informations, consultez notre{' '}
            <a href="/politique-confidentialite" className="text-blue-600 hover:underline">
              politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

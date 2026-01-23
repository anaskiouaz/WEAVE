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
    },
    {
      category: COOKIE_CATEGORIES.ANALYTICS,
      icon: BarChart3,
      title: 'Cookies analytiques',
      description: 'Ces cookies nous permettent de mesurer l\'audience et de comprendre comment le site est utilisé. Les données sont anonymisées.',
      examples: ['Nombre de visiteurs', 'Pages visitées', 'Durée de session'],
      required: false,
    },
    {
      category: COOKIE_CATEGORIES.MARKETING,
      icon: Megaphone,
      title: 'Cookies marketing',
      description: 'Ces cookies sont utilisés pour vous proposer des contenus et publicités personnalisés en fonction de vos centres d\'intérêt.',
      examples: ['Publicités ciblées', 'Recommandations personnalisées', 'Réseaux sociaux'],
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--bg-card)' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-light)', background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-card))' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'rgba(240, 128, 128, 0.15)' }}>
              <Cookie className="w-6 h-6" style={{ color: 'var(--soft-coral)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Gérer mes cookies
              </h2>
              {consentDate && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
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
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4" style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--soft-coral)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous pouvez modifier vos préférences de cookies à tout moment. 
              Les cookies essentiels ne peuvent pas être désactivés car ils sont nécessaires 
              au fonctionnement du site.
            </p>
          </div>
        </div>

        {/* Liste des cookies */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ backgroundColor: 'var(--bg-card)' }}>
          {cookieInfo.map(({ category, icon: Icon, title, description, examples, required, color }) => {
            const isEnabled = preferences[category];
            
            return (
              <div
                key={category}
                className="p-5 rounded-xl transition-all"
                style={{ 
                  backgroundColor: isEnabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
                  border: isEnabled ? '2px solid var(--soft-coral)' : '2px solid var(--border-light)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: isEnabled ? 'rgba(240, 128, 128, 0.15)' : 'var(--bg-secondary)' }}>
                    <Icon className="w-5 h-5" style={{ color: isEnabled ? 'var(--soft-coral)' : 'var(--text-muted)' }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <h3 className="font-semibold" style={{ color: isEnabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {title}
                      </h3>
                      {required ? (
                        <span className="text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--sage-green)', color: 'white' }}>
                          <Check className="w-3 h-3" />
                          Requis
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggle(category)}
                          className="w-12 h-7 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none"
                          style={{ backgroundColor: isEnabled ? 'var(--soft-coral)' : 'var(--border-input)' }}
                        >
                          <div className="w-5 h-5 rounded-full shadow-md transform transition-transform duration-300" style={{ backgroundColor: 'white', transform: isEnabled ? 'translateX(10px)' : 'translateX(0)' }}></div>
                        </button>
                      )}
                    </div>
                    
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {examples.map((example, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-md"
                          style={{ 
                            backgroundColor: isEnabled ? 'rgba(240, 128, 128, 0.1)' : 'var(--bg-secondary)',
                            color: isEnabled ? 'var(--soft-coral)' : 'var(--text-muted)'
                          }}
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
        <div className="px-6 py-4 flex flex-col sm:flex-row gap-3" style={{ borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={closePreferences}
            className="flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '2px solid var(--border-input)', color: 'var(--text-primary)' }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 text-sm font-medium rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--soft-coral)', color: 'white', boxShadow: '0 4px 12px rgba(240, 128, 128, 0.3)' }}
          >
            <Check className="w-4 h-4" />
            Enregistrer mes préférences
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 text-center" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Pour plus d'informations, consultez notre{' '}
            <a href="/politique-confidentialite" className="hover:underline" style={{ color: 'var(--soft-coral)' }}>
              politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

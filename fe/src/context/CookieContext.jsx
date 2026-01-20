import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CookieContext = createContext();

// Catégories de cookies selon le RGPD
export const COOKIE_CATEGORIES = {
  ESSENTIAL: 'essential',      // Toujours actifs, nécessaires au fonctionnement
  ANALYTICS: 'analytics',      // Statistiques d'utilisation
  MARKETING: 'marketing',      // Publicités personnalisées
};

const STORAGE_KEY = 'weave_cookie_consent';
const CONSENT_VERSION = '1.0'; // Incrémentez si vous changez les catégories

const DEFAULT_CONSENT = {
  [COOKIE_CATEGORIES.ESSENTIAL]: true,  // Toujours true
  [COOKIE_CATEGORIES.ANALYTICS]: false,
  [COOKIE_CATEGORIES.MARKETING]: false,
};

export function CookieProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Charger le consentement depuis localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Vérifier si la version du consentement est à jour
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed.preferences);
          setShowBanner(false);
        } else {
          // Version obsolète, demander à nouveau le consentement
          setShowBanner(true);
          setConsent(DEFAULT_CONSENT);
        }
      } catch (e) {
        setShowBanner(true);
        setConsent(DEFAULT_CONSENT);
      }
    } else {
      // Pas de consentement enregistré
      setShowBanner(true);
      setConsent(DEFAULT_CONSENT);
    }
  }, []);

  // Sauvegarder le consentement
  const saveConsent = useCallback((preferences) => {
    const data = {
      version: CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  // Accepter tous les cookies
  const acceptAll = useCallback(() => {
    const allAccepted = {
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
      [COOKIE_CATEGORIES.ANALYTICS]: true,
      [COOKIE_CATEGORIES.MARKETING]: true,
    };
    saveConsent(allAccepted);
  }, [saveConsent]);

  // Refuser tous les cookies optionnels
  const rejectAll = useCallback(() => {
    const onlyEssential = {
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
      [COOKIE_CATEGORIES.ANALYTICS]: false,
      [COOKIE_CATEGORIES.MARKETING]: false,
    };
    saveConsent(onlyEssential);
  }, [saveConsent]);

  // Sauvegarder les préférences personnalisées
  const savePreferences = useCallback((preferences) => {
    // S'assurer que les essentiels sont toujours activés
    saveConsent({
      ...preferences,
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
    });
  }, [saveConsent]);

  // Vérifier si une catégorie est autorisée
  const hasConsent = useCallback((category) => {
    if (!consent) return category === COOKIE_CATEGORIES.ESSENTIAL;
    return consent[category] === true;
  }, [consent]);

  // Ouvrir le panneau de préférences
  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  // Fermer le panneau de préférences
  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  // Obtenir les informations du consentement
  const getConsentInfo = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  const value = {
    consent,
    showBanner,
    showPreferences,
    acceptAll,
    rejectAll,
    savePreferences,
    hasConsent,
    openPreferences,
    closePreferences,
    getConsentInfo,
    COOKIE_CATEGORIES,
  };

  return (
    <CookieContext.Provider value={value}>
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
}

export default CookieContext;

/*
 * Gestion du consentement cookies (RGPD)
 * 
 * Utilise le pattern React Context pour partager l'état du consentement dans toute l'app
 * - CookieProvider : enveloppe l'app et gère l'état
 * - useCookieConsent() : hook pour accéder aux fonctions depuis n'importe quel composant
 * 
 * Stockage : localStorage avec versionnement (si on change les catégories, on redemande)
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CookieContext = createContext(); // Conteneur global pour les données

// Les 3 catégories de cookies RGPD
export const COOKIE_CATEGORIES = {
  ESSENTIAL: 'essential',   // Obligatoires (auth, session)
  ANALYTICS: 'analytics',   // Stats (Google Analytics)
  MARKETING: 'marketing',   // Pubs (Facebook Pixel)
};

const STORAGE_KEY = 'weave_cookie_consent';
const CONSENT_VERSION = '1.0'; // Incrémenter si on change les catégories

// Par défaut : seuls les essentiels sont actifs
const DEFAULT_CONSENT = {
  [COOKIE_CATEGORIES.ESSENTIAL]: true,
  [COOKIE_CATEGORIES.ANALYTICS]: false,
  [COOKIE_CATEGORIES.MARKETING]: false,
};

export function CookieProvider({ children }) {
  const [consent, setConsent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Au chargement : récupère les préférences ou affiche la bannière
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          setConsent(parsed.preferences);
          setShowBanner(false);
        } else {
          // Version changée = redemander consentement
          setShowBanner(true);
          setConsent(DEFAULT_CONSENT);
        }
      } catch (e) {
        setShowBanner(true);
        setConsent(DEFAULT_CONSENT);
      }
    } else {
      // Première visite
      setShowBanner(true);
      setConsent(DEFAULT_CONSENT);
    }
  }, []);

  // Sauvegarde les choix dans localStorage
  const saveConsent = useCallback((preferences) => {
    const data = {
      version: CONSENT_VERSION,
      preferences,
      timestamp: new Date().toISOString(), // Preuve RGPD
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  // Tout accepter
  const acceptAll = useCallback(() => {
    saveConsent({
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
      [COOKIE_CATEGORIES.ANALYTICS]: true,
      [COOKIE_CATEGORIES.MARKETING]: true,
    });
  }, [saveConsent]);

  // Tout refuser (garde les essentiels)
  const rejectAll = useCallback(() => {
    saveConsent({
      [COOKIE_CATEGORIES.ESSENTIAL]: true,
      [COOKIE_CATEGORIES.ANALYTICS]: false,
      [COOKIE_CATEGORIES.MARKETING]: false,
    });
  }, [saveConsent]);

  // Sauvegarder les préférences personnalisées
  const savePreferences = useCallback((preferences) => {
    saveConsent({ ...preferences, [COOKIE_CATEGORIES.ESSENTIAL]: true });
  }, [saveConsent]);

  // Vérifie si une catégorie est autorisée
  const hasConsent = useCallback((category) => {
    if (!consent) return category === COOKIE_CATEGORIES.ESSENTIAL;
    return consent[category] === true;
  }, [consent]);

  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  // Récupère les infos du consentement stocké
  const getConsentInfo = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } 
      catch (e) { return null; }
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

// Hook pour utiliser le contexte dans les composants
export function useCookieConsent() {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieProvider');
  }
  return context;
}

export default CookieContext;

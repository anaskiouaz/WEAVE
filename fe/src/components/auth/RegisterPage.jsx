import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, X, FileText } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth(); // removed 'login' as we don't use it here anymore
  const [error, setError] = useState('');

  // --- ÉTATS ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // État du formulaire avec Nom et Prénom séparés
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    birth_date: '',
    password: '',
    confirmPassword: '',
  });

  // États pour le RGPD (Modale & Consentements)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [consents, setConsents] = useState({
    acceptCGU: false,
    acknowledgePrivacy: false,
    consentSensitive: false,
    acceptNotifications: false, // Optionnel
    acceptCommunications: false // Optionnel
  });

  // --- LOGIQUE FORMULAIRE ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Formatage automatique du téléphone (06 12 34 56 78)
    if (name === 'phone') {
      const formatted = value
        .replace(/\D/g, '')             // Enlève ce qui n'est pas un chiffre
        .slice(0, 10)                   // Limite à 10 chiffres
        .replace(/(\d{2})(?=\d)/g, '$1 ') // Ajoute les espaces
        .trim();
      setFormData({ ...formData, phone: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleConsentChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'acknowledgePrivacy') return; // Bloqué, géré par la modale
    setConsents({ ...consents, [name]: checked });
  };

  // --- LOGIQUE RGPD (SCROLL) ---
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // Tolérance de 5px pour détecter le bas
    if (scrollHeight - scrollTop <= clientHeight + 5) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAcceptPrivacy = () => {
    if (hasScrolledToBottom) {
      setConsents({ ...consents, acknowledgePrivacy: true });
      setShowPrivacyModal(false);
    }
  };

  // --- SOUMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validations Bloquantes RGPD
    if (!consents.acceptCGU) return setError("Vous devez accepter les CGU.");
    if (!consents.acknowledgePrivacy) return setError("Vous devez lire et valider la politique de confidentialité.");
    if (!consents.consentSensitive) return setError("Le consentement aux données de santé est obligatoire pour utiliser Weave.");

    // 2. Validations Formulaire
    if (formData.password !== formData.confirmPassword) return setError("Les mots de passe ne correspondent pas.");
    if (formData.phone.replace(/\s/g, '').length !== 10) return setError("Le numéro de téléphone est invalide.");

    // 3. Préparation des données
    // On combine Prénom + Nom si votre backend attend un champ "name" unique, 
    // sinon on envoie firstname/lastname tels quels.
    const { confirmPassword, ...dataFields } = formData;

    const payload = {
      ...dataFields,
      // Si le backend veut un champ "name" complet :
      name: `${formData.firstname} ${formData.lastname}`,
      preferences: {
        notifications: consents.acceptNotifications,
        marketing: consents.acceptCommunications,
      },
      legal: {
        cgu_accepted: true,
        privacy_accepted: true,
        sensitive_data_consent: true,
        accepted_at: new Date().toISOString()
      }
    };

    // 4. Appel API
    const resRegister = await register(payload);

    if (resRegister.success) {
      localStorage.removeItem('weave_onboarding_seen');
      const resLogin = await login(formData.email, formData.password);
      if (resLogin.success) {
        navigate('/select-circle');
      } else {
        navigate('/login');
      }
    } else {
      setError(resRegister.error || "Une erreur est survenue lors de l'inscription.");
    
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setError("");

    try {
      const { confirmPassword, ...dataToSend } = formData;
      
      // Now that AuthContext throws on error, this line will actually fail if 409/500 occurs
      await register(dataToSend); 

      // This will ONLY run if register succeeded
      // Navigate to the verification page and include the email as a query param.
      // The verify page will not auto-verify without a code; it will instruct the user
      // to check their inbox (prevents "Lien invalide" immediately after register).
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);

    } catch (err) {
      console.error("Registration Error:", err);
      // Handle the error (don't redirect)
      if (err.message?.includes("409") || err.message?.toLowerCase().includes("exist")) {
        setError("Cet email est déjà utilisé.");
      } else {
        setError(err.message || "Échec de l'inscription");
      }
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 py-8 relative" style={{ backgroundColor: 'var(--bg-primary)' }}>

      {/* ================= MODALE RGPD (Privacy Policy) ================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="p-4 border-b flex justify-between items-center rounded-t-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <FileText className="w-5 h-5" /> Politique de confidentialité
                </h3>
                <button onClick={() => setShowPrivacyModal(false)} style={{ color: 'var(--text-secondary)' }}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div
                className="p-6 overflow-y-auto flex-1 text-sm space-y-4 text-justify leading-relaxed"
                onScroll={handleScroll}
                style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
              >
              {!hasScrolledToBottom && (
                <div className="sticky top-0 p-3 mb-4 text-xs shadow-sm z-10" style={{ backgroundColor: 'rgba(167,201,167,0.08)', borderLeft: '4px solid var(--sage-green)', color: 'var(--sage-green)' }}>
                  ⬇️ Veuillez faire défiler ce document jusqu'en bas pour valider votre lecture.
                </div>
              )}

              <h4 className="font-bold text-gray-900 text-base">1. Préambule et Responsable de Traitement</h4>
              <p>
                La présente Politique de Confidentialité a pour but de vous informer sur la manière dont <strong>Weave</strong> collecte et traite vos données personnelles.
                En créant un compte, vous nous confiez des informations qui peuvent être sensibles. Nous nous engageons à les protéger conformément au Règlement Général sur la Protection des Données (RGPD) et à la Loi Informatique et Libertés.
              </p>

              <h4 className="font-bold text-gray-900 text-base">2. Nature des données collectées</h4>
              <p>
                Pour assurer le bon fonctionnement du service de coordination d'aide à domicile, nous collectons deux types de données :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Données administratives :</strong> Votre identité (Nom, Prénom), vos coordonnées (Email, Téléphone) et votre date de naissance (pour vérifier votre majorité).</li>
                <li><strong>Données de santé et de vie (Sensibles) :</strong> Dans le cadre du "Cercle de soins", des informations concernant l'humeur, les incidents de santé, les rendez-vous médicaux ou le suivi quotidien de la personne aidée peuvent être traitées.</li>
              </ul>
              <p className="bg-yellow-50 p-2 border border-yellow-200 rounded text-xs text-yellow-800 mt-2">
                ⚠️ <strong>Consentement Explicite :</strong> Conformément à l'article 9 du RGPD, le traitement de ces données sensibles ne se fait qu'avec votre consentement explicite, recueilli via la case à cocher lors de cette inscription.
              </p>

              <h4 className="font-bold text-gray-900 text-base">3. Finalités du traitement</h4>
              <p>
                Vos données ne sont utilisées que pour les objectifs suivants :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Coordination des aidants familiaux et professionnels autour de la personne aidée.</li>
                <li>Envoi de notifications importantes (alertes, rappels de rendez-vous).</li>
                <li>Gestion technique de votre compte et sécurité de l'accès.</li>
              </ul>
              <p>
                <strong>Nous ne revendons jamais vos données personnelles à des tiers.</strong> Elles ne sont utilisées à aucune fin publicitaire ou commerciale externe.
              </p>

              <h4 className="font-bold text-gray-900 text-base">4. Hébergement et Sécurité (HDS)</h4>
              <p>
                La sécurité de vos données est notre priorité absolue. Compte tenu de la nature sensible des informations traitées (santé), Weave s'engage à héberger l'ensemble des bases de données sur des serveurs certifiés <strong>Hébergement de Données de Santé (HDS)</strong>, situés physiquement en France ou dans l'Union Européenne.
              </p>
              <p className="text-xs text-gray-500 italic">
                la messagerie interne (chat) n'est pas chiffrée de bout en bout. Il est donc recommandé de ne pas y échanger de documents strictement confidentiels.
                le chiffrement de bout en bout sera implémenté dans une future mise à jour.
              </p>
              <p className="mt-2">
                <strong>Toutes les informations médicales et données de santé sont chiffrées</strong> dans nos bases de données pour garantir leur confidentialité totale. Les échanges avec le serveur sont également sécurisés (SSL/TLS).
              </p>
              <p>
                Toutes les communications entre votre appareil et nos serveurs sont chiffrées (protocole SSL/TLS).
              </p>

              <h4 className="font-bold text-gray-900 text-base">5. Partage des données</h4>
              <p>
                Vos données sont strictement confidentielles. Elles ne sont accessibles qu'aux :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Membres de votre "Cercle de soins" que vous avez invité ou rejoint volontairement.</li>
                <li>Équipes techniques de Weave (uniquement à des fins de maintenance et de sécurité, avec accès restreint et journalisé).</li>
              </ul>

              <h4 className="font-bold text-gray-900 text-base">6. Durée de conservation</h4>
              <p>
                Vos données sont conservées pendant toute la durée d'activité de votre compte.
                En cas de suppression de compte ou d'inactivité supérieure à 24 mois, vos données seront intégralement supprimées ou anonymisées de manière irréversible, sauf obligation légale contraire.
              </p>

              <h4 className="font-bold text-gray-900 text-base">7. Vos droits (Informatique et Libertés)</h4>
              <p>
                Conformément à la réglementation en vigueur, vous disposez des droits suivants sur vos données :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Droit d'accès et de rectification.</li>
                <li>Droit à l'effacement ("Droit à l'oubli").</li>
                <li>Droit à la limitation du traitement.</li>
                <li>Droit à la portabilité de vos données.</li>
                <li>Droit de retirer votre consentement à tout moment.</li>
              </ul>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse dédiée à la protection des données : <a href="mailto:weave.entreprise@gmail.com" className="text-blue-600 hover:underline">weave.entreprise@gmail.com@g
                </a>.
              </p>

              <h4 className="font-bold text-gray-900 text-base">8. Vos droits (Informatique et Libertés)</h4>
              <p>
                Conformément à la réglementation en vigueur, vous disposez des droits suivants sur vos données :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Droit d'accès et de rectification.</li>
                <li>Droit à l'effacement ("Droit à l'oubli").</li>
                <li>Droit à la limitation du traitement.</li>
                <li>Droit à la portabilité de vos données.</li>
                <li>Droit de retirer votre consentement à tout moment.</li>
              </ul>
              <p>
                Pour exercer ces droits, vous pouvez nous contacter à l'adresse dédiée à la protection des données : <a href="mailto:weave.entreprise@gmail.com " className="text-blue-600 hover:underline">weave.entreprise@gmail.com</a>.
              </p>

              <div className="pt-8 pb-4 text-center text-gray-400 text-xs uppercase tracking-widest border-t mt-6">
                --- Fin du document ---
              </div>
            </div>
            <div className="p-4 border-t rounded-b-xl flex justify-end gap-3" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
              <Button variant="outline" onClick={() => setShowPrivacyModal(false)}>Annuler</Button>
              <Button
                onClick={handleAcceptPrivacy}
                disabled={!hasScrolledToBottom}
                className="transition-all duration-300"
                style={hasScrolledToBottom ? { backgroundColor: 'var(--sage-green)', color: 'var(--text-inverse)' } : { backgroundColor: 'var(--border-input)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
              >
                {hasScrolledToBottom ? "J'accepte la politique" : "Lisez jusqu'en bas..."}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ================= CARTE D'INSCRIPTION ================= */}
      <Card className="w-full max-w-lg shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderTopColor: 'var(--sage-green)' }}>
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Créer mon compte</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* --- CHAMPS IDENTITÉ (Prénom / Nom) --- */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstname">Prénom *</Label>
                <Input id="firstname" name="firstname" required className="h-12" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} value={formData.firstname} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Nom *</Label>
                <Input id="lastname" name="lastname" required className="h-12" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} value={formData.lastname} onChange={handleChange} />
              </div>
            </div>

            {/* --- EMAIL --- */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required className="h-12" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} value={formData.email} onChange={handleChange} />
            </div>

            {/* --- TÉLÉPHONE & DATE DE NAISSANCE --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone" name="phone" type="tel" placeholder="06 12 34 56 78"
                  required className="h-12"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={formData.phone} onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance *</Label>
                <Input
                  id="birth_date" name="birth_date" type="date"
                  required className="h-12 block w-full"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={formData.birth_date} onChange={handleChange}
                />
              </div>
            </div>

            {/* --- MOT DE PASSE --- */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password" name="password" type={showPassword ? "text" : "password"}
                  required className="h-12 pr-12"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={formData.password} onChange={handleChange}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Min. 8 car., 1 majuscule, 1 chiffre, 1 spécial.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`h-12 pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={formData.confirmPassword} onChange={handleChange}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <hr className="my-4" style={{ borderColor: 'var(--border-light)' }} />

            {/* --- SECTION RGPD --- */}
            <div className="space-y-3 p-4 rounded-lg" style={{ backgroundColor: 'rgba(167,201,167,0.06)', border: '1px solid var(--border-light)' }}>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldCheck className="w-4 h-4" /> Consentements obligatoires
              </h3>

              {/* 1. CGU */}
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="acceptCGU" name="acceptCGU" checked={consents.acceptCGU} onChange={handleConsentChange} className="mt-1 h-4 w-4 rounded border-gray-300" />
                <label htmlFor="acceptCGU" className="text-sm" style={{ color: 'var(--text-primary)' }}>J'accepte les <Link to="/cgu" className="font-medium" style={{ color: 'var(--soft-coral)' }}>CGU</Link>.</label>
              </div>

              {/* 2. POLITIQUE DE CONFIDENTIALITÉ (Avec Scroll Wall) */}
              <div className="flex items-start space-x-3 p-2.5 rounded border shadow-sm relative" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <input
                  type="checkbox" id="acknowledgePrivacy" name="acknowledgePrivacy"
                  checked={consents.acknowledgePrivacy} disabled
                  className="mt-1 h-4 w-4 rounded disabled:opacity-50 cursor-not-allowed"
                />
                <div className="flex-1">
                  <label htmlFor="acknowledgePrivacy" className="text-sm block mb-1" style={{ color: 'var(--text-primary)' }}>
                    J'ai lu la politique de confidentialité. *
                  </label>
                  {!consents.acknowledgePrivacy ? (
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-xs px-3 py-1.5 rounded font-medium flex items-center gap-1 w-fit" style={{ backgroundColor: 'rgba(167,201,167,0.08)', color: 'var(--sage-green)' }}>
                      <Eye className="w-3 h-3" /> Lire pour valider
                    </button>
                  ) : (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Validé</span>
                  )}
                </div>
                {/* Overlay cliquable pour ouvrir la modale même si la checkbox est disabled */}
                {!consents.acknowledgePrivacy && <div className="absolute inset-0 cursor-pointer" onClick={() => setShowPrivacyModal(true)}></div>}
              </div>

              {/* 3. Données sensibles */}
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="consentSensitive" name="consentSensitive" checked={consents.consentSensitive} onChange={handleConsentChange} className="mt-1 h-4 w-4 rounded" />
                <label htmlFor="consentSensitive" className="text-sm" style={{ color: 'var(--text-primary)' }}>Je consens au traitement de mes <strong>données de santé</strong>.</label>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 text-lg font-bold shadow-md mt-4" style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)' }}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Créer mon compte"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-4 rounded-b-xl" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-light)' }}>
          <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Déjà inscrit ? <Link to="/login" className="font-bold" style={{ color: 'var(--soft-coral)' }}>Se connecter</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
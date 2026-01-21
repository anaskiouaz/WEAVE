import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, X, FileText } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, login, loading } = useAuth();
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-8 relative">

      {/* ================= MODALE RGPD (Privacy Policy) ================= */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50 rounded-t-xl">
              <h3 className="font-bold text-blue-900 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Politique de confidentialité
              </h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto flex-1 text-sm text-gray-700 space-y-4 bg-gray-50/30 text-justify leading-relaxed"
              onScroll={handleScroll}
            >
              {!hasScrolledToBottom && (
                <div className="sticky top-0 bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-xs text-blue-800 shadow-sm z-10">
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
            <div className="p-4 border-t bg-white rounded-b-xl flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPrivacyModal(false)}>Annuler</Button>
              <Button
                onClick={handleAcceptPrivacy}
                disabled={!hasScrolledToBottom}
                className={`transition-all duration-300 ${hasScrolledToBottom ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {hasScrolledToBottom ? "J'accepte la politique" : "Lisez jusqu'en bas..."}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ================= CARTE D'INSCRIPTION ================= */}
      <Card className="w-full max-w-lg shadow-xl border-t-6 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Créer mon compte</CardTitle>
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
                <Input id="firstname" name="firstname" required className="h-12 bg-white" value={formData.firstname} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Nom *</Label>
                <Input id="lastname" name="lastname" required className="h-12 bg-white" value={formData.lastname} onChange={handleChange} />
              </div>
            </div>

            {/* --- EMAIL --- */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required className="h-12 bg-white" value={formData.email} onChange={handleChange} />
            </div>

            {/* --- TÉLÉPHONE & DATE DE NAISSANCE --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone" name="phone" type="tel" placeholder="06 12 34 56 78"
                  required className="h-12 bg-white"
                  value={formData.phone} onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_date">Date de naissance *</Label>
                <Input
                  id="birth_date" name="birth_date" type="date"
                  required className="h-12 bg-white block w-full"
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
                  required className="h-12 bg-white pr-12"
                  value={formData.password} onChange={handleChange}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Min. 8 car., 1 majuscule, 1 chiffre, 1 spécial.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                  required
                  className={`h-12 bg-white pr-12 ${formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  value={formData.confirmPassword} onChange={handleChange}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <hr className="border-gray-200 my-4" />

            {/* --- SECTION RGPD --- */}
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4" /> Consentements obligatoires
              </h3>

              {/* 1. CGU */}
              <div className="flex items-start space-x-3">
                <input type="checkbox" id="acceptCGU" name="acceptCGU" checked={consents.acceptCGU} onChange={handleConsentChange} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <label htmlFor="acceptCGU" className="text-sm text-gray-700">J'accepte les <Link to="/cgu" className="text-blue-700 underline font-medium">CGU</Link>.</label>
              </div>

              {/* 2. POLITIQUE DE CONFIDENTIALITÉ (Avec Scroll Wall) */}
              <div className="flex items-start space-x-3 bg-white p-2.5 rounded border border-blue-200 shadow-sm relative">
                <input
                  type="checkbox" id="acknowledgePrivacy" name="acknowledgePrivacy"
                  checked={consents.acknowledgePrivacy} disabled
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 disabled:opacity-50 cursor-not-allowed"
                />
                <div className="flex-1">
                  <label htmlFor="acknowledgePrivacy" className="text-sm text-gray-700 block mb-1">
                    J'ai lu la politique de confidentialité. *
                  </label>
                  {!consents.acknowledgePrivacy ? (
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-medium hover:bg-blue-200 flex items-center gap-1 w-fit">
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
                <input type="checkbox" id="consentSensitive" name="consentSensitive" checked={consents.consentSensitive} onChange={handleConsentChange} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                <label htmlFor="consentSensitive" className="text-sm text-gray-700">Je consens au traitement de mes <strong>données de santé</strong>.</label>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 text-lg font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md mt-4">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Créer mon compte"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-4 bg-gray-50/50 rounded-b-xl border-t border-gray-100">
          <p className="text-base text-gray-600">Déjà inscrit ? <Link to="/login" className="font-bold text-blue-700 hover:underline">Se connecter</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
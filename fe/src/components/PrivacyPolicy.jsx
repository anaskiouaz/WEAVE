import { ArrowLeft, Shield, Cookie, Database, Lock, Mail, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Shield,
      title: "Qui sommes-nous ?",
      content: `Weave est une application d'entraide familiale et communautaire. 
      Nous nous engageons à protéger vos données personnelles conformément au Règlement Général 
      sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.`
    },
    {
      icon: Database,
      title: "Quelles données collectons-nous ?",
      content: `Nous collectons les données suivantes :
      • Informations d'identification : nom, prénom, adresse email
      • Informations de contact : numéro de téléphone, adresse postale (optionnel)
      • Données de connexion : historique de connexion, adresse IP
      • Contenus : messages, souvenirs, photos partagées au sein de vos cercles
      • Préférences : disponibilités, compétences, paramètres de notification`
    },
    {
      icon: Lock,
      title: "Comment utilisons-nous vos données ?",
      content: `Vos données sont utilisées pour :
      • Fournir et améliorer nos services d'entraide
      • Gérer votre compte et vos cercles familiaux
      • Vous envoyer des notifications (si vous l'avez autorisé)
      • Assurer la sécurité de la plateforme
      • Respecter nos obligations légales
      
      Nous ne vendons jamais vos données à des tiers.`
    },
    {
      icon: Cookie,
      title: "Utilisation des cookies",
      content: `Nous utilisons différents types de cookies :
      
      Cookies essentiels (obligatoires) :
      • Authentification et session utilisateur
      • Sécurité et prévention de la fraude
      • Préférences de base (langue, thème)
      
      Cookies analytiques (optionnels) :
      • Mesure d'audience anonymisée
      • Amélioration de l'expérience utilisateur
      
      Cookies marketing (optionnels) :
      • Personnalisation des contenus
      • Communications ciblées
      
      Vous pouvez modifier vos préférences de cookies à tout moment depuis votre profil.`
    },
    {
      icon: Clock,
      title: "Durée de conservation",
      content: `Vos données sont conservées :
      • Données de compte : tant que votre compte est actif
      • Messages et souvenirs : jusqu'à suppression par l'utilisateur
      • Logs de connexion : 12 mois
      • Cookies : selon leur catégorie (session à 13 mois maximum)
      
      Après suppression de votre compte, vos données sont effacées sous 30 jours.`
    },
    {
      icon: Shield,
      title: "Vos droits",
      content: `Conformément au RGPD, vous disposez des droits suivants :
      • Droit d'accès : obtenir une copie de vos données
      • Droit de rectification : corriger vos données inexactes
      • Droit à l'effacement : supprimer vos données
      • Droit à la portabilité : récupérer vos données dans un format standard
      • Droit d'opposition : vous opposer au traitement de vos données
      • Droit de limitation : restreindre le traitement de vos données
      
      Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.`
    },
    {
      icon: Mail,
      title: "Nous contacter",
      content: `Pour toute question relative à vos données personnelles :
      
      Email : privacy@weave-app.fr
      
      Vous pouvez également adresser une réclamation à la CNIL :
      Commission Nationale de l'Informatique et des Libertés
      3 Place de Fontenoy - TSA 80715
      75334 PARIS CEDEX 07
      www.cnil.fr`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white" style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)' }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Politique de confidentialité</h1>
              <p className="text-blue-100 mt-1">Dernière mise à jour : Janvier 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <p className="text-blue-800">
            <strong>En résumé :</strong> Weave collecte uniquement les données nécessaires au 
            fonctionnement du service. Vos données restent privées et ne sont jamais vendues. 
            Vous gardez le contrôle total sur vos informations.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, content }, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>© 2026 Weave - Tous droits réservés</p>
          <p className="mt-1">
            Cette politique de confidentialité peut être mise à jour. 
            Nous vous informerons de tout changement significatif.
          </p>
        </div>
      </div>
    </div>
  );
}

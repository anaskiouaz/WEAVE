import { ArrowLeft, Building, Server, User, FileText, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LegalNotice() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Building,
      title: "Éditeur du site",
      content: `Weave
      
      Adresse : IUT 2 Grenoble Alpes 
      Email : contact@weave-app.fr
      Téléphone : XX XX XX XX XX
      
      Directeur de la publication : Weave Team
      
      
      `
    },
    {
      icon: Server,
      title: "Hébergement",
      content: `Le site est hébergé par :
      
      Azure Microsoft
      Adresse : Paris 17ème, 8 Rue de Londres, 75009 Paris, France
      Téléphone : XX XX XX XX XX
      
      Les données sont stockées sur des serveurs sécurisés situés dans l'Union Européenne.`
    },
    {
      icon: FileText,
      title: "Propriété intellectuelle",
      content: `L'ensemble du contenu de ce site (textes, images, logos, icônes, sons, logiciels, etc.) 
      est la propriété exclusive de Weave ou de ses partenaires et est protégé par les lois 
      françaises et internationales relatives à la propriété intellectuelle.
      
      Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
      des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, 
      sauf autorisation écrite préalable de Weave.
      
      Les marques et logos figurant sur le site sont des marques déposées. Toute reproduction 
      totale ou partielle de ces marques sans autorisation est prohibée.`
    },
    {
      icon: User,
      title: "Données personnelles",
      content: `Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi 
      Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez de droits sur vos 
      données personnelles.
      
      Pour plus d'informations sur le traitement de vos données et exercer vos droits, 
      consultez notre Politique de confidentialité.
      
      Délégué à la Protection des Données (DPO) :
      Email : weave@weave-app.fr`
    },
    {
      icon: Scale,
      title: "Responsabilité",
      content: `Weave s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées 
      sur ce site. Toutefois, Weave ne peut garantir l'exactitude, la précision ou l'exhaustivité 
      des informations mises à disposition.
      
      Weave décline toute responsabilité :
      • Pour toute imprécision, inexactitude ou omission portant sur les informations
      • Pour tous dommages résultant d'une intrusion frauduleuse d'un tiers
      • Pour tout dommage causé à l'utilisateur, à des tiers ou à leur équipement
      
      L'utilisateur est seul responsable de l'utilisation qu'il fait des informations et 
      contenus présents sur le site.`
    },
    {
      icon: Scale,
      title: "Droit applicable",
      content: `Les présentes mentions légales sont régies par le droit français.
      
      En cas de litige, et après tentative de recherche d'une solution amiable, 
      compétence est attribuée aux tribunaux français compétents.
      
      Pour toute question relative aux présentes mentions légales, vous pouvez 
      nous contacter à l'adresse : weave@weave-app.fr`
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="text-white" style={{ background: 'linear-gradient(135deg, var(--soft-coral) 0%, #E06B6B 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 py-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Retour</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-sm">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mentions légales</h1>
              <p className="text-white/80 mt-1 font-medium">Informations légales obligatoires</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, content }, index) => (
            <div 
              key={index}
              className="rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="p-2.5 rounded-xl flex-shrink-0"
                  style={{ backgroundColor: 'rgba(167, 201, 167, 0.15)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--sage-green)' }} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h2>
                  <div className="whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 text-center text-sm" style={{ borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
          <p>© 2026 Weave - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}

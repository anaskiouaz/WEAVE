import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Heart, ShieldCheck, Users, Cookie, Calendar, MessageSquare, Bell, ClipboardList, Sparkles, ArrowRight } from 'lucide-react';
import { useCookieConsent } from '../context/CookieContext';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const { openPreferences } = useCookieConsent();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center font-sans overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Hero Section avec animation de parallaxe */}
      <section className="w-full min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--soft-coral) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.3}px)`
          }}
        />
        
        <main className="w-full max-w-5xl flex flex-col items-center text-center gap-10 z-10">
          
          {/* Titre avec animation de fade-in */}
          <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--soft-coral)' }}>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Plateforme d'entraide collaborative</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
              Bienvenue sur <span style={{ color: 'var(--soft-coral)' }}>Weave</span>
            </h1>
            <p className="text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              La plateforme d'entraide bienveillante pour coordonner le soin de vos proches en toute sérénité.
            </p>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Organisez les soins, partagez les moments précieux et restez connectés avec votre cercle de proches et professionnels de santé.
            </p>
          </div>

          {/* Boutons d'action avec animations au hover */}
          <div className="grid gap-6 w-full max-w-md mt-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <Link to="/register" className="w-full group">
              <Button size="lg" className="w-full h-16 text-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl relative overflow-hidden" style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)' }}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Commencer ici
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Button>
            </Link>
            
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid var(--border-medium)' }} /></div>
              <div className="relative flex justify-center"><span className="px-4 text-lg uppercase font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Ou</span></div>
            </div>

            <Link to="/login" className="w-full group">
              <Button variant="outline" size="lg" className="w-full h-16 text-xl border-2 rounded-xl hover:shadow-lg transition-all duration-300" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-card)' }}>
                Je me connecte
              </Button>
            </Link>
          </div>
        </main>
      </section>

      {/* Section "Comment ça marche" avec captures d'écran */}
      <section className="w-full py-20 px-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>
            Comment ça marche ?
          </h2>
          <p className="text-xl text-center mb-16 max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Découvrez les fonctionnalités qui facilitent la coordination des soins au quotidien
          </p>

          <div className="space-y-24">
            {/* Feature 1: Dashboard */}
            <FeatureShowcase
              title="Tableau de bord centralisé"
              description="Visualisez en un coup d'œil l'activité de votre cercle : aidants actifs, tâches à venir, souvenirs partagés et messages non lus. Tout ce dont vous avez besoin pour rester informé et coordonné."
              features={[
                "Vue d'ensemble des aidants actifs",
                "Suivi des tâches de la semaine",
                "Accès rapide aux souvenirs partagés",
                "Notifications de messages en temps réel"
              ]}
              image="/Capture Ecran1.png"
              reverse={false}
              icon={ClipboardList}
            />

            {/* Feature 2: Calendar */}
            <FeatureShowcase
              title="Calendrier partagé intelligent"
              description="Organisez et coordonnez facilement toutes les interventions, rendez-vous médicaux et visites. Chaque membre du cercle peut voir qui s'occupe de quoi et quand."
              features={[
                "Vue mensuelle claire et intuitive",
                "Ajout rapide de nouvelles tâches",
                "Synchronisation en temps réel",
                "Rappels automatiques pour les événements"
              ]}
              image="/Capture Ecran2.png"
              reverse={true}
              icon={Calendar}
            />

            {/* Feature 3: Administration */}
            <FeatureShowcase
              title="Gestion du cercle simplifiée"
              description="Invitez facilement des proches et professionnels de santé dans votre cercle. Gérez les permissions et gardez tout le monde informé avec un simple code d'accès."
              features={[
                "Code d'accès unique pour inviter des membres",
                "Gestion des rôles (Admin, Bénéficiaire, Aidant)",
                "Vue complète des membres actifs",
                "Historique des actions récentes"
              ]}
              image="/Capture Ecran3.png"
              reverse={false}
              icon={Users}
            />
          </div>
        </div>
      </section>

      {/* Section des arguments de réassurance avec animations */}
      <section className="w-full py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
            Pourquoi choisir Weave ?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 w-full">
            <FeatureCard 
              icon={Heart} 
              title="Bienveillance" 
              desc="Un espace pensé pour le soin, l'écoute et le respect de vos proches."
              delay="0"
            />
            <FeatureCard 
              icon={Users} 
              title="Communauté" 
              desc="Coordonnez facilement l'aide avec votre famille et les professionnels de santé."
              delay="150"
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Sécurité" 
              desc="Vos données et celles de vos proches sont protégées avec les plus hauts standards."
              delay="300"
            />
            <FeatureCard 
              icon={Calendar} 
              title="Organisation" 
              desc="Planifiez et synchronisez toutes les interventions en temps réel."
              delay="0"
            />
            <FeatureCard 
              icon={MessageSquare} 
              title="Communication" 
              desc="Échangez facilement avec tous les membres de votre cercle de soin."
              delay="150"
            />
            <FeatureCard 
              icon={Bell} 
              title="Notifications" 
              desc="Restez informé des événements importants et des mises à jour."
              delay="300"
            />
          </div>
        </div>
      </section>

      {/* Call to Action final */}
      <section className="w-full py-20 px-6" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Prêt à simplifier la coordination des soins ?
          </h2>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Rejoignez Weave aujourd'hui et découvrez une nouvelle façon de prendre soin de vos proches ensemble.
          </p>
          <Link to="/register" className="inline-block group">
            <Button size="lg" className="h-16 px-12 text-xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl" style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)' }}>
              <span className="flex items-center gap-2">
                Créer mon cercle gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-16 pt-8 px-6" style={{ borderTop: '1px solid var(--border-medium)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm pb-8" style={{ color: 'var(--text-secondary)' }}>
          <p>© 2026 Weave - Tous droits réservés</p>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/mentions-legales" 
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Mentions légales
            </Link>
            <Link 
              to="/politique-confidentialite" 
              className="transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              Confidentialité
            </Link>
            <button 
              onClick={openPreferences}
              className="flex items-center gap-1.5 transition-colors hover:opacity-80"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Cookie size={14} />
              Cookies
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <div 
      className="group animate-in fade-in slide-in-from-bottom-4 duration-700"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Card className="border-none shadow-sm backdrop-blur-sm h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2" style={{ backgroundColor: 'var(--bg-card)' }}>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
          <div className="p-3 rounded-full transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--soft-coral)' }}>
            <Icon className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-lg leading-normal" style={{ color: 'var(--text-secondary)' }}>{desc}</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureShowcase({ title, description, features, image, reverse, icon: Icon }) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
      {/* Contenu texte */}
      <div className="flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--soft-coral)' }}>
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium">Fonctionnalité</span>
        </div>
        
        <h3 className="text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        
        <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1 rounded-full p-1" style={{ backgroundColor: 'var(--soft-coral)' }}>
                <svg className="w-3 h-3" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-base" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Image avec effet de hover */}
      <div className="flex-1 group">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <img 
            src={image} 
            alt={title}
            className="w-full h-auto rounded-2xl"
            style={{ border: '1px solid var(--border-medium)' }}
          />
        </div>
      </div>
    </div>
  );
}
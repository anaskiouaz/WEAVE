import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Heart, ShieldCheck, Users, Cookie } from 'lucide-react';
import { useCookieConsent } from '../context/CookieContext';

export default function LandingPage() {
  const { openPreferences } = useCookieConsent();

  return (
    <div className="min-h-screen flex flex-col items-center p-6 font-sans" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <main className="w-full max-w-5xl flex flex-col items-center text-center gap-10 animate-in fade-in duration-700 flex-1 justify-center">
        
        {/* Titre et Accroche */}
        <div className="space-y-6 mt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            Bienvenue sur Weave
          </h1>
          <p className="text-2xl max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            La plateforme d'entraide bienveillante pour coordonner le soin de vos proches en toute sérénité.
          </p>
        </div>

        {/* Boutons d'action (Très gros pour l'accessibilité) */}
        <div className="grid gap-6 w-full max-w-md mt-4">
          <Link to="/register" className="w-full">
            <Button size="lg" className="w-full h-16 text-2xl font-bold shadow-xl hover:-translate-y-1 transition-all rounded-xl" style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)' }}>
              Commencer ici
            </Button>
          </Link>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full" style={{ borderTop: '1px solid var(--border-medium)' }} /></div>
            <div className="relative flex justify-center"><span className="px-4 text-lg uppercase font-medium" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>Ou</span></div>
          </div>

          <Link to="/login" className="w-full">
            <Button variant="outline" size="lg" className="w-full h-16 text-xl border-2 rounded-xl" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-input)', backgroundColor: 'var(--bg-card)' }}>
              Je me connecte
            </Button>
          </Link>
        </div>

        {/* Arguments de réassurance */}
        <div className="grid md:grid-cols-3 gap-8 w-full mt-12 text-left">
          <FeatureCard icon={Heart} title="Bienveillance" desc="Un espace pensé pour le soin, l'écoute et le respect." />
          <FeatureCard icon={Users} title="Communauté" desc="Coordonnez facilement l'aide avec votre famille et les pros." />
          <FeatureCard icon={ShieldCheck} title="Sécurité" desc="Vos données et celles de vos proches sont protégées." />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-16 pt-8" style={{ borderTop: '1px solid var(--border-medium)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
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

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <Card className="border-none shadow-sm backdrop-blur-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--soft-coral)' }}><Icon className="w-8 h-8" /></div>
        <CardTitle className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-lg leading-normal" style={{ color: 'var(--text-secondary)' }}>{desc}</CardDescription>
      </CardContent>
    </Card>
  );
}
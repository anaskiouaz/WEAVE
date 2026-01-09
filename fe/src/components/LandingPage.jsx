import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Heart, ShieldCheck, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col items-center justify-center p-6 font-sans">
      <main className="w-full max-w-5xl flex flex-col items-center text-center gap-10 animate-in fade-in duration-700">
        
        {/* Titre et Accroche */}
        <div className="space-y-6 mt-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-900 tracking-tight leading-tight">
            Bienvenue sur Weave
          </h1>
          <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            La plateforme d'entraide bienveillante pour coordonner le soin de vos proches en toute sérénité.
          </p>
        </div>

        {/* Boutons d'action (Très gros pour l'accessibilité) */}
        <div className="grid gap-6 w-full max-w-md mt-4">
          <Link to="/register" className="w-full">
            <Button size="lg" className="w-full h-16 text-2xl font-bold bg-blue-700 hover:bg-blue-800 shadow-xl hover:-translate-y-1 transition-all rounded-xl text-white">
              Commencer ici
            </Button>
          </Link>
          
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center"><span className="bg-blue-50/50 px-4 text-gray-500 text-lg uppercase font-medium">Ou</span></div>
          </div>

          <Link to="/login" className="w-full">
            <Button variant="outline" size="lg" className="w-full h-16 text-xl text-blue-900 border-2 border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-300 rounded-xl">
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
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <Card className="border-none shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className="p-3 bg-blue-100 rounded-full text-blue-700"><Icon className="w-8 h-8" /></div>
        <CardTitle className="text-xl font-bold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-lg text-gray-700 leading-normal">{desc}</CardDescription>
      </CardContent>
    </Card>
  );
}
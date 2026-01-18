import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // On importe le contexte d'auth
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
// Imports ajoutés pour la Pop-up
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

  // On récupère login, loading, MAIS AUSSI user et logout pour la vérification
  const { login, loading, user, logout } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  
  // Nouvel état pour gérer l'affichage de la popup
  const [showDialog, setShowDialog] = useState(false);

  // --- LOGIQUE AJOUTÉE : Vérifier si l'utilisateur est déjà connecté ---
  useEffect(() => {
    if (user) {
      setShowDialog(true);
    }
  }, [user]);

  const handleContinue = () => {
    // Redirige vers la page d'accueil ou de sélection de cercle
    navigate('/select-circle'); 
  };

  const handleLogout = () => {
    logout(); // On déconnecte l'utilisateur
    setShowDialog(false); // On ferme la popup
    // Le formulaire reste affiché pour qu'il puisse se reconnecter avec un autre compte
  };
  // -------------------------------------------------------------------

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await res.json();

        if (result.success) {
            // 1. On sauvegarde le token et le user
            login(result.token, result.user);

            // 2. 🛑 ON FORCE LE PASSAGE PAR LA SÉLECTION 🛑
            // C'est ça qui va réparer ton bouton Admin.
            // On ne réfléchit pas, on va choisir son cercle.
            window.location.href = '/select-circle';

        } else {
            setError(result.error || "Email ou mot de passe incorrect.");
        }
    } catch (err) {
        console.error(err);
        setError("Impossible de contacter le serveur.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      
      {/* --- POPUP (S'affiche uniquement si showDialog est true) --- */}
      {/* mettre le popup au milieu de l'écran */}
      <AlertDialog open={showDialog} className="fixed inset-0 flex items-center justify-center z-50">
          <AlertDialogContent className="bg-white fixed top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle>Session déjà active</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes déjà connecté en tant que <strong>{user?.email}</strong>.
              <br />
              Que souhaitez-vous faire ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogout}>
              Se déconnecter
            </AlertDialogCancel>
          
            <AlertDialogAction onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700 text-white">
              Continuer avec ce compte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --------------------------------------------------------- */}

      <Card className="w-full max-w-lg shadow-xl border-t-4 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Se connecter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {error && (
              <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm font-medium border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="h-14 text-lg bg-white"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-lg font-semibold">Mot de passe</Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-14 text-lg bg-white"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full h-16 text-xl font-bold bg-blue-700 hover:bg-blue-800 mt-4 shadow-md text-white"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Me connecter"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl">
          <p className="text-lg">Pas de compte ? <Link to="/register" className="font-bold text-blue-700 hover:underline">S'inscrire</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
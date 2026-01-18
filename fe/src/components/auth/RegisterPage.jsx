import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2, AlertCircle, User, Mail, Lock } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function RegisterPage() {
  // On récupère 'login' pour sauvegarder la session une fois l'inscription réussie
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validation basique
    if (formData.password !== formData.confirmPassword) {
        return setError("Les mots de passe ne correspondent pas.");
    }
    if (formData.password.length < 6) {
        return setError("Le mot de passe doit faire au moins 6 caractères.");
    }

    setLoading(true);

    try {
        // 2. Appel API direct (C'est ici qu'on remplace l'ancienne fonction 'register')
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                password: formData.password
            })
        });

        const result = await res.json();

        if (result.success) {
            // 3. Succès : On connecte l'utilisateur immédiatement
            login(result.token, result.user);

            // 4. Redirection vers la sélection de cercle
            window.location.href = '/select-circle';
        } else {
            // Erreur API (ex: Email déjà pris)
            setError(result.error || "Erreur lors de l'inscription.");
        }
    } catch (err) {
        console.error("Erreur Register:", err);
        setError("Impossible de contacter le serveur.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/login" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour connexion
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Créer un compte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm font-medium border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Jean Dupont"
                  className="pl-10 h-12"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@exemple.com"
                  className="pl-10 h-12"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  className="pl-10 h-12"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  className="pl-10 h-12"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full h-14 text-lg font-bold bg-blue-700 hover:bg-blue-800 mt-6 shadow-md"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "S'inscrire"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl">
          <p className="text-gray-600">Déjà un compte ? <Link to="/login" className="font-bold text-blue-700 hover:underline">Se connecter</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
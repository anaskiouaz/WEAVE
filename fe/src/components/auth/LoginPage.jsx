import { useState } from 'react';
import { Link } from 'react-router-dom'; // J'ai enlevé useNavigate car on utilise window.location
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export default function LoginPage() {
  const { login } = useAuth(); // On récupère juste login

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
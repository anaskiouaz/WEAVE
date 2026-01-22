import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // On importe le contexte d'auth
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  // On récupère la vraie fonction de login et l'état de chargement
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Appel au Backend via le Contexte
    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Si le backend dit "OK", on redirige
      navigate('/select-circle');
    } else {
      // Sinon, on affiche l'erreur (ex: "Mot de passe incorrect")
      setError(result.error || "Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Card className="w-full max-w-lg shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderTopColor: 'var(--sage-green)' }}>
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-secondary mb-4" style={{ color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour
          </Link>
          <CardTitle className="text-3xl font-bold text-primary" style={{ color: 'var(--text-primary)' }}>Se connecter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Zone d'affichage des erreurs */}
            {error && (
              <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm font-medium border border-red-200">
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
                className="h-14 text-lg"
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password" className="text-lg font-semibold">Mot de passe</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="h-14 text-lg pr-12"
                  style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full h-16 text-xl font-bold mt-4 shadow-md"
              style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)' }}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Me connecter"}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 rounded-b-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Pas de compte ? <Link to="/register" className="font-bold" style={{ color: 'var(--soft-coral)' }}>S'inscrire</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
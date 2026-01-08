import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // On importe le contexte d'auth
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  
  // On récupère la vraie fonction de login et l'état de chargement
  const { login, loading } = useAuth(); 
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Appel au Backend via le Contexte
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Si le backend dit "OK", on redirige
      navigate('/dashboard'); 
    } else {
      // Sinon, on affiche l'erreur (ex: "Mot de passe incorrect")
      setError(result.error || "Email ou mot de passe incorrect.");
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
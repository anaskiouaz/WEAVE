import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth(); // Assume login function is here
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1. Perform Login
      await login(formData);

      // 2. CHECK FOR PENDING INVITE (The Magic Step)
      const pendingCode = localStorage.getItem('pendingInviteCode');

      if (pendingCode) {
        console.log("Found pending invite. Redirecting to Join...");
        // Redirect back to the Join Handler to finish the job
        navigate(`/join?code=${pendingCode}`);
      } else {
        // Normal Flow
        navigate('/dashboard');
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError("Email ou mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-t-4 border-blue-600">
        <CardHeader className="space-y-2 pb-6">
          <Link to="/" className="flex items-center text-lg text-gray-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-6 h-6 mr-2" /> Retour à l'accueil
          </Link>
          <CardTitle className="text-3xl font-bold text-blue-900">Connexion</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 text-red-700 bg-red-100 rounded-lg text-base font-medium border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-semibold text-gray-800">Email</Label>
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
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-lg font-semibold text-gray-800">Mot de passe</Label>
                <Link to="/forgot-password" className="text-base text-blue-600 hover:underline">Oublié ?</Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="h-14 text-lg bg-white pr-12"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-2"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={loading} className="w-full h-16 text-xl font-bold bg-blue-700 hover:bg-blue-800 mt-6 shadow-md text-white">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Se connecter"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl">
          <p className="text-lg">Pas encore de compte ? <Link to="/register" className="font-bold text-blue-700 hover:underline">S'inscrire</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
}
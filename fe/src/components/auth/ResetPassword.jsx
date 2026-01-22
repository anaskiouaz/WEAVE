import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { apiPost } from '../../api/client';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!token) return <div className="text-center p-10">Lien invalide ou manquant.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    
    setLoading(true);
    try {
      await apiPost('/auth/reset-password', { token, newPassword: password });
      alert("Mot de passe modifié ! Connectez-vous.");
      navigate('/login');
    } catch (err) {
      setError(err.message || "Le lien a expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-blue-600">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Nouveau mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input 
                type={showPass ? "text" : "password"} 
                placeholder="Nouveau mot de passe" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-gray-400">
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <Input 
              type="password" 
              placeholder="Confirmer le mot de passe" 
              required 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            <Button type="submit" className="w-full bg-blue-600 text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Réinitialiser"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
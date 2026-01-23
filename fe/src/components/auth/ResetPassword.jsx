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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Card className="w-full max-w-md shadow-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderTop: '4px solid var(--soft-coral)' }}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Nouveau mot de passe</CardTitle>
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
                style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3" style={{ color: 'var(--text-secondary)' }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <Input 
              type="password" 
              placeholder="Confirmer le mot de passe" 
              required 
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
            />
            {error && <p className="text-sm p-2 rounded" style={{ color: 'var(--danger)', backgroundColor: 'rgba(240,128,128,0.06)' }}>{error}</p>}
            <button type="submit" className="w-full rounded-md py-3 font-semibold" style={{ backgroundColor: 'var(--soft-coral)', color: 'white', border: 'none' }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Réinitialiser"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
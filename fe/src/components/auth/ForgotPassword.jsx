import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { apiPost } from '../../api/client'; // Uses your existing client

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await apiPost('/auth/forgot-password', { email });
      setMessage("Si un compte existe avec cet email, un lien vous a été envoyé.");
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-blue-600 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour connexion
          </Link>
          <CardTitle className="text-2xl font-bold text-center">Mot de passe oublié ?</CardTitle>
        </CardHeader>
        <CardContent>
          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
              <div>
                <Input 
                  type="email" 
                  placeholder="votre@email.com" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Envoyer le lien"}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-green-800 font-medium">{message}</p>
              <p className="text-sm text-gray-500">Vérifiez vos spams si vous ne le recevez pas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
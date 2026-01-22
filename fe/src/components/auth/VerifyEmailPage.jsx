import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const code = searchParams.get('code');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verify = async () => {
      // 1. Basic Validation
      if (!code || !email) {
        setStatus('error'); 
        return; 
      }

      try {
        // 2. Call API
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        // 3. Success! (No auto-login, no auto-redirect. Just Success.)
        setStatus('success');

      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    verify();
  }, [code, email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-sm w-full text-center border border-gray-100">
        
        {status === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Vérification en cours...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Compte vérifié !</h2>
            <p className="text-gray-600 mb-6">Votre email a été confirmé avec succès.</p>
            
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-gray-600 mb-4">Le lien a expiré ou est malformé.</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
}
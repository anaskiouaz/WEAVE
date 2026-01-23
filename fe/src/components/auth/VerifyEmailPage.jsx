import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const code = searchParams.get('code');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error, need_code
  const [codeInput, setCodeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const verify = async () => {
      // 1. Basic Validation
      // If there's no code but an email is present, show the 'check your email' screen
      if (!code && email) {
        setStatus('need_code');
        return;
      }

      if (!code || !email) {
        setStatus('error');
        return;
      }

      try {
        // 2. Call API (use fallback if VITE_API_BASE_URL is not set)
        const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
        const response = await fetch(`${API_BASE}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        });

        // parse JSON safely (handle empty or non-JSON responses)
        let data = null;
        try { data = await response.json(); } catch (e) { data = { error: response.statusText || 'Empty response' }; }
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);

        // 3. Success! Redirect to select-circle (or to login with next)
        setStatus('success');
        // If user already has a token, go straight to select-circle
        const token = localStorage.getItem('weave_token');
        if (token) {
          navigate('/select-circle');
        } else {
          navigate('/login?next=/select-circle');
        }

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
              onClick={() => navigate('/join')}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Rejoindre un cercle
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
          {status === 'need_code' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Entrez le code de vérification</h2>
              <p className="text-gray-600 mb-4">Nous avons envoyé un code à <strong>{email}</strong>. Saisissez-le ci‑dessous :</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Code à 6 chiffres"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-lg text-center"
                />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!codeInput || codeInput.trim().length === 0) return;
                      setSubmitting(true);
                      try {
                        const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
                        const response = await fetch(`${API_BASE}/auth/verify-email`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, code: codeInput.trim() })
                        });
                        let data = null;
                        try { data = await response.json(); } catch (e) { data = { error: response.statusText || 'Empty response' }; }
                        if (!response.ok) throw new Error(data.error || 'Erreur');
                        setStatus('success');
                        const token = localStorage.getItem('weave_token');
                      navigate('/login');
                      } catch (err) {
                        console.error(err);
                        setStatus('error');
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
                    disabled={submitting}
                  >
                    {submitting ? 'Vérification...' : 'Vérifier le code'}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming you have this

const JoinCircle = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth(); // specific to your auth implementation
  
  const urlCode = searchParams.get('code');
  
  const [status, setStatus] = useState('idle'); // idle, checking, joining, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const performAutoJoin = async () => {
      if (!urlCode) return;

      // 1. If User is NOT logged in:
      const token = localStorage.getItem('weave_token'); // Or however you store it
      if (!token) {
        // SAVE the code for later so we don't lose it during login/signup
        localStorage.setItem('pendingInviteCode', urlCode);
        
        // Redirect to Signup (invites are usually for new users) 
        // passing a 'redirect' param to come back here
        navigate(`/signup?redirect=/join`); 
        return;
      }

      // 2. If User IS logged in, execute the Join immediately
      setStatus('joining');
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/circles/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ invite_code: urlCode })
        });

        const data = await response.json();

        if (!response.ok) {
           // Handle specific case: Already a member
           if(data.error && data.error.includes("déjà")) {
             setMessage("Vous êtes déjà membre de ce cercle !");
             setStatus('success'); // Treat as success for UX
             setTimeout(() => navigate('/dashboard'), 2000);
             return;
           }
           throw new Error(data.error || "Erreur inconnue");
        }

        // SUCCESS
        setStatus('success');
        setMessage(`Bienvenue dans le cercle de ${data.circle_name} !`);
        
        // Clear any pending code
        localStorage.removeItem('pendingInviteCode');

        // Redirect to dashboard after short delay
        setTimeout(() => navigate('/dashboard'), 2000);

      } catch (err) {
        setStatus('error');
        setMessage(err.message);
      }
    };

    performAutoJoin();
  }, [urlCode, navigate, user]);

  // --- UI RENDER ---

  if (status === 'joining') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800">Ajout au cercle en cours...</h2>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">C'est fait !</h2>
          <p className="text-lg text-gray-600">{message}</p>
        </div>
      </div>
    );
  }

  // Fallback / Error UI (allows manual entry if auto failed)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
       <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
         <h1 className="text-2xl font-bold text-center mb-6">Rejoindre un Cercle</h1>
         {status === 'error' && (
           <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 text-center">
             {message}
           </div>
         )}
         {/* ... (Keep your existing manual form here as backup) ... */}
       </div>
    </div>
  );
};

export default JoinCircle;
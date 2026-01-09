import { useEffect, useState } from 'react';
import { Calendar, Heart, MessageSquare, Users, Clock } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiPost } from '../api/client';

export default function Dashboard() {
  const [debugLog, setDebugLog] = useState("En attente d'action...");

  // Fonction pour ajouter des logs à l'écran
  const log = (msg) => {
    console.log(msg);
    setDebugLog(prev => prev + "\n" + msg);
  };

  const activerNotifs = async () => {
    log("--- Démarrage Activer Notifs ---");
    try {
        const storedUser = localStorage.getItem('user');
        const userId = storedUser ? JSON.parse(storedUser).id : null;

        await PushNotifications.removeAllListeners(); 

        await PushNotifications.addListener('registration', async (token) => {
            log(`✅ EVENT REÇU ! Token: ${token.value.substring(0, 6)}...`);
            try {
                // CORRECTION ICI : On enlève le "/api" au début
                // Si apiPost ajoute déjà la base URL, ceci devrait suffire :
                await apiPost('/users/device-token', { userId, token: token.value });
                
                log("🚀 Token envoyé au serveur avec SUCCÈS !");
                alert("SUCCÈS TOTAL ! Vous pouvez tester.");
            } catch (err) {
                // Si ça rate encore, essayons sans le slash du tout, au cas où
                try {
                    console.log("Tentative alternative...");
                    await apiPost('users/device-token', { userId, token: token.value });
                } catch (e2) {
                     log(`❌ Erreur API (Double check): ${err.message}`);
                }
            }
        });

        await PushNotifications.addListener('registrationError', (error) => {
            log(`❌ ERREUR FIREBASE: ${JSON.stringify(error)}`);
            alert("Erreur Firebase (voir logs écran)");
        });

        // 2. PERMISSION
        log("Demande permission...");
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
            perm = await PushNotifications.requestPermissions();
        }
        
        if (perm.receive !== 'granted') {
            log("❌ Permission REFUSÉE par l'utilisateur.");
            return;
        }
        log("✅ Permission accordée.");

        // 3. ENREGISTREMENT
        log("Appel de register()...");
        await PushNotifications.register();
        log("Register appelé. En attente de réponse...");

    } catch (e) {
        log(`❌ CRASH JS: ${e.message}`);
    }
  };

  const upcomingTasks = [
    { id: 1, title: 'Visite médicale', time: '14:00', helper: 'Marie Dupont', type: 'medical' },
    { id: 2, title: 'Courses alimentaires', time: '16:30', helper: 'À pourvoir', type: 'shopping' },
    { id: 3, title: 'Promenade au parc', time: 'Demain 10:00', helper: 'Jean Martin', type: 'activity' },
  ];

  const stats = [
    { label: 'Aidants actifs', value: '8', icon: Users, color: 'blue' },
    { label: 'Tâches cette semaine', value: '12', icon: Calendar, color: 'green' },
    { label: 'Souvenirs partagés', value: '45', icon: Heart, color: 'pink' },
    { label: 'Messages non lus', value: '3', icon: MessageSquare, color: 'purple' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* SECTION DE DEBUG VISIBLE */}
        <div className="mb-8 p-4 bg-gray-100 rounded-lg border-2 border-indigo-200">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-indigo-700">Zone de Test Notifications</h3>
                <button 
                    onClick={activerNotifs}
                    className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-bold"
                >
                    🔔 LANCER LA SYNCHRO
                </button>
            </div>
            <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto h-32 whitespace-pre-wrap">
                {debugLog}
            </pre>
        </div>

        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue sur votre espace d'entraide</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClass = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              pink: 'bg-pink-50 text-pink-600',
              purple: 'bg-purple-50 text-purple-600',
            }[stat.color];

            return (
              <div key={stat.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
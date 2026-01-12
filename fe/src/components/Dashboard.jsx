import { useState } from 'react';
import { Calendar, Heart, MessageSquare, Users } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import { apiPost } from '../api/client';

export default function Dashboard() {
  
  // Fonction pour activer les notifications
  const activerNotifs = async () => {
    console.log("--- Démarrage Activer Notifs ---");
    try {
        const storedUser = localStorage.getItem('user');
        const userId = storedUser ? JSON.parse(storedUser).id : null;

        // Nettoyage des anciens écouteurs
        await PushNotifications.removeAllListeners(); 

        // Écouter l'arrivée du token
        await PushNotifications.addListener('registration', async (token) => {
            console.log(`✅ Token reçu : ${token.value}`);
            try {
                // Envoi au backend
                await apiPost('/users/device-token', { userId, token: token.value });
                console.log("🚀 Token envoyé au serveur avec SUCCÈS !");
            } catch (err) {
                 console.error(`❌ Erreur API: ${err.message}`);
            }
        });

        // Vérif
        await PushNotifications.addListener('registrationError', (error) => {
            console.error(`❌ Erreur Firebase: ${JSON.stringify(error)}`);
        });

        // Demander la permission à l'utilisateur
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
            perm = await PushNotifications.requestPermissions();
        }
        
        if (perm.receive !== 'granted') {
            console.log("❌ Permission REFUSÉE.");
            return;
        }

        // Enregistrement final auprès de Google
        await PushNotifications.register();

    } catch (e) {
        console.error(`❌ Crash JS: ${e.message}`);
    }
  };

  const stats = [
    { label: 'Aidants actifs', value: '8', icon: Users, color: 'blue' },
    { label: 'Tâches cette semaine', value: '12', icon: Calendar, color: 'green' },
    { label: 'Souvenirs partagés', value: '45', icon: Heart, color: 'pink' },
    { label: 'Messages non lus', value: '3', icon: MessageSquare, color: 'purple' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Tableau de bord</h1>
            <p className="text-gray-600">Bienvenue sur votre espace d'entraide</p>
          </div>
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
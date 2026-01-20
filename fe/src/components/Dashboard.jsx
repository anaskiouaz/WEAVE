import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client';
import { Calendar, Heart, MessageSquare, Users, Clock, Activity, ShoppingCart, Stethoscope, RefreshCw } from 'lucide-react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

// 1. IMPORT DU HOOK useAuth DEPUIS TON FICHIER CONTEXT
import { useAuth } from '../context/AuthContext'; 

export default function Dashboard() {
  const navigate = useNavigate();
  // 2. RECUPERATION DU CIRCLE ID VIA LE CONTEXTE
  // Ce circleId vient directement du localStorage grâce à ton AuthProvider
  const { circleId, user } = useAuth(); 
  
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    active_helpers: 0,
    tasks_this_week: 0,
    memories: 0,
    unread_messages: 0
  });

  // Fonction de chargement des données
  const loadTasks = async () => {
    try {
      setLoading(true);
      
      // 3. ENVOI DU CIRCLE_ID AU BACKEND
      // Si circleId existe dans le context, on l'ajoute à l'URL
      // Sinon, on appelle /dashboard sans paramètre (le backend prendra celui par défaut)
      const endpoint = circleId ? `/dashboard?circle_id=${circleId}` : '/dashboard';
      
      console.log(`Chargement dashboard pour le cercle : ${circleId || 'Défaut'}`);
      
      const response = await apiGet(endpoint);
      
      if (response.data) {
        console.log('📊 Dashboard Stats reçues:', response.data.stats);
        setUpcomingTasks(response.data.upcomingTasks);
        setDashboardStats(response.data.stats);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des Notifications (inchangée mais utilise user.id du context si dispo)
  const activerNotifs = async () => {
    if (Capacitor.getPlatform() === 'web') return; 
    try {
        const userId = user ? user.id : null; // Utilise le user du contexte

        await PushNotifications.removeAllListeners(); 
        await PushNotifications.addListener('registration', async (token) => {
            if(userId) await apiPost('/users/device-token', { userId, token: token.value });
        });
        await PushNotifications.addListener('pushNotificationReceived', (n) => alert(`${n.title}\n${n.body}`));
        
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
        if (perm.receive === 'granted') await PushNotifications.register();
    } catch (e) { console.error(`Erreur Notifs: ${e.message}`); }
  };

  // 4. DECLENCHEMENT AUTOMATIQUE
  // Dès que 'circleId' change dans le contexte (ou localStorage), le useEffect se relance
  useEffect(() => {
    loadTasks();
    activerNotifs();
  }, [circleId]); 

  // --- RENDU GRAPHIQUE (inchangé) ---
  const statsDisplay = [
    { label: 'Aidants actifs', value: dashboardStats.active_helpers, icon: Users, color: 'blue' },
    { label: 'Tâches cette semaine', value: dashboardStats.tasks_this_week, icon: Calendar, color: 'green' },
    { label: 'Souvenirs partagés', value: dashboardStats.memories, icon: Heart, color: 'pink' },
    { label: 'Messages non lus', value: dashboardStats.unread_messages, icon: MessageSquare, color: 'purple' },
  ];

  if (loading && !upcomingTasks.length) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-gray-500 text-lg animate-pulse">Chargement des données...</div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-gray-900 text-2xl font-bold mb-2">Tableau de bord</h1>
              <p className="text-gray-600">
                  Vue d'ensemble {circleId && <span className="text-xs text-gray-400">(Cercle #{circleId.slice(0,8)}...)</span>}
              </p>
            </div>
            <button
              onClick={() => navigate('/select-circle')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Changer de cercle
            </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat) => {
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
                    <p className="text-gray-600 mb-1 font-medium">{stat.label}</p>
                    <p className="text-gray-900 text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prochaines interventions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-gray-900 font-semibold text-lg">Prochaines interventions</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {upcomingTasks.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 italic">Aucune tâche prévue pour le moment.</p>
                </div>
            ) : (
                upcomingTasks.map((task) => {
                const typeStyle = {
                    medical: { color: 'bg-red-50 border-red-200', icon: Stethoscope },
                    shopping: { color: 'bg-blue-50 border-blue-200', icon: ShoppingCart },
                    activity: { color: 'bg-green-50 border-green-200', icon: Activity },
                }[task.task_type] || { color: 'bg-gray-50 border-gray-200', icon: Activity };

                const TypeIcon = typeStyle.icon;

                return (
                    <div key={task.id} className={`border rounded-lg p-4 ${typeStyle.color} transition hover:shadow-sm`}>
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="mt-1"><TypeIcon className="w-5 h-5 text-gray-600 opacity-70" /></div>
                            <div>
                                <p className="text-gray-900 font-medium mb-1">{task.title}</p>
                                <p className="text-gray-600 text-sm flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> 
                                    {new Date(task.date).toLocaleDateString('fr-FR')} à {task.time.slice(0, 5)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                        <span className="inline-block bg-white px-2 py-1 rounded text-xs font-semibold text-gray-700 border border-gray-200">
                            {task.helper_name || 'À pourvoir'}
                        </span>
                        </div>
                    </div>
                    </div>
                );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
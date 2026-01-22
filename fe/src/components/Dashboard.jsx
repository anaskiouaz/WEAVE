import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../api/client';
import { Calendar, Heart, MessageSquare, Users, Clock, Activity, ShoppingCart, Stethoscope } from 'lucide-react';
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
        <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="text-lg font-semibold animate-pulse" style={{ color: 'var(--text-primary)' }}>Chargement des données...</div>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Tableau de bord</h1>
              <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Vue d'ensemble {circleId && <span className="text-sm opacity-70">(Cercle #{circleId.slice(0,8)}...)</span>}
              </p>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsDisplay.map((stat) => {
            const Icon = stat.icon;
            const colorStyle = {
              blue: { bg: 'rgba(74, 106, 138, 0.12)', color: 'var(--text-primary)' },
              green: { bg: 'rgba(167, 201, 167, 0.25)', color: 'var(--sage-green)' },
              pink: { bg: 'rgba(240, 128, 128, 0.15)', color: 'var(--soft-coral)' },
              purple: { bg: 'rgba(74, 106, 138, 0.15)', color: 'var(--text-primary)' },
            }[stat.color];

            return (
              <div 
                key={stat.label} 
                className="rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                  </div>
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: colorStyle.bg, color: colorStyle.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prochaines interventions */}
        <div 
          className="rounded-3xl p-6"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Prochaines interventions</h2>
            <Clock className="w-5 h-5" style={{ color: 'var(--sage-green)' }} />
          </div>

          <div className="space-y-4">
            {upcomingTasks.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Aucune tâche prévue pour le moment.</p>
                </div>
            ) : (
                upcomingTasks.map((task) => {
                const typeStyle = {
                    medical: { bg: 'rgba(240, 128, 128, 0.1)', border: 'rgba(240, 128, 128, 0.3)', icon: Stethoscope },
                    shopping: { bg: 'rgba(74, 106, 138, 0.1)', border: 'rgba(74, 106, 138, 0.3)', icon: ShoppingCart },
                    activity: { bg: 'rgba(167, 201, 167, 0.15)', border: 'rgba(167, 201, 167, 0.4)', icon: Activity },
                }[task.task_type] || { bg: 'var(--bg-secondary)', border: 'var(--border-medium)', icon: Activity };

                const TypeIcon = typeStyle.icon;

                return (
                    <div 
                      key={task.id} 
                      className="rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
                      style={{ 
                        backgroundColor: typeStyle.bg, 
                        border: `2px solid ${typeStyle.border}`,
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="mt-1"><TypeIcon className="w-5 h-5 opacity-70" style={{ color: 'var(--text-primary)' }} /></div>
                            <div>
                                <p className="font-semibold mb-1 text-lg" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                                <p className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--text-secondary)' }}>
                                    <Clock className="w-3 h-3" /> 
                                    {new Date(task.date).toLocaleDateString('fr-FR')} à {task.time.slice(0, 5)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                        <span 
                          className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold"
                          style={{ 
                            backgroundColor: 'var(--bg-card)', 
                            color: 'var(--text-primary)',
                            border: '1px solid var(--sage-green)',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
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
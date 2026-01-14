import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Heart, MessageSquare, Users, Clock, Loader2, Camera, Activity, ChevronDown, Check, X, Phone, Mail } from 'lucide-react';
// Assure-toi que apiGet pointe bien vers ton fichier client.js
import { apiGet } from '../api/client';

export default function DashboardView() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // --- ÉTATS ---
  const [circles, setCircles] = useState([]); // Liste réelle depuis la DB
  const [selectedCircleId, setSelectedCircleId] = useState(localStorage.getItem('weave_current_circle') || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [stats, setStats] = useState({
    seniorName: 'Chargement...',
    activeHelpers: 0,
    tasksThisWeek: 0,
    memoriesShared: 0,
    unreadMessages: 0,
    helpersList: []
  });

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [showHelpersModal, setShowHelpersModal] = useState(false);

  // 1. CHARGEMENT INITIAL (Liste des cercles)
  useEffect(() => {
    async function init() {
        try {
            // Appel à ton module backend
            const res = await apiGet('/module/circles');
            if (res.data && res.data.length > 0) {
                setCircles(res.data);
                
                // Si pas de sélection ou sélection invalide, on prend le premier
                if (!selectedCircleId || !res.data.find(c => c.id === selectedCircleId)) {
                    const firstId = res.data[0].id;
                    setSelectedCircleId(firstId);
                    localStorage.setItem('weave_current_circle', firstId);
                }
            }
        } catch (e) {
            console.error("Erreur chargement cercles", e);
        } finally {
            setLoading(false);
        }
    }
    init();
  }, []);

  // 2. CHARGEMENT DONNÉES DU CERCLE
  useEffect(() => {
    if (!selectedCircleId) return;
    fetchCircleData();
  }, [selectedCircleId]);

  const fetchCircleData = async () => {
    try {
        // Récupère les stats via ton module
        const statsRes = await apiGet(`/module/stats?circleId=${selectedCircleId}`);
        if (statsRes.data) setStats(statsRes.data);

        // Récupère les tâches pour l'aperçu (via ton module calendrier)
        const tasksRes = await apiGet(`/module/calendar/tasks?circleId=${selectedCircleId}`);
        const allTasks = tasksRes.data || [];
        
        // Filtre JS simple pour l'affichage "Prochaines interventions"
        const future = allTasks
            .filter(t => new Date(t.date) >= new Date().setHours(0,0,0,0))
            .slice(0, 3);
        setUpcomingTasks(future);

    } catch (e) {
        console.error("Erreur data cercle", e);
    }
  };

  const handleSelectCircle = (id) => {
      setSelectedCircleId(id);
      localStorage.setItem('weave_current_circle', id);
      setIsDropdownOpen(false);
  };

  // Trouver le cercle actuel dans la liste pour afficher son nom
  const currentCircle = circles.find(c => c.id === selectedCircleId) || { senior_name: 'Sélectionner' };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-800 w-12 h-12"/></div>;

  return (
    <div className="bg-gray-100 min-h-screen pb-12 font-sans relative">
      
      {/* MODALE AIDANTS */}
      {showHelpersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-900 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex gap-2"><Users className="text-blue-300"/> Cercle de {stats.seniorName}</h3>
                    <button onClick={() => setShowHelpersModal(false)}><X size={24}/></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {stats.helpersList?.map(h => (
                        <div key={h.id} className="flex items-center gap-4 p-4 border-b hover:bg-gray-50">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{h.name.charAt(0)}</div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{h.name}</p>
                                <p className="text-xs text-gray-500 uppercase">{h.role}</p>
                            </div>
                        </div>
                    ))}
                    {(!stats.helpersList || stats.helpersList.length === 0) && <div className="p-6 text-center text-gray-500">Aucun membre trouvé.</div>}
                </div>
            </div>
        </div>
      )}

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-blue-900 to-orange-700/95 backdrop-blur-md shadow-xl py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="text-white">
            <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
            <p className="text-slate-100 text-sm opacity-90">Espace d'entraide</p>
          </div>

          {/* SELECTEUR */}
          <div className="relative">
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 pr-4 rounded-full flex items-center gap-3 shadow-lg cursor-pointer hover:bg-white/20 transition-all">
                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center font-bold text-gray-600">
                    {currentCircle.senior_name.charAt(0)}
                </div>
                <div className="text-white hidden sm:block">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{currentCircle.senior_name}</span>
                        <ChevronDown size={16}/>
                    </div>
                </div>
            </div>
            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    {circles.map((c) => (
                        <button key={c.id} onClick={() => handleSelectCircle(c.id)} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-blue-50 ${selectedCircleId === c.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                            <span className="font-bold flex-1">{c.senior_name}</span>
                            {selectedCircleId === c.id && <Check size={16}/>}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Aidants" value={stats.activeHelpers} icon={Users} color="blue" onClick={() => setShowHelpersModal(true)}/>
            <StatsCard title="Tâches (Futur)" value={stats.tasksThisWeek} icon={Calendar} color="green" onClick={() => navigate('/calendar')}/>
            <StatsCard title="Souvenirs" value={stats.memoriesShared} icon={Heart} color="pink" onClick={() => navigate('/souvenirs')}/>
            <StatsCard title="Messages" value={stats.unreadMessages} icon={MessageSquare} color="purple" onClick={() => navigate('/chat')}/>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/calendar')}>
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Clock className="text-blue-700"/> Prochaines interventions</h2>
             <span className="text-sm text-blue-600 font-bold hover:underline">Voir le calendrier →</span>
          </div>
          <div className="space-y-4">
            {upcomingTasks.map(t => (
                <div key={t.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white border-l-4 border-l-blue-600">
                    <div>
                        <p className="font-bold text-gray-900">{t.title}</p>
                        <div className="text-sm text-gray-500 flex gap-2"><Calendar size={14}/> {new Date(t.date).toLocaleDateString()} at {t.time.substring(0,5)}</div>
                    </div>
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">{t.helper_name}</span>
                </div>
            ))}
            {upcomingTasks.length === 0 && <div className="text-center py-6 text-gray-500">Aucune tâche prévue.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, onClick }) {
    const colors = { blue: "border-blue-600 bg-blue-50 text-blue-700", green: "border-green-600 bg-green-50 text-green-700", pink: "border-pink-500 bg-pink-50 text-pink-600", purple: "border-purple-600 bg-purple-50 text-purple-700" };
    return (
        <div onClick={onClick} className={`bg-white rounded-xl p-5 shadow-sm border-b-4 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition-transform ${colors[color]}`}>
            <div><p className="text-xs font-bold opacity-70 uppercase">{title}</p><p className="text-3xl font-black mt-1">{value}</p></div>
            <Icon size={28} className="opacity-80"/>
        </div>
    );
}
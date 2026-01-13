import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Heart, MessageSquare, Users, Clock, Loader2, Camera, Activity, ChevronDown, Check, X, Phone, Mail } from 'lucide-react';
import { apiGet } from '../api/client';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // --- DONNÉES SIMULÉES (CERCLES) ---
  // Note : Idéalement, ceci devrait venir de l'API /api/my-circles
// --- DANS DASHBOARD.JSX ---
  
  // Remplace 'uuid-cercle-1' par le VRAI UUID de ta base de données
  const beneficiariesList = [
    { 
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // <--- MET TON VRAI UUID ICI
      name: "Marcelle Dubois", 
      age: "82 ans", 
      photo: null, 
      health: { moral: 'Bon', general: 'Stable', last: "Auj. 10:00" } 
    },
    // Tu peux commenter le 2ème pour l'instant si tu n'as pas créé 2 cercles
    // { id: '...', name: "Jean-Pierre Martin", ... },
  ];

  // 1. INITIALISATION INTELLIGENTE
  // On regarde si une sélection existe déjà en mémoire, sinon on prend le premier
  const [selectedCircleId, setSelectedCircleId] = useState(() => {
    return localStorage.getItem('weave_current_circle') || beneficiariesList[0].id;
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- ÉTATS ---
  const [stats, setStats] = useState({
    activeHelpers: 0,
    tasksThisWeek: 0,
    memoriesShared: 0,
    unreadMessages: 0,
    helpersList: []
  });

  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [showHelpersModal, setShowHelpersModal] = useState(false);

  const currentBeneficiary = beneficiariesList.find(b => b.id === selectedCircleId) || beneficiariesList[0];

  // À chaque changement de cercle, on recharge les données
  useEffect(() => {
    fetchDashboardData();
  }, [selectedCircleId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Appel API avec le paramètre circleId
      try {
        const statsResponse = await apiGet(`/dashboard/stats?circleId=${selectedCircleId}`);
        if (statsResponse && statsResponse.data) {
           setStats(statsResponse.data);
        }
      } catch (e) { console.warn("Erreur stats:", e); }

      try {
        const tasksResponse = await apiGet(`/tasks?circleId=${selectedCircleId}`);
        const allTasks = tasksResponse.data || [];

        // Filtre : Tâches futures uniquement pour le dashboard
        const today = new Date();
        today.setHours(0,0,0,0);

        const futureTasks = allTasks
          .filter(t => new Date(t.date) >= today)
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
          .slice(0, 3); 

        setUpcomingTasks(futureTasks);
      } catch (e) { console.warn("Erreur tasks:", e); }

    } catch (err) {
      console.error("Erreur globale Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = (e) => { e.stopPropagation(); fileInputRef.current.click(); };

  // 2. CHANGEMENT DE CERCLE ET SAUVEGARDE
  const handleSelectCircle = (id) => { 
      setSelectedCircleId(id); 
      localStorage.setItem('weave_current_circle', id); // <--- SAUVEGARDE ICI
      setIsDropdownOpen(false); 
  };

  const handleCardClick = (type) => {
    switch(type) {
        case 'helpers': setShowHelpersModal(true); break;
        case 'tasks': navigate('/calendar'); break;
        case 'memories': navigate('/souvenirs'); break;
        case 'messages': navigate('/chat'); break;
        default: break;
    }
  };

  if (loading) return <div className="flex h-screen w-full items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-blue-800 w-12 h-12"/></div>;

  return (
    <div className="bg-gray-100 min-h-screen pb-12 font-sans relative">
      <input type="file" ref={fileInputRef} className="hidden" />

      {/* --- MODALE LISTE DES AIDANTS --- */}
      {showHelpersModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-900 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Users className="text-blue-300" size={20}/> Cercle de Soins
                    </h3>
                    <button onClick={() => setShowHelpersModal(false)} className="text-white/70 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {stats.helpersList && stats.helpersList.length > 0 ? (
                        stats.helpersList.map((helper) => (
                            <div key={helper.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">{helper.name.charAt(0)}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{helper.name}</p>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">{helper.role || 'Membre'}</p>
                                </div>
                                <div className="flex gap-2">
                                    {helper.phone && <a href={`tel:${helper.phone}`} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200"><Phone size={16}/></a>}
                                    <a href={`mailto:${helper.email}`} className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"><Mail size={16}/></a>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500">Aucun autre membre dans ce cercle pour l'instant.</div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <button onClick={() => setShowHelpersModal(false)} className="text-sm font-bold text-blue-700 hover:underline">Fermer la liste</button>
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

          {/* SÉLECTEUR CERCLE */}
          <div className="relative">
            <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 pr-4 rounded-full flex items-center gap-3 shadow-lg cursor-pointer hover:bg-white/20 transition-all select-none">
                <div onClick={handlePhotoClick} className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center font-bold text-gray-600 overflow-hidden relative group">
                    {currentBeneficiary.photo ? <img src={currentBeneficiary.photo} className="w-full h-full object-cover"/> : currentBeneficiary.name.charAt(0)}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={18} className="text-white" /></div>
                </div>
                <div className="text-white hidden sm:block">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{currentBeneficiary.name.split(' ')[0]}</span>
                        <ChevronDown size={16} className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-300"><Activity size={12} /> {currentBeneficiary.health.general}</div>
                </div>
            </div>
            {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {beneficiariesList.map((b) => (
                        <button key={b.id} onClick={() => handleSelectCircle(b.id)} className={`w-full text-left p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors ${selectedCircleId === b.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}>
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-xs">{b.name.charAt(0)}</div>
                            <span className="text-sm font-bold flex-1">{b.name}</span>
                            {selectedCircleId === b.id && <Check size={16}/>}
                        </button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard title="Aidants actifs" value={stats.activeHelpers} icon={Users} color="blue" onClick={() => handleCardClick('helpers')} />
            <StatsCard title="Tâches semaine" value={stats.tasksThisWeek} icon={Calendar} color="green" onClick={() => handleCardClick('tasks')} />
            <StatsCard title="Souvenirs partagés" value={stats.memoriesShared} icon={Heart} color="pink" onClick={() => handleCardClick('memories')} />
            <StatsCard title="Messages" value={stats.unreadMessages} icon={MessageSquare} color="purple" onClick={() => handleCardClick('messages')} />
        </div>

        {/* SANTÉ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900"><Activity className="text-orange-600"/> État de santé</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HealthCard label="Moral" value={currentBeneficiary.health.moral} />
                <HealthCard label="Santé Générale" value={currentBeneficiary.health.general} />
                <HealthCard label="Dernier Contact" value={currentBeneficiary.health.last} color="blue" />
            </div>
        </div>

        {/* PROCHAINES TÂCHES */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/calendar')}>
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900"><Clock className="text-blue-700"/> Prochaines interventions</h2>
             <span className="text-sm text-blue-600 font-bold hover:underline">Voir le calendrier →</span>
          </div>
          <div className="space-y-4">
            {upcomingTasks.length > 0 ? (
                upcomingTasks.map(t => <TaskItem key={t.id} task={t} />)
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">Aucune intervention prévue</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---
function StatsCard({ title, value, icon: Icon, color, onClick }) {
    const colors = { blue: "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100", green: "border-green-600 bg-green-50 text-green-700 hover:bg-green-100", pink: "border-pink-500 bg-pink-50 text-pink-600 hover:bg-pink-100", purple: "border-purple-600 bg-purple-50 text-purple-700 hover:bg-purple-100" };
    return (
        <div onClick={onClick} className={`bg-white rounded-xl p-5 shadow-sm border-b-4 flex justify-between items-center cursor-pointer transition-all transform hover:-translate-y-1 ${colors[color]}`}>
            <div><p className="text-xs font-bold opacity-70 uppercase">{title}</p><p className="text-3xl font-black mt-1">{value}</p></div>
            <Icon size={28} className="opacity-80"/>
        </div>
    );
}
function HealthCard({ label, value, color = "green" }) {
    return (
        <div className={`p-4 rounded-lg bg-gray-50 border-l-4 ${color === 'blue' ? 'border-blue-500' : 'border-green-500'}`}>
            <p className="text-xs font-bold text-gray-400 uppercase">{label}</p><p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
    );
}
function TaskItem({ task }) {
    const styles = { medical: { border: 'border-l-red-600', text: 'Médical' }, shopping: { border: 'border-l-blue-600', text: 'Courses' }, activity: { border: 'border-l-green-600', text: 'Activité' } };
    const style = styles[task.task_type] || styles.activity;
    return (
        <div className={`border border-gray-200 rounded-lg p-4 flex justify-between items-center bg-white ${style.border} border-l-[6px]`}>
            <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded text-gray-600 mb-1 inline-block">{style.text}</span>
                <p className="font-bold text-gray-900 text-lg">{task.title}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5"><Calendar size={14}/> {new Date(task.date).toLocaleDateString()} <Clock size={14} className="ml-2"/> {task.time.substring(0,5)}</div>
            </div>
            <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">{task.helper_name || 'À pourvoir'}</span>
        </div>
    )
}
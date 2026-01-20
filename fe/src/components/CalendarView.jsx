import { useState, useEffect, useMemo } from 'react';
import {
  Plus, X, ShoppingCart, Stethoscope, Activity, User,
  ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, RotateCcw,
  AlertCircle, LayoutGrid, List as ListIcon, MapPin
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskDetailsModal from './ui-desktop/TaskDetailsModal';

// --- CONFIGURATION SIMPLIFIÉE (Couleurs douces) ---
// On utilise une seule source de couleur principale par type (le fond du badge/icône)
const TASK_TYPES = {
  medical: {
    label: 'Médical',
    icon: Stethoscope,
    color: 'text-rose-600',
    bg: 'bg-rose-100',
    border: 'border-rose-100',
    light: 'bg-rose-50'
  },
  shopping: {
    label: 'Courses',
    icon: ShoppingCart,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100',
    border: 'border-indigo-100',
    light: 'bg-indigo-50'
  },
  activity: {
    label: 'Activité',
    icon: Activity,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-100',
    light: 'bg-emerald-50'
  },
};

// --- COMPOSANTS UI REFACTORISÉS ---

// 1. Nouvelle Carte de Tâche (Épurée)
const TaskCard = ({ task, onClick, currentUserId, onVolunteer, viewMode = 'card' }) => {
  const config = TASK_TYPES[task.task_type] || TASK_TYPES.activity;
  const Icon = config.icon;
  const isSigned = currentUserId && task.assigned_to && task.assigned_to.includes(currentUserId);

  // Vue LISTE (très compacte, horizontale)
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onClick(task)}
        className="flex items-center gap-4 p-3 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer group"
      >
        {/* Date (si liste globale) ou Heure */}
        <div className="w-16 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold text-slate-400">
            {task.time ? task.time.slice(0, 5) : '--:--'}
          </span>
        </div>

        {/* Icône Type */}
        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Contenu Principal */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-700 truncate">{task.title}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{task.helper_name}</span>
            {isSigned && <span className="text-green-600 font-medium flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Inscrit</span>}
          </div>
        </div>

        {/* Action Rapide */}
        {!isSigned && (
          <button
            onClick={(e) => { e.stopPropagation(); onVolunteer(task.id); }}
            className="opacity-0 group-hover:opacity-100 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // Vue SEMAINE/CARTE (Épurée, Titre en premier)
  return (
    <div
      onClick={() => onClick(task)}
      className={`
        relative p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2
        ${isSigned ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-100'}
      `}
    >
      {/* 1. En-tête : Badge Type + Heure (Discret) */}
      <div className="flex justify-between items-center">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        {task.time && (
          <span className="text-xs font-medium text-slate-400">{task.time.slice(0, 5)}</span>
        )}
      </div>

      {/* 2. Titre (L'élément le plus visible) */}
      <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">
        {task.title}
      </h4>

      {/* 3. Footer : Assignation (Subtil) */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <User className="w-3 h-3" />
          </div>
          <span className={`text-xs truncate max-w-[80px] ${isSigned ? 'font-semibold text-green-700' : 'text-slate-500'}`}>
            {task.helper_name === 'À pourvoir' ? 'Libre' : task.helper_name}
          </span>
        </div>

        {/* Bouton d'action au survol uniquement */}
        {!isSigned && (
          <button
            onClick={(e) => { e.stopPropagation(); onVolunteer(task.id); }}
            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-50 p-1 rounded transition-all"
            title="S'inscrire"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// 2. Colonne de Jour (Avec Résumé)
const DayColumn = ({ dayInfo, tasks, isToday, onTaskClick, currentUserId, onVolunteer, onAddTask }) => {
  // Calcul du résumé
  const summary = tasks.reduce((acc, t) => {
    const type = t.task_type || 'activity';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const hasTasks = tasks.length > 0;

  return (
    <div className={`flex flex-col rounded-2xl transition-all h-full min-h-[150px]
      ${isToday ? 'bg-blue-50/30 ring-1 ring-blue-100' : 'bg-transparent'}
    `}>
      {/* Header du jour */}
      <div className={`p-2 text-center border-b border-transparent ${isToday ? 'border-blue-100' : ''}`}>
        <div className="flex flex-col items-center">
          <span className={`text-[11px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
            {dayInfo.name}
          </span>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold mt-1
                ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700'}`}>
            {dayInfo.displayDate}
          </div>
        </div>

        {/* Résumé compact (Points de couleur) */}
        {hasTasks && (
          <div className="flex justify-center gap-1 mt-2 h-1.5">
            {Object.entries(summary).map(([type, count]) => (
              <div key={type} className={`h-1.5 rounded-full ${TASK_TYPES[type]?.bg.replace('bg-', 'bg-') || 'bg-slate-300'}`}
                style={{ width: `${Math.min(count * 6, 24)}px` }} // Largeur dynamique selon le nombre
                title={`${count} ${TASK_TYPES[type]?.label}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Zone de tâches */}
      <div className="flex-1 p-2 space-y-2">
        {hasTasks ? (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
              currentUserId={currentUserId}
              onVolunteer={onVolunteer}
            />
          ))
        ) : (
          /* Zone vide "légère" */
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center group cursor-pointer" onClick={() => onAddTask(dayInfo.dateISO)}>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Vue Liste (Alternative à la vue Calendrier)
const ListView = ({ tasks, onTaskClick, currentUserId, onVolunteer }) => {
  // Grouper par date
  const grouped = useMemo(() => {
    const g = {};
    tasks.forEach(t => {
      const dateKey = t.date.split('T')[0];
      if (!g[dateKey]) g[dateKey] = [];
      g[dateKey].push(t);
    });
    // Trier les clés de date
    return Object.keys(g).sort().reduce((obj, key) => {
      obj[key] = g[key].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      return obj;
    }, {});
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Aucune tâche prévue cette semaine.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {Object.entries(grouped).map(([date, dayTasks]) => {
        const dateObj = new Date(date);
        const isToday = new Date().toISOString().split('T')[0] === date;

        return (
          <div key={date}>
            <div className={`px-4 py-2 border-b border-slate-50 flex items-center gap-2 ${isToday ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
              <Calendar className={`w-4 h-4 ${isToday ? 'text-blue-500' : 'text-slate-400'}`} />
              <h3 className={`font-bold capitalize ${isToday ? 'text-blue-700' : 'text-slate-600'}`}>
                {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              {isToday && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase">Aujourd'hui</span>}
            </div>
            <div>
              {dayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  viewMode="list" // Active le mode compact
                  onClick={onTaskClick}
                  currentUserId={currentUserId}
                  onVolunteer={onVolunteer}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
export default function CalendarView() {
  const { circleId, user } = useAuth();

  // États UI
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'list'
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // États Données
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: null, message: null });

  // Formulaire (état initial)
  const initialTaskState = {
    title: '', type: 'activity', date: new Date().toISOString().split('T')[0], time: '', required_helpers: 1
  };
  const [newTask, setNewTask] = useState(initialTaskState);

  // --- LOGIQUE (Similaire à avant, raccourcie pour la clarté) ---
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: null }), 4000);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (!circleId) return;
      const data = await apiGet('/tasks');
      // Filtre basique
      const filtered = (data.data || []).filter(t => String(t.circle_id) === String(circleId));
      setTasks(filtered);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, [circleId]);

  // Helpers de date
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        name: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d),
        dateISO: d.toISOString().split('T')[0],
        displayDate: d.getDate()
      };
    });
  }, [currentDate]);

  // Actions
  const handleAddTask = async () => {
    /* ... (Logique identique à ton code précédent) ... */
    // Placeholder pour la logique d'ajout
    console.log("Adding task", newTask);
    setShowAddTask(false);
  };

  const openAddModal = (prefillDate) => {
    setNewTask({ ...newTask, date: prefillDate || new Date().toISOString().split('T')[0] });
    setShowAddTask(true);
  };

  // Actions: volunteer / unvolunteer / delete (utilisent les endpoints backend)
  const handleVolunteer = async (taskId) => {
    try {
      if (!user?.id) return showNotification('error', 'Utilisateur non authentifié');
      await apiPost(`/tasks/${taskId}/volunteer`, { userId: user.id });
      await loadTasks();
      setSelectedTask(null);
      showNotification('success', "Inscription enregistrée.");
    } catch (err) { console.error(err); showNotification('error', err.message || 'Erreur'); }
  };

  const handleUnvolunteer = async (taskId) => {
    try {
      if (!user?.id) return showNotification('error', 'Utilisateur non authentifié');
      await apiPost(`/tasks/${taskId}/unvolunteer`, { userId: user.id });
      await loadTasks();
      setSelectedTask(null);
      showNotification('success', "Désinscription enregistrée.");
    } catch (err) { console.error(err); showNotification('error', err.message || 'Erreur'); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    if (!window.confirm('Supprimer définitivement ?')) return;
    try {
      await apiDelete(`/tasks/${taskId}`);
      await loadTasks();
      setSelectedTask(null);
      showNotification('success', 'Tâche supprimée.');
    } catch (err) { console.error(err); showNotification('error', err.message || 'Erreur'); }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* 1. Header & Navigation Refactorisé */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          {/* Titre et Date */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-1.5 hover:bg-white rounded-md transition text-slate-500"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-blue-600">Auj.</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-1.5 hover:bg-white rounded-md transition text-slate-500"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
            </h2>
          </div>

          {/* Toggle View & Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button
                onClick={() => setViewMode('week')}
                className={`p-2 rounded-md transition-all ${viewMode === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vue Semaine"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                title="Vue Liste"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => openAddModal()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouvelle tâche</span>
            </button>
          </div>
        </div>

        {/* 2. Zone de Contenu */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          <>
            {viewMode === 'week' ? (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {weekDays.map((dayInfo) => {
                  const isToday = dayInfo.dateISO === new Date().toISOString().split('T')[0];
                  const dayTasks = tasks.filter(t => t.date.split('T')[0] === dayInfo.dateISO);
                  return (
                    <DayColumn
                      key={dayInfo.dateISO}
                      dayInfo={dayInfo}
                      tasks={dayTasks}
                      isToday={isToday}
                      onTaskClick={setSelectedTask}
                      currentUserId={user?.id}
                      onVolunteer={handleVolunteer}
                      onAddTask={openAddModal}
                    />
                  );
                })}
              </div>
            ) : (
              <ListView
                tasks={tasks.filter(t => true)}
                onTaskClick={setSelectedTask}
                currentUserId={user?.id}
                onVolunteer={handleVolunteer}
              />
            )}
          </>
        )}

        {/* Modales */}
        {/* Add task modal (si nécessaire) */}
        {showAddTask && (
          null /* existing add modal could be placed here */
        )}

        {/* Task details modal centralized */}
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={() => handleDeleteTask(selectedTask?.id)}
          onVolunteer={() => handleVolunteer(selectedTask?.id)}
          onUnvolunteer={() => handleUnvolunteer(selectedTask?.id)}
          currentUserId={user?.id}
        />

      </div>
    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, ShoppingCart, Stethoscope, Activity, User,
  ChevronLeft, ChevronRight, Calendar, CheckCircle,
  LayoutGrid, List as ListIcon
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskDetailsModal from './ui-desktop/TaskDetailsModal';
import AddTaskModal from './ui-desktop/AddTaskModal'; // <--- IMPORT AJOUTÉ

// --- CONFIGURATION ---
const TASK_TYPES = {
  medical: { label: 'Médical', icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-100' },
  shopping: { label: 'Courses', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  activity: { label: 'Activité', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

// --- COMPOSANTS UI ---
const TaskCard = ({ task, onClick, currentUserId, onVolunteer, viewMode = 'card' }) => {
  const config = TASK_TYPES[task.task_type] || TASK_TYPES.activity;
  const Icon = config.icon;
  const isSigned = currentUserId && task.assigned_to && task.assigned_to.includes(currentUserId);

  if (viewMode === 'list') {
    return (
      <div onClick={() => onClick(task)} className="flex items-center gap-4 p-3 bg-white border-b border-slate-100 last:border-0 hover:bg-slate-50 transition cursor-pointer group">
        <div className="w-16 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold text-slate-400">{task.time ? task.time.slice(0, 5) : '--:--'}</span>
        </div>
        <div className={`p-2 rounded-full ${config.bg} ${config.color}`}><Icon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-700 truncate">{task.title}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{task.helper_name}</span>
            {isSigned && <span className="text-green-600 font-medium flex items-center gap-0.5"><CheckCircle className="w-3 h-3" /> Inscrit</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onClick(task)} className={`relative p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2 ${isSigned ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-100'}`}>
      <div className="flex justify-between items-center">
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${config.bg} ${config.color}`}>
          <Icon className="w-3 h-3" /> {config.label}
        </span>
        {task.time && <span className="text-xs font-medium text-slate-400">{task.time.slice(0, 5)}</span>}
      </div>
      <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{task.title}</h4>
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User className="w-3 h-3" /></div>
          <span className={`text-xs truncate max-w-[80px] ${isSigned ? 'font-semibold text-green-700' : 'text-slate-500'}`}>{task.helper_name === 'À pourvoir' ? 'Libre' : task.helper_name}</span>
        </div>
      </div>
    </div>
  );
};

const DayColumn = ({ dayInfo, tasks, isToday, onTaskClick, onAddTask }) => {
  const summary = tasks.reduce((acc, t) => { const type = t.task_type || 'activity'; acc[type] = (acc[type] || 0) + 1; return acc; }, {});
  const hasTasks = tasks.length > 0;

  return (
    <div className={`flex flex-col rounded-2xl transition-all h-full min-h-[150px] ${isToday ? 'bg-blue-50/30 ring-1 ring-blue-100' : 'bg-transparent'}`}>
      <div className={`p-2 text-center border-b border-transparent ${isToday ? 'border-blue-100' : ''}`}>
        <div className="flex flex-col items-center">
          <span className={`text-[11px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{dayInfo.name}</span>
          <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold mt-1 ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700'}`}>{dayInfo.displayDate}</div>
        </div>
        {hasTasks && (
          <div className="flex justify-center gap-1 mt-2 h-1.5">
            {Object.entries(summary).map(([type, count]) => (
              <div key={type} className={`h-1.5 rounded-full ${TASK_TYPES[type]?.bg.replace('bg-', 'bg-') || 'bg-slate-300'}`} style={{ width: `${Math.min(count * 6, 24)}px` }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 p-2 space-y-2">
        {hasTasks ? (
          tasks.map(task => <TaskCard key={task.id} task={task} onClick={onTaskClick} />)
        ) : (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center group cursor-pointer" onClick={() => onAddTask(dayInfo.dateISO)}>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"><Plus className="w-4 h-4" /></div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CalendarView() {
  const { circleId, user } = useAuth();
  const [viewMode, setViewMode] = useState('week');

  // États Modales
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState(null); // Pour pré-remplir la date
  const [selectedTask, setSelectedTask] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: null, message: null });

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: null }), 4000);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (!circleId) return;
      const data = await apiGet('/tasks');
      const filtered = (data.data || []).filter(t => String(t.circle_id) === String(circleId));
      setTasks(filtered);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, [circleId]);

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
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

  // Grouper les tâches par date (YYYY-MM-DD) et trier par date+heure
  const groupedTasks = useMemo(() => {
    const sorted = tasks.slice().sort((a, b) => {
      const da = new Date(a.date).getTime() + (a.time ? (parseInt(a.time.slice(0,2), 10) * 3600000 + parseInt(a.time.slice(3,5), 10) * 60000) : 0);
      const db = new Date(b.date).getTime() + (b.time ? (parseInt(b.time.slice(0,2), 10) * 3600000 + parseInt(b.time.slice(3,5), 10) * 60000) : 0);
      return da - db;
    });
    return sorted.reduce((acc, t) => {
      const d = (t.date || '').split('T')[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    }, {});
  }, [tasks]);

  // --- ACTIONS ---

  // Ouvre la modale (avec date optionnelle)
  const openAddModal = (dateISO) => {
    setAddTaskDate(dateISO || new Date().toISOString().split('T')[0]);
    setShowAddTask(true);
  };

  // Traite la soumission du formulaire
  const handleCreateTask = async (formData) => {
    try {
      const payload = {
        ...formData,
        circle_id: circleId,
        helper_name: 'À pourvoir', // Défaut
        task_type: formData.type // Mapping nom
      };

      await apiPost('/tasks', payload);
      await loadTasks();
      setShowAddTask(false);
      showNotification('success', "Nouvelle tâche ajoutée !");
    } catch (err) {
      console.error(err);
      showNotification('error', "Erreur lors de la création.");
    }
  };

  const handleVolunteer = async (taskId) => {
    try {
      await apiPost(`/tasks/${taskId}/volunteer`, { userId: user.id });
      await loadTasks();
      setSelectedTask(null);
    } catch (err) { showNotification('error', "Erreur inscription"); }
  };

  const handleUnvolunteer = async (taskId) => {
    try {
      await apiPost(`/tasks/${taskId}/unvolunteer`, { userId: user.id });
      await loadTasks();
      setSelectedTask(null);
    } catch (err) { showNotification('error', "Erreur désistement"); }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Supprimer ?")) {
      try {
        await apiDelete(`/tasks/${taskId}`);
        await loadTasks();
        setSelectedTask(null);
      } catch (err) { showNotification('error', "Erreur suppression"); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }} className="p-1.5 hover:bg-white rounded-md transition"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-blue-600">Auj.</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }} className="p-1.5 hover:bg-white rounded-md transition"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
            </div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
              <button onClick={() => setViewMode('week')} className={`p-2 rounded-md transition ${viewMode === 'week' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><ListIcon className="w-4 h-4" /></button>
            </div>
            <button onClick={() => openAddModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition hover:-translate-y-0.5">
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouvelle tâche</span>
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification.message && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 z-50 ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {notification.message}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          viewMode === 'week' ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map(day => (
                <DayColumn
                  key={day.dateISO} dayInfo={day}
                  tasks={tasks.filter(t => t.date.split('T')[0] === day.dateISO)}
                  isToday={day.dateISO === new Date().toISOString().split('T')[0]}
                  onTaskClick={setSelectedTask}
                  onAddTask={openAddModal}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.keys(groupedTasks).length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border p-4 text-center text-slate-500">Aucune tâche</div>
              ) : (
                Object.entries(groupedTasks).map(([date, items]) => (
                  <div key={date} className="bg-white rounded-2xl shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        <div className="text-xs text-slate-400">{date}</div>
                      </div>
                      <div>
                        <button onClick={() => openAddModal(date)} className="text-sm text-blue-600">Ajouter</button>
                      </div>
                    </div>
                    <div className="divide-y">
                      {items.map(t => (
                        <TaskCard key={t.id} task={t} onClick={setSelectedTask} currentUserId={user?.id} viewMode="list" />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}

        {/* --- LES MODALES --- */}

        {/* 1. Ajouter une tâche */}
        <AddTaskModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          onSave={handleCreateTask}
          prefillDate={addTaskDate}
        />

        {/* 2. Détails d'une tâche */}
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
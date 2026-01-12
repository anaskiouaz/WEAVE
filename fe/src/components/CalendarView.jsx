import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Users, Pill, User, Clock, AlignLeft, Calendar as CalendarIcon } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import MobileCalendarHeader from './ui-mobile/mobileCalendarHeader';

// --- UTILITAIRES D'AFFICHAGE ---
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.replace(':', 'h');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export default function CalendarView() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Pour la pop-up détails
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart] = useState(getStartOfWeek(new Date()));

  const [newTask, setNewTask] = useState({
    title: '',
    description: '', // Nouveau champ
    type: 'activity',
    date: new Date().toISOString().split('T')[0],
    time: '',
    required_helpers: 1, // Champ Quota
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const data = await apiGet('/tasks');
        setTasks(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  function getDateDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return dayMap[dayIndex];
  }

  function getTasksByDayName(dayName) {
    return tasks.filter(task => getDateDayOfWeek(task.date) === dayName);
  }

  const taskIcons = {
    medical: Pill,
    shopping: ShoppingCart,
    activity: Users,
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.date || !newTask.title) {
        alert("La date et le titre sont requis");
        return;
      }
      const taskPayload = {
        title: newTask.title,
        description: newTask.description, // Envoi de la description
        task_type: newTask.type,
        date: newTask.date,
        time: newTask.time,
        required_helpers: parseInt(newTask.required_helpers, 10),
        helper_name: 'À pourvoir',
        senior_name: 'Grand-Père Michel',
      };
      await apiPost('/tasks', taskPayload);
      const data = await apiGet('/tasks');
      setTasks(data.data || []);
      setShowAddTask(false);
      setNewTask({ title: '', description: '', type: 'activity', date: new Date().toISOString().split('T')[0], time: '', required_helpers: 1 });
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
    try {
      await apiDelete(`/tasks/${taskId}`);
      const data = await apiGet('/tasks');
      setTasks(data.data || []);
      setSelectedTask(null); // Fermer la modale si ouverte
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  // --- COMPOSANT INTERNE : Carte de Tache Simplifiée ---
  const TaskCard = ({ task }) => {
    const Icon = taskIcons[task.task_type] || Users;
    const isUnassigned = task.helper_name === 'À pourvoir' || !task.helper_name;

    return (
      <div
        onClick={() => setSelectedTask(task)}
        className={`
          p-3 rounded-xl cursor-pointer transition-all shadow-sm hover:shadow-md
          flex flex-col gap-2 relative group
          ${isUnassigned
            ? 'bg-orange-50 border border-orange-200 hover:border-orange-300'
            : 'bg-white border border-gray-100 hover:border-blue-200'}
        `}
      >
        {/* Ligne 1: Heure et Icone */}
        <div className="flex justify-between items-start">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${isUnassigned ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
            {formatTime(task.time)}
          </span>
          <div className={`p-1.5 rounded-full ${isUnassigned ? 'bg-orange-100 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
            <Icon size={14} />
          </div>
        </div>

        {/* Ligne 2: Titre (Tronqué si trop long) */}
        <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">
          {task.title}
        </h4>

        {/* Ligne 3: Quota */}
        <div className="mt-auto pt-2 border-t border-gray-100/50 flex items-center gap-1 text-gray-400">
          <Users size={12} />
          <span className="text-xs font-medium">Quota : {task.required_helpers || 1}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  // --- RENDU VUE MOBILE ---
  const renderMobileView = () => {
    const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDayName = dayMap[selectedDate.getDay()];
    const dayTasks = getTasksByDayName(currentDayName);

    return (
      <div className="md:hidden flex flex-col min-h-screen bg-white">
        <MobileCalendarHeader currentWeekStart={currentWeekStart} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        <div className="px-5 pb-24 space-y-6 pt-4">
          <h2 className="text-xl font-bold text-gray-800 capitalize">{currentDayName} {selectedDate.getDate()}</h2>
          <div className="grid gap-3">
            {dayTasks.length === 0 && <div className="text-gray-400 italic text-sm text-center py-10 bg-gray-50 rounded-xl">Rien de prévu</div>}
            {dayTasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
        <button onClick={() => setShowAddTask(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white z-30">
          <Plus className="w-8 h-8" />
        </button>
      </div>
    );
  };

  return (
    <>
      {renderMobileView()}

      {/* --- VUE DESKTOP --- */}
      <div className="hidden md:block p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h1 className="text-gray-900 mb-2 text-2xl font-bold">Calendrier partagé</h1>
              <p className="text-gray-500">Vue d'ensemble de la semaine</p>
            </div>
            <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
              <Plus className="w-5 h-5" /> Ajouter une tâche
            </button>
          </div>

          <div className="grid grid-cols-7 gap-4 flex-1 items-stretch min-h-[600px]">
            {daysOfWeek.map((day, index) => {
              const dayTasks = getTasksByDayName(day);
              const currentDate = new Date(currentWeekStart);
              currentDate.setDate(currentWeekStart.getDate() + index);

              return (
                <div key={day} className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="bg-blue-50/80 p-3 border-b border-blue-100 text-center shrink-0">
                    <h3 className="text-blue-900 font-bold text-sm uppercase tracking-wide">{day}</h3>
                    <span className="text-blue-600 text-xl font-bold">{currentDate.getDate()}</span>
                  </div>
                  <div className="p-2 space-y-2 flex-1 bg-gray-50/30 flex flex-col overflow-y-auto">
                    {dayTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MODALE D'AJOUT DE TÂCHE --- */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-gray-800 text-lg font-bold">Nouvelle tâche</h2>
              <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'activité</label>
                <input type="text" placeholder="Ex: Rendez-vous cardiologue" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                <textarea rows="3" placeholder="Détails supplémentaires, lieu, instructions..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="w-full p-3 border border-gray-200 rounded-xl"
                    value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                  <input type="time" className="w-full p-3 border border-gray-200 rounded-xl"
                    value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl bg-white"
                    value={newTask.type} onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}>
                    <option value="activity">Activité</option>
                    <option value="medical">Médical</option>
                    <option value="shopping">Courses</option>
                  </select>
                </div>
                <div>
                  {/* Point 1 : Ajout input Quota */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aidants requis</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                    <input type="number" min="1" className="w-full pl-10 p-3 border border-gray-200 rounded-xl"
                      value={newTask.required_helpers} onChange={(e) => setNewTask({ ...newTask, required_helpers: e.target.value })} />
                  </div>
                </div>
              </div>

              <button onClick={handleAddTask} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-200">
                Ajouter au calendrier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POINT 4: MODALE DÉTAILS DE LA TÂCHE --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>

            {/* Header avec Type et Close */}
            <div className={`h-24 p-6 flex justify-between items-start ${selectedTask.helper_name === 'À pourvoir' ? 'bg-orange-100' : 'bg-blue-600'}`}>
              <div className="bg-white/90 p-2 rounded-lg backdrop-blur-sm shadow-sm">
                {/* Hack pour afficher l'icone dynamiquement */}
                {(() => {
                  const Icon = taskIcons[selectedTask.task_type] || Users;
                  return <Icon className={selectedTask.helper_name === 'À pourvoir' ? 'text-orange-500' : 'text-blue-600'} />;
                })()}
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-white/80 hover:text-white bg-black/10 p-1 rounded-full hover:bg-black/20 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pb-6 -mt-10 relative">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">

                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight mb-1">{selectedTask.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><CalendarIcon size={14} /> {formatDate(selectedTask.date)}</div>
                    <div className="flex items-center gap-1"><Clock size={14} /> {formatTime(selectedTask.time)}</div>
                  </div>
                </div>

                {/* Description */}
                {selectedTask.description && (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 leading-relaxed border border-gray-100">
                    <div className="flex items-center gap-2 mb-1 text-gray-400 font-medium text-xs uppercase"><AlignLeft size={12} /> Description</div>
                    {selectedTask.description}
                  </div>
                )}

                {/* Quota et Statut */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-2 rounded-full"><Users size={16} className="text-gray-600" /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Quota</p>
                      <p className="text-sm font-bold text-gray-800">{selectedTask.required_helpers} aidant(s)</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Statut</p>
                    {selectedTask.helper_name === 'À pourvoir' ? (
                      <span className="text-orange-600 font-bold text-sm">À pourvoir</span>
                    ) : (
                      <span className="text-blue-600 font-bold text-sm">{selectedTask.helper_name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id)}
                  className="flex-1 py-3 border border-red-100 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-colors"
                >
                  Supprimer
                </button>

                {selectedTask.helper_name === 'À pourvoir' ? (
                  <button className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    Je me propose
                  </button>
                ) : (
                  <button className="flex-[2] py-3 bg-gray-100 text-gray-500 font-bold rounded-xl cursor-not-allowed">
                    Déjà assigné
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
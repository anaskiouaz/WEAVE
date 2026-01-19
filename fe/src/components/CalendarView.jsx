import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Stethoscope, Activity, User, Users, ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function CalendarView() {
  const [showAddTask, setShowAddTask] = useState(false);
  const { circleId, user } = useAuth();

  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialisation à la date du jour
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- CORRECTION MAJEURE : Gestion propre des dates ---
  // Cette fonction prend une date (objet ou string) et retourne "YYYY-MM-DD"
  // en se basant sur l'heure LOCALE de l'utilisateur, pas l'UTC.
  const toLocalISOString = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);

    // On force l'utilisation des méthodes locales (getFullYear, pas getUTCFullYear)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const [newTask, setNewTask] = useState({
    title: '',
    type: 'activity',
    date: toLocalISOString(new Date()), // Date du jour correcte
    time: '',
    required_helpers: 1,
  });

  // Trouve le lundi de la semaine courante
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    // On règle l'heure à midi pour éviter les bugs de changement d'heure (DST) à minuit
    d.setHours(12, 0, 0, 0);
    const day = d.getDay(); // 0 = Dimanche, 1 = Lundi...
    // Calcul pour obtenir le Lundi (si Dimanche (0), on recule de 6 jours)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start;
  };

  const changeWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  // Génère les 7 jours de la semaine à afficher
  const getWeekDays = () => {
    const start = getStartOfWeek(currentDate);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i); // Ajoute i jours

      days.push({
        name: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][d.getDay()],
        dateObj: d,
        // C'est cette clé qui sert de référence pour l'affichage des colonnes
        dateISO: toLocalISOString(d),
        displayDate: d.getDate()
      });
    }
    return days;
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      if (!circleId) {
        setTasks([]);
        return;
      }
      const data = await apiGet('/tasks');
      const allTasks = data.data || [];
      const filtered = allTasks.filter(t => String(t.circle_id) === String(circleId));
      setTasks(filtered);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [circleId]);

  // --- CORRECTION CLÉ : Comparaison des dates ---
  // Au lieu de couper la chaine string (split), on convertit la date de la tâche
  // en date locale pour voir si elle tombe ce jour-là.
  function getTasksForDate(columnDateISO) {
    return tasks.filter(task => {
      if (!task.date) return false;
      // Convertit la date de la BDD (souvent UTC) en date locale "YYYY-MM-DD"
      // Cela corrige le décalage si la BDD renvoie "2023-10-19T22:00:00Z" pour le 20 octobre.
      const taskDateLocal = toLocalISOString(task.date);
      return taskDateLocal === columnDateISO;
    });
  }

  const taskTypeIcons = {
    medical: { icon: Stethoscope, color: 'bg-red-100 text-red-600 border-red-200' },
    shopping: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    activity: { icon: Activity, color: 'bg-green-100 text-green-600 border-green-200' },
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.date || !newTask.title) {
        alert("La date et le titre sont requis");
        return;
      }
      const taskPayload = {
        title: newTask.title,
        task_type: newTask.type,
        date: newTask.date, // Envoie YYYY-MM-DD
        time: newTask.time,
        required_helpers: parseInt(newTask.required_helpers, 10),
        helper_name: 'À pourvoir',
      };
      if (circleId) taskPayload.circle_id = circleId;

      await apiPost('/tasks', taskPayload);
      await loadTasks();
      setShowAddTask(false);

      // Reset du formulaire
      setNewTask({
        title: '',
        type: 'activity',
        date: toLocalISOString(new Date()),
        time: '',
        required_helpers: 1
      });
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;
    try {
      await apiDelete(`/tasks/${taskId}`);
      await loadTasks();
      setSelectedTask(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVolunteer = async (taskId) => {
    try {
      if (!user || !user.id) {
        alert("Erreur : Veuillez vous reconnecter.");
        return;
      }
      await apiPost(`/tasks/${taskId}/volunteer`, { userId: user.id });
      alert("Merci ! Vous êtes maintenant volontaire.");
      await loadTasks();
      setSelectedTask(null);
    } catch (err) {
      // Gestion d'erreur simplifiée
      const msg = err.message || "";
      if (msg.includes('already')) alert("Vous êtes déjà inscrit !");
      else setError("Erreur lors de l'inscription : " + msg);
    }
  };

  const isUserVolunteer = (task) => {
    if (!task || !task.assigned_to || !user) return false;
    return task.assigned_to.includes(user.id);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement du calendrier...</div>;

  const currentWeekDays = getWeekDays();
  const startOfWeekDate = currentWeekDays[0].dateObj;
  const endOfWeekDate = currentWeekDays[6].dateObj;

  // Formatage du titre de la semaine (Ex: 15 - 21 Janvier 2024)
  const weekRangeTitle = `${startOfWeekDate.getDate()} - ${endOfWeekDate.getDate()} ${startOfWeekDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`;

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header Calendrier */}
        <div className="bg-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Calendrier Partagé</h1>
          <div className="flex items-center justify-between bg-blue-500/30 p-2 rounded-lg">
            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-blue-500 rounded-full transition"><ChevronLeft className="w-6 h-6 text-white" /></button>
            <span className="text-lg font-medium capitalize">{weekRangeTitle}</span>
            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-blue-500 rounded-full transition"><ChevronRight className="w-6 h-6 text-white" /></button>
          </div>
        </div>

        {/* Bouton Ajouter */}
        <div className="flex justify-end mb-6">
          <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md">
            <Plus className="w-5 h-5" /> Ajouter une tâche
          </button>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}

        {/* Grille du Calendrier */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {currentWeekDays.map((dayInfo) => {
            const dayTasks = getTasksForDate(dayInfo.dateISO);
            const isToday = dayInfo.dateISO === toLocalISOString(new Date());

            return (
              <div key={dayInfo.dateISO} className={`bg-white rounded-lg shadow border-t-4 ${isToday ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent'}`}>
                {/* En-tête du jour */}
                <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <span className="block text-sm text-gray-500 uppercase">{dayInfo.name}</span>
                  <span className={`block text-2xl font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{dayInfo.displayDate}</span>
                </div>

                {/* Liste des tâches du jour */}
                <div className="p-3 space-y-3 min-h-[150px]">
                  {dayTasks.map((task) => {
                    const typeInfo = taskTypeIcons[task.task_type] || taskTypeIcons.activity;
                    const Icon = typeInfo.icon;
                    const amIVolunteer = isUserVolunteer(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3 rounded-lg border ${amIVolunteer ? 'bg-green-50 border-green-300' : typeInfo.color} relative group shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                      >
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 bg-white rounded-full p-0.5 z-10"><X className="w-4 h-4" /></button>

                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words font-medium text-sm leading-tight">{task.title}</p>
                            <p className="text-gray-600 text-xs mt-1 font-mono">{task.time && task.time.slice(0, 5)}</p>
                          </div>
                        </div>

                        {/* Indicateurs bas de carte */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <User className="w-3 h-3 text-gray-500 shrink-0" />
                            <p className="text-gray-600 text-xs truncate">{task.helper_name}</p>
                          </div>
                          {task.required_helpers > 1 && (
                            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                              <Users className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-600">{task.required_helpers}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dayTasks.length === 0 && <div className="h-full flex items-center justify-center text-gray-300 text-sm italic py-4">Rien de prévu</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* --- MODAL AJOUT (Reste inchangé en logique structurelle) --- */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-900 text-xl font-bold">Nouvelle tâche</h2>
                <button onClick={() => setShowAddTask(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">Titre</label>
                  <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Rendez-vous docteur" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium text-sm">Date</label>
                    {/* Input date renvoie YYYY-MM-DD, parfait pour notre stockage string */}
                    <input type="date" value={newTask.date} onChange={(e) => setNewTask({ ...newTask, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div><label className="block text-gray-700 mb-2 font-medium text-sm">Heure</label><input type="time" value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                </div>
                {/* Sélecteur de Type */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['medical', 'shopping', 'activity'].map(type => (
                      <button key={type} onClick={() => setNewTask({ ...newTask, type })} className={`py-2 px-1 text-sm rounded-lg border ${newTask.type === type ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{type === 'medical' ? 'Médical' : type === 'shopping' ? 'Courses' : 'Activité'}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">Bénévoles requis</label>
                  <input type="number" min="1" max="10" value={newTask.required_helpers} onChange={(e) => setNewTask({ ...newTask, required_helpers: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3 pt-4 border-t mt-4">
                  <button onClick={() => setShowAddTask(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Annuler</button>
                  <button onClick={handleAddTask} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">Ajouter</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL DÉTAILS (Simplifié pour la lisibilité) --- */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-2 ${taskTypeIcons[selectedTask.task_type]?.color.split(' ')[0] || 'bg-gray-200'}`}></div>
              <div className="flex justify-between items-start mb-6 mt-2">
                <h2 className="text-xl font-bold text-gray-900 pr-8">{selectedTask.title}</h2>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {/* On réutilise new Date() ici pour l'affichage humain, ça marchera car l'objet Date s'adapte à la locale */}
                  <span>{new Date(selectedTask.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
                {selectedTask.time && <div className="flex items-center gap-3 text-gray-700"><Clock className="w-5 h-5 text-blue-500" /><span>{selectedTask.time.slice(0, 5)}</span></div>}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">Assigné à : <span className="font-bold">{selectedTask.helper_name}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                <button onClick={() => handleDeleteTask(selectedTask.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Supprimer</button>
                {!isUserVolunteer(selectedTask) ? (
                  <button onClick={() => handleVolunteer(selectedTask.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Volontaire</button>
                ) : (
                  <button disabled className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg cursor-not-allowed">Inscrit</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
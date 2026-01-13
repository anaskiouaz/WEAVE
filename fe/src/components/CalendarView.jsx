import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Stethoscope, Activity, User, Users } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';

export default function CalendarView() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // État du formulaire
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'activity',
    date: new Date().toISOString().split('T')[0], // Date par défaut : Aujourd'hui
    time: '',
    required_helpers: 1,
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Récupération des tâches au chargement
  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const result = await apiGet('/tasks');

        // Sécurité : On s'assure que c'est bien un tableau
        const tasksArray = Array.isArray(result) ? result : (result.data || []);
        
        console.log("Tâches reçues :", tasksArray);
        setTasks(tasksArray);
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
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const dayIndex = date.getDay(); // 0 = Dimanche, 1 = Lundi...
    // Astuce : getDay() renvoie 0 pour Dimanche. On doit mapper correctement.
    const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return dayMap[dayIndex];
  }

  function getTasksByDay(day) {
    return tasks.filter(task => {
        // On utilise 'start' (qui vient du backend) ou 'date' ou 'due_date'
        const taskDate = task.start || task.date || task.due_date;
        return getDateDayOfWeek(taskDate) === day;
    });
  }

  const taskTypeIcons = {
    medical: { icon: Stethoscope, color: 'bg-red-100 text-red-600 border-red-200' },
    shopping: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    activity: { icon: Activity, color: 'bg-green-100 text-green-600 border-green-200' },
  };

  const handleAddTask = async () => {
    try {
      // Validation basique
      if (!newTask.date || !newTask.title) {
        alert("La date et le titre sont requis");
        return;
      }

      // Construction du payload
      // CORRECTION ICI : On envoie 'due_date' au lieu de 'date' pour correspondre au backend
      const taskPayload = {
        title: newTask.title,
        task_type: newTask.type,
        due_date: newTask.date,   // <--- C'est ici que ça bloquait !
        time: newTask.time,
        required_helpers: parseInt(newTask.required_helpers, 10),
        helper_name: 'À pourvoir',
        senior_name: 'Grand-Père Michel',
      };

      console.log("Envoi de la tâche:", taskPayload); // Debug

      await apiPost('/tasks', taskPayload);

      // Rechargement immédiat de la liste pour voir la tâche apparaître
      const result = await apiGet('/tasks');
      const tasksArray = Array.isArray(result) ? result : (result.data || []);
      setTasks(tasksArray);

      // Reset du formulaire
      setShowAddTask(false);
      setNewTask({
        title: '',
        type: 'activity',
        date: new Date().toISOString().split('T')[0],
        time: '',
        required_helpers: 1
      });

    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiDelete(`/tasks/${taskId}`);
      
      // Rafraîchissement
      const result = await apiGet('/tasks');
      const tasksArray = Array.isArray(result) ? result : (result.data || []);
      setTasks(tasksArray);
      
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement du calendrier...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Calendrier partagé</h1>
            <p className="text-gray-600">
              Coordonnez les interventions de la semaine
            </p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter une tâche
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            Erreur : {error}
          </div>
        )}

        {/* Grille du Calendrier */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysOfWeek.map((day) => {
            const dayTasks = getTasksByDay(day);

            return (
              <div key={day} className="bg-white rounded-lg shadow min-h-[200px] md:min-h-[400px]">
                <div className="p-4 border-b bg-blue-50 rounded-t-lg">
                  <h3 className="text-blue-900 text-center font-medium">{day}</h3>
                </div>
                <div className="p-3 space-y-2">
                  {dayTasks.map((task) => {
                    const typeInfo = taskTypeIcons[task.task_type] || taskTypeIcons.activity;
                    const Icon = typeInfo.icon;

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${typeInfo.color} relative group transition-all hover:shadow-md`}
                      >
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 p-1 bg-white/50 rounded"
                          title="Supprimer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words font-medium text-sm leading-tight">{task.title}</p>
                            {task.time && <p className="text-gray-600 text-xs mt-1">🕒 {task.time}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-500" />
                            <p className="text-gray-600 text-xs truncate max-w-[80px]">
                                {task.helper_name || 'Libre'}
                            </p>
                          </div>
                          {task.required_helpers > 1 && (
                            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                              <Users className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-semibold text-gray-600">{task.required_helpers}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dayTasks.length === 0 && (
                     <div className="text-center py-8 text-gray-300 text-sm italic">
                        Rien de prévu
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modale Ajout Tâche */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-gray-900 text-xl font-bold">Nouvelle tâche</h2>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Titre de la tâche</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Ex: Rendez-vous Cardiologue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Date</label>
                    <input
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Heure</label>
                    <input
                      type="time"
                      value={newTask.time}
                      onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5 text-sm font-semibold">Type de tâche</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="medical">🩺 Médical</option>
                    <option value="shopping">🛒 Courses</option>
                    <option value="activity">🏃 Activité</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-1.5 text-sm font-semibold">
                    Nombre d'aidants requis
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newTask.required_helpers}
                      onChange={(e) => setNewTask({ ...newTask, required_helpers: e.target.value })}
                      className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-2">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-all transform active:scale-95"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
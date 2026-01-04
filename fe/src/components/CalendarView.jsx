import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Stethoscope, Activity, User } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';

export default function CalendarView() {
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'activity',
    day: 'lundi',
    time: '',
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Fetch tasks from API
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

  // Convert date string to day of week
  function getDateDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return dayMap[dayIndex];
  }

  // Group tasks by day
  function getTasksByDay(day) {
    return tasks.filter(task => getDateDayOfWeek(task.date) === day);
  }

  const taskTypeIcons = {
    medical: { icon: Stethoscope, color: 'bg-red-100 text-red-600 border-red-200' },
    shopping: { icon: ShoppingCart, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    activity: { icon: Activity, color: 'bg-green-100 text-green-600 border-green-200' },
  };

  const handleAddTask = async () => {
    try {
      const taskPayload = {
        date: new Date().toISOString().split('T')[0], // Today's date for now
        time: newTask.time,
        title: newTask.title,
        task_type: newTask.type,
        helper_name: 'À pourvoir',
        senior_name: 'Grand-Père Michel',
      };

      await apiPost('/tasks', taskPayload);
      const data = await apiGet('/tasks');
      setTasks(data.data || []);
      setShowAddTask(false);
      setNewTask({ title: '', type: 'activity', day: 'lundi', time: '' });
    } catch (err) {
      console.error('Error adding task:', err);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await apiDelete(`/tasks/${taskId}`);
      const data = await apiGet('/tasks');
      setTasks(data.data || []);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement des tâches...</div>;
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
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((day) => {
            const dayTasks = getTasksByDay(day);

            return (
              <div key={day} className="bg-white rounded-lg shadow">
                <div className="p-4 border-b bg-blue-50">
                  <h3 className="text-blue-900 text-center">{day}</h3>
                </div>
                <div className="p-3 space-y-2 min-h-[400px]">
                  {dayTasks.map((task) => {
                    const typeInfo = taskTypeIcons[task.task_type] || taskTypeIcons.activity;
                    const Icon = typeInfo.icon;

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border ${typeInfo.color} relative group`}
                      >
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className="w-4 h-4 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 break-words">{task.title}</p>
                            <p className="text-gray-600">{task.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t">
                          <User className="w-3 h-3 text-gray-500" />
                          <p className="text-gray-600">{task.helper_name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-900 mb-4">Légende</h3>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span className="text-gray-700">Médical</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-gray-700">Courses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-gray-700">Activité</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-900">Nouvelle tâche</h2>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Titre de la tâche</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Visite médicale"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Type de tâche</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="medical">Médical</option>
                  <option value="shopping">Courses</option>
                  <option value="activity">Activité</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Heure</label>
                <input
                  type="time"
                  value={newTask.time}
                  onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


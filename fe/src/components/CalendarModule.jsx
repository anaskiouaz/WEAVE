import { useState, useEffect } from 'react';
import { Plus, X, ShoppingCart, Stethoscope, Activity, User, Users, ArrowLeft } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function CalendarModule() {
  const navigate = useNavigate();
  const [showAddTask, setShowAddTask] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Récupération de l'ID stocké par le Dashboard
  const currentCircleId = localStorage.getItem('weave_current_circle');

  const [newTask, setNewTask] = useState({
    title: '', type: 'activity', date: new Date().toISOString().split('T')[0], time: '', required_helpers: 1
  });

  const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  useEffect(() => {
    if (!currentCircleId) { navigate('/'); return; } // Retour si pas de cercle
    fetchTasks();
  }, [currentCircleId]);

  async function fetchTasks() {
    try {
      setLoading(true);
      // Appel à ton module backend
      const res = await apiGet(`/module/calendar/tasks?circleId=${currentCircleId}`);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.date) return alert("Titre et date requis");
    try {
      await apiPost('/module/calendar/tasks', {
        ...newTask,
        circle_id: currentCircleId // Utilisation de l'ID correct
      });
      fetchTasks();
      setShowAddTask(false);
      setNewTask({ ...newTask, title: '' });
    } catch (err) {
      console.error(err);
      alert("Erreur ajout tâche");
    }
  };

  const handleDeleteTask = async (id) => {
      if(!confirm("Supprimer cette tâche ?")) return;
      try {
          await apiDelete(`/module/calendar/tasks/${id}`);
          fetchTasks();
      } catch(e) { console.error(e); }
  };

  const getTasksByDay = (dayName) => {
    return tasks.filter(t => {
        const d = new Date(t.date);
        const dayMap = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return dayMap[d.getDay()] === dayName;
    });
  };

  const taskIcons = { medical: Stethoscope, shopping: ShoppingCart, activity: Activity };
  const taskColors = { medical: 'border-red-200 bg-red-50', shopping: 'border-blue-200 bg-blue-50', activity: 'border-green-200 bg-green-50' };

  if (loading) return <div className="p-10 text-center">Chargement...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6"><ArrowLeft size={20}/> Retour</button>
        
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Calendrier Partagé</h1>
            <button onClick={() => setShowAddTask(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
                <Plus size={20}/> Ajouter une tâche
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 font-bold text-center text-gray-700">{day}</div>
                    <div className="p-2 flex-1 space-y-2">
                        {getTasksByDay(day).map(t => {
                            const Icon = taskIcons[t.task_type] || Activity;
                            return (
                                <div key={t.id} className={`p-3 rounded-lg border relative group bg-white shadow-sm ${taskColors[t.task_type] || taskColors.activity}`}>
                                    <button onClick={() => handleDeleteTask(t.id)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500"><X size={14}/></button>
                                    <div className="flex gap-2">
                                        <Icon size={16} className="mt-1"/>
                                        <div className="overflow-hidden">
                                            <p className="font-bold text-sm truncate">{t.title}</p>
                                            <p className="text-xs text-gray-500">{t.time.substring(0,5)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-black/5 flex justify-between items-center text-xs text-gray-600">
                                        <span className="flex gap-1 items-center"><User size={12}/> {t.helper_name}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {showAddTask && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex justify-between mb-4">
                        <h2 className="text-xl font-bold">Nouvelle tâche</h2>
                        <button onClick={() => setShowAddTask(false)}><X/></button>
                    </div>
                    <div className="space-y-4">
                        <input type="text" placeholder="Titre" className="w-full p-3 border rounded" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" className="w-full p-3 border rounded" value={newTask.date} onChange={e => setNewTask({...newTask, date: e.target.value})}/>
                            <input type="time" className="w-full p-3 border rounded" value={newTask.time} onChange={e => setNewTask({...newTask, time: e.target.value})}/>
                        </div>
                        <select className="w-full p-3 border rounded bg-white" value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value})}>
                            <option value="activity">Activité</option>
                            <option value="medical">Médical</option>
                            <option value="shopping">Courses</option>
                        </select>
                        <button onClick={handleAddTask} className="w-full py-3 bg-blue-600 text-white rounded font-bold">Confirmer</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, ShoppingCart, Stethoscope, Activity, User,
  ChevronLeft, ChevronRight, Calendar, CheckCircle,
  LayoutGrid, List as ListIcon
} from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '../api/client';
import { useAuth } from '../context/AuthContext';
import TaskDetailsModal from './ui-desktop/TaskDetailsModal';
import AddTaskModal from './ui-desktop/AddTaskModal';

const getTaskTypeConfig = (taskType) => {
  const PREDEFINED = {
    medical: { label: 'Médical', icon: Stethoscope, color: 'text-rose-600', bg: 'bg-rose-100' },
    shopping: { label: 'Courses', icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    activity: { label: 'Activité', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  };
  
  if (PREDEFINED[taskType]) return PREDEFINED[taskType];
  
  const colors = ['text-blue-600', 'text-purple-600', 'text-pink-600', 'text-cyan-600', 'text-amber-600'];
  const bgs = ['bg-blue-100', 'bg-purple-100', 'bg-pink-100', 'bg-cyan-100', 'bg-amber-100'];
  const index = (taskType?.charCodeAt(0) || 0) % colors.length;
  
  return {
    label: taskType || 'Tâche',
    icon: Activity,
    color: colors[index],
    bg: bgs[index]
  };
};

const TaskCard = ({ task, onClick, currentUserId, onVolunteer, viewMode = 'card' }) => {
  const config = getTaskTypeConfig(task.task_type);
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
    <div onClick={() => onClick(task)} className={`relative p-3 rounded-xl bg-white border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col gap-2 ${task.completed ? 'border-emerald-200 ring-1 ring-emerald-100 bg-emerald-50' : isSigned ? 'border-green-200 ring-1 ring-green-100' : 'border-slate-100'}`}>
      <div className="flex justify-between items-center">
        <span className={`p-1 rounded-md flex items-center justify-center ${config.bg} ${config.color}`} title={config.label} aria-label={config.label}>
          <Icon className="w-3 h-3" />
        </span>
        <div className="flex items-center gap-2">
          {task.time && <span className="text-xs font-medium text-slate-400">{task.time.slice(0, 5)}</span>}
          {task.completed && <CheckCircle className="w-4 h-4 text-emerald-600" />}
        </div>
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
            {Object.entries(summary).map(([type, count]) => {
              const bgColor = getTaskTypeConfig(type).bg.replace('bg-', 'bg-');
              return <div key={type} className={`h-1.5 rounded-full bg-${bgColor}`} style={{ width: `${Math.min(count * 6, 24)}px` }} />;
            })}
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

export default function CalendarView() {
  const { circleId, user } = useAuth();
  const [viewMode, setViewMode] = useState('week');
  const [now, setNow] = useState(new Date());

  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ type: null, message: null });
  const [circleMemberSkills, setCircleMemberSkills] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: null, message: null }), 4000);
  };

  const loadCircleSkills = async () => {
    try {
      const allSkills = await apiGet(`/skills`);
      setCircleMemberSkills(Array.isArray(allSkills) ? allSkills : []);
    } catch (e) { console.error(e); }
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

  useEffect(() => { 
    loadTasks(); 
    loadCircleSkills();
  }, [circleId]);

  // CORRECTION MAJEURE ICI : Calcul de dateISO en local pour éviter le décalage UTC
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      
      // Construction manuelle de YYYY-MM-DD en heure locale
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      const dateISO = `${year}-${month}-${dayVal}`;

      return {
        name: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(d),
        dateISO: dateISO, // Plus de décalage -1 jour
        displayDate: d.getDate()
      };
    });
  }, [currentDate]);

  const groupedTasks = useMemo(() => {
    const sorted = tasks.slice().sort((a, b) => {
      const dateA = a.date.split('T')[0];
      const dateB = b.date.split('T')[0];
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return timeA.localeCompare(timeB);
    });
    return sorted.reduce((acc, t) => {
      const d = (t.date || '').split('T')[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push(t);
      return acc;
    }, {});
  }, [tasks]);

  const openAddModal = (dateISO) => {
    // Si dateISO est fournie, on l'utilise, sinon date locale du jour
    let targetDate = dateISO;
    if (!targetDate) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${dayVal}`;
    }
    setAddTaskDate(targetDate);
    setShowAddTask(true);
  };

  const handleCreateTask = async (formData) => {
    try {
      const payload = {
        ...formData,
        circle_id: circleId,
        helper_name: 'À pourvoir',
        task_type: formData.type
      };
      await apiPost('/tasks', payload);
      (async () => {
        try {
          await apiPost('/users/audit-logs', {
            userId: user?.id || null,
            action: 'TASK_CREATED',
            details: `${user?.name || 'Utilisateur'} a créé la tâche "${formData.title}"`,
            circleId: circleId || null
          });
        } catch (e) { console.debug(e); }
      })();
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
      (async () => {
        try {
          const task = tasks.find(t => String(t.id) === String(taskId));
          await apiPost('/users/audit-logs', {
            userId: user.id,
            action: 'TASK_VOLUNTEERED',
            details: `${user.name || 'Utilisateur'} s'est engagé(e) sur \"${task?.title || taskId}\"`,
            circleId: task?.circle_id || circleId || null
          });
        } catch (e) { console.debug(e); }
      })();
      await loadTasks();
      setSelectedTask(null);
    } catch (err) { showNotification('error', "Erreur inscription"); }
  };

  const handleUnvolunteer = async (taskId) => {
    try {
      await apiPost(`/tasks/${taskId}/unvolunteer`, { userId: user.id });
      (async () => {
        try {
          const task = tasks.find(t => String(t.id) === String(taskId));
          await apiPost('/users/audit-logs', {
            userId: user.id,
            action: 'TASK_WITHDRAWN',
            details: `${user.name || 'Utilisateur'} s'est retiré(e) de \"${task?.title || taskId}\"`,
            circleId: task?.circle_id || circleId || null
          });
        } catch (e) { console.debug(e); }
      })();
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

  const currentCircleRole = useMemo(() => {
    const match = (user?.circles || []).find(c => String(c.id ?? c.circle_id) === String(circleId));
    return (match?.role || '').toUpperCase();
  }, [user?.circles, circleId]);

  const canValidate = (task) => {
    const roleOK = currentCircleRole === 'ADMIN' || currentCircleRole === 'HELPER';
    const assigned = Array.isArray(task?.assigned_to) ? task.assigned_to : [];
    const notYetValidated = !task?.completed; 
    if (!roleOK || assigned.length === 0 || !notYetValidated) return false;
    return true;
  };

  const canUnvalidate = (task) => {
    const roleOK = currentCircleRole === 'ADMIN' || currentCircleRole === 'HELPER';
    return roleOK && task?.completed === true;
  };

  const handleValidateTask = async (taskId) => {
    try {
      await apiPost(`/tasks/${taskId}/validate`, { validatedBy: user?.id || null });
      showNotification('success', 'Intervention validée');
      await loadTasks();
      setSelectedTask(null);
    } catch (err) {
      showNotification('error', "Erreur lors de la validation");
    }
  };

  const handleUnvalidateTask = async (taskId) => {
    try {
      await apiPost(`/tasks/${taskId}/unvalidate`, { cancelledBy: user?.id || null });
      showNotification('success', 'Validation annulée');
      await loadTasks();
      setSelectedTask(null);
    } catch (err) {
      showNotification('error', "Erreur lors de l'annulation de validation");
    }
  };

  // On calcule l'ISO local pour la mise en évidence d'aujourd'hui
  const todayISO = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${dayVal}`;
  })();

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }} className="p-1.5 hover:bg-white rounded-md transition"><ChevronLeft className="w-5 h-5 text-slate-500" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-slate-600 hover:text-blue-600">Auj.</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }} className="p-1.5 hover:bg-white rounded-md transition"><ChevronRight className="w-5 h-5 text-slate-500" /></button>
            </div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}</h2>
            <div className="hidden md:flex flex-col text-sm text-slate-500 ml-4">
              <span className="font-semibold text-slate-700">{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}</span>
              <span className="tabular-nums">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
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

        {notification.message && (
          <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 z-50 ${notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : (
          viewMode === 'week' ? (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map(day => (
                <DayColumn
                  key={day.dateISO} dayInfo={day}
                  tasks={tasks.filter(t => {
                    const taskDate = t.date.split('T')[0];
                    return taskDate === day.dateISO;
                  })}
                  isToday={day.dateISO === todayISO}
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
                        <div className="text-sm font-bold">{new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
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

        <AddTaskModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          onSave={handleCreateTask}
          prefillDate={addTaskDate}
          skills={circleMemberSkills}
        />

        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={() => handleDeleteTask(selectedTask?.id)}
          onVolunteer={() => handleVolunteer(selectedTask?.id)}
          onUnvolunteer={() => handleUnvolunteer(selectedTask?.id)}
          currentUserId={user?.id}
          onValidate={() => handleValidateTask(selectedTask?.id)}
          onUnvalidate={() => handleUnvalidateTask(selectedTask?.id)}
          canValidate={selectedTask ? canValidate(selectedTask) : false}
          canUnvalidate={selectedTask ? canUnvalidate(selectedTask) : false}
        />

      </div>
    </div>
  );
}
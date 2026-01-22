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
    medical: { label: 'Médical', icon: Stethoscope, color: 'text-[#F08080]', bg: 'bg-[#F08080]/15' },
    shopping: { label: 'Courses', icon: ShoppingCart, color: 'text-[#4A6A8A]', bg: 'bg-[#4A6A8A]/15' },
    activity: { label: 'Activité', icon: Activity, color: 'text-[#A7C9A7]', bg: 'bg-[#A7C9A7]/30' },
  };
  
  if (PREDEFINED[taskType]) return PREDEFINED[taskType];
  
  const colors = ['text-[#4A6A8A]', 'text-[#A7C9A7]', 'text-[#F08080]', 'text-[#6B8AAA]', 'text-[#8FB98F]'];
  const bgs = ['bg-[#4A6A8A]/15', 'bg-[#A7C9A7]/20', 'bg-[#F08080]/15', 'bg-[#6B8AAA]/15', 'bg-[#8FB98F]/20'];
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
      <div onClick={() => onClick(task)} className="flex items-center gap-4 p-3 border-b last:border-0 transition cursor-pointer group" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
      >
        <div className="w-16 flex flex-col items-center justify-center shrink-0">
          <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{task.time ? task.time.slice(0, 5) : '--:--'}</span>
        </div>
        <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}><Icon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>{task.helper_name}</span>
            {isSigned && <span className="font-semibold flex items-center gap-0.5" style={{ color: 'var(--sage-green)' }}><CheckCircle className="w-3 h-3" /> Inscrit</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick(task)} 
      className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col gap-2 hover:-translate-y-0.5 ${task.completed ? 'ring-1' : isSigned ? 'ring-1' : ''}`}
      style={{ 
        backgroundColor: task.completed ? 'rgba(167, 201, 167, 0.08)' : 'var(--bg-card)',
        borderColor: task.completed ? 'var(--sage-green)' : isSigned ? 'rgba(167, 201, 167, 0.5)' : 'var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div className="flex justify-between items-center">
        <span className={`p-1.5 rounded-xl flex items-center justify-center ${config.bg} ${config.color}`} title={config.label} aria-label={config.label}>
          <Icon className="w-3 h-3" />
        </span>
        <div className="flex items-center gap-2">
          {task.time && <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{task.time.slice(0, 5)}</span>}
          {task.completed && <CheckCircle className="w-4 h-4" style={{ color: 'var(--sage-green)' }} />}
        </div>
      </div>
      <h4 className="font-bold text-sm leading-tight line-clamp-2" style={{ color: 'var(--text-primary)' }}>{task.title}</h4>
      <div className="flex items-center justify-between pt-1 mt-auto">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}><User className="w-3 h-3" /></div>
          <span className={`text-xs truncate max-w-[80px] font-semibold`} style={{ color: isSigned ? 'var(--sage-green)' : 'var(--text-secondary)' }}>{task.helper_name === 'À pourvoir' ? 'Libre' : task.helper_name}</span>
        </div>
      </div>
    </div>
  );
};

const DayColumn = ({ dayInfo, tasks, isToday, onTaskClick, onAddTask }) => {
  const summary = tasks.reduce((acc, t) => { const type = t.task_type || 'activity'; acc[type] = (acc[type] || 0) + 1; return acc; }, {});
  const hasTasks = tasks.length > 0;

  return (
    <div 
      className={`flex flex-col rounded-3xl transition-all h-full min-h-[150px]`}
      style={{ 
        backgroundColor: isToday ? 'rgba(240, 128, 128, 0.08)' : 'var(--bg-card)',
        boxShadow: isToday ? '0 0 0 2px rgba(240, 128, 128, 0.2)' : 'none'
      }}
    >
      <div className={`p-2 text-center border-b`} style={{ borderColor: isToday ? 'rgba(240, 128, 128, 0.2)' : 'transparent' }}>
        <div className="flex flex-col items-center">
          <span className={`text-[11px] font-bold uppercase`} style={{ color: isToday ? 'var(--soft-coral)' : 'var(--text-secondary)' }}>{dayInfo.name}</span>
          <div 
            className={`w-8 h-8 flex items-center justify-center rounded-xl text-lg font-bold mt-1`}
            style={{ 
              backgroundColor: isToday ? 'var(--soft-coral)' : 'transparent',
              color: isToday ? 'white' : 'var(--text-primary)',
              boxShadow: isToday ? '0 4px 12px rgba(240, 128, 128, 0.3)' : 'none'
            }}
          >{dayInfo.displayDate}</div>
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
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
              style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(240, 128, 128, 0.15)'; e.currentTarget.style.color = 'var(--soft-coral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            ><Plus className="w-4 h-4" /></div>
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
      await apiDelete(`/tasks/${taskId}/volunteer`, { userId: user.id });
      
      (async () => {
        try {
          const task = tasks.find(t => String(t.id) === String(taskId));
          await apiPost('/users/audit-logs', {
            userId: user.id,
            action: 'TASK_WITHDRAWN',
            details: `${user.name || 'Utilisateur'} s'est retiré(e) de "${task?.title || taskId}"`,
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
    <div className="min-h-screen font-sans p-4 md:p-6" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-2xl p-1" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d) }} className="p-2 rounded-xl transition-all hover:-translate-y-0.5" style={{ color: 'var(--text-secondary)' }}><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-bold transition-colors" style={{ color: 'var(--text-primary)' }}>Auj.</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d) }} className="p-2 rounded-xl transition-all hover:-translate-y-0.5" style={{ color: 'var(--text-secondary)' }}><ChevronRight className="w-5 h-5" /></button>
            </div>
            <h2 className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}</h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--soft-coral)' }}>Sem. {(() => { const d = new Date(currentDate); const startOfYear = new Date(d.getFullYear(), 0, 1); const dayOfYear = Math.floor((d - startOfYear) / 86400000); const firstMonday = (8 - startOfYear.getDay()) % 7; return Math.floor((dayOfYear - firstMonday + 7) / 7) + 1; })()}</span>
            <div className="hidden md:flex flex-col text-sm ml-4" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)}</span>
              <span className="tabular-nums">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-1 rounded-2xl flex items-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <button onClick={() => setViewMode('week')} className={`p-2 rounded-xl transition-all`} style={{ backgroundColor: viewMode === 'week' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'week' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: viewMode === 'week' ? 'var(--shadow-sm)' : 'none' }}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all`} style={{ backgroundColor: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none' }}><ListIcon className="w-4 h-4" /></button>
            </div>
            <button onClick={() => openAddModal()} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-full font-semibold transition-all hover:-translate-y-0.5" style={{ backgroundColor: 'var(--soft-coral)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}>
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Nouvelle tâche</span>
            </button>
          </div>
        </div>

        {notification.message && (
          <div 
            className={`fixed bottom-6 right-6 p-4 rounded-2xl border-2 animate-in slide-in-from-bottom-5 z-50 font-semibold`}
            style={{ 
              backgroundColor: notification.type === 'error' ? 'rgba(240, 128, 128, 0.15)' : 'rgba(167, 201, 167, 0.15)',
              color: notification.type === 'error' ? 'var(--soft-coral)' : 'var(--text-primary)',
              borderColor: notification.type === 'error' ? 'rgba(240, 128, 128, 0.3)' : 'rgba(167, 201, 167, 0.3)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--soft-coral)' }}></div></div>
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
                <div className="rounded-3xl p-6 text-center font-semibold" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>Aucune tâche</div>
              ) : (
                Object.entries(groupedTasks).map(([date, items]) => (
                  <div key={date} className="rounded-3xl p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{new Date(date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{date}</div>
                      </div>
                      <div>
                        <button onClick={() => openAddModal(date)} className="text-sm font-semibold transition-colors" style={{ color: 'var(--soft-coral)' }}>Ajouter</button>
                      </div>
                    </div>
                    <div className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
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
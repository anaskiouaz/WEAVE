import { X, Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

// On reprend la config pour que les couleurs matchent le calendrier
const MODAL_THEME = {
    medical: { header: 'bg-rose-500', iconBg: 'bg-rose-600', text: 'text-rose-600', light: 'bg-rose-50' },
    shopping: { header: 'bg-indigo-500', iconBg: 'bg-indigo-600', text: 'text-indigo-600', light: 'bg-indigo-50' },
    activity: { header: 'bg-emerald-500', iconBg: 'bg-emerald-600', text: 'text-emerald-600', light: 'bg-emerald-50' },
};

const TaskDetailsModal = ({ task, onClose, onDelete, onVolunteer, onUnvolunteer, currentUserId }) => {
    if (!task) return null;

    const theme = MODAL_THEME[task.task_type] || MODAL_THEME.activity;
    const isSigned = currentUserId && task.assigned_to && task.assigned_to.includes(currentUserId);

    // Formatage de la date complet (ex: Mardi 14 Octobre)
    const dateStr = new Date(task.date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop flou et sombre */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Carte Modale */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">

                {/* 1. Header Coloré & Bouton Fermer */}
                <div className={`${theme.header} h-28 relative flex items-start justify-end p-4`}>
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icône flottante (Chevauche le header et le body) */}
                    <div className={`absolute -bottom-8 left-8 w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-white ${theme.iconBg}`}>
                        {/* On réutilise l'icône de ton objet TASK_TYPES si passé, sinon une par défaut */}
                        <Calendar className="w-8 h-8" />
                    </div>
                </div>

                {/* 2. Corps du Pop-up */}
                <div className="pt-10 px-8 pb-8">
                    {/* Titre et Type */}
                    <div className="mb-6">
                        <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${theme.text}`}>
                            {task.task_type === 'shopping' ? 'Courses' : task.task_type === 'medical' ? 'Médical' : 'Activité'}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
                            {task.title}
                        </h2>
                    </div>

                    {/* Infos Pratiques (Grille) */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="font-medium capitalize">{dateStr}</span>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex-1 flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="font-medium">{task.time ? task.time.slice(0, 5) : '--:--'}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <User className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="font-medium truncate">
                                    {task.helper_name === 'À pourvoir' ? 'Personne' : task.helper_name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description (Optionnel) */}
                    {task.description && (
                        <div className="mb-8 text-slate-500 text-sm leading-relaxed">
                            {task.description}
                        </div>
                    )}

                    {/* 3. Actions (Bas de page) */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                        {/* Bouton Supprimer (Discret) */}
                        <button
                            onClick={() => onDelete(task.id)}
                            className="p-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Supprimer la tâche"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        {/* Bouton Principal (Action) */}
                        {isSigned ? (
                            <button
                                onClick={() => onUnvolunteer(task.id)}
                                className="flex-1 bg-amber-100 text-amber-700 hover:bg-amber-200 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="w-5 h-5" /> Me désister
                            </button>
                        ) : (
                            <button
                                onClick={() => onVolunteer(task.id)}
                                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 py-3 px-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" /> Je m'en occupe
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
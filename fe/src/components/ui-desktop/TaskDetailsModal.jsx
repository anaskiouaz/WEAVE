import { X, Calendar, Clock, MapPin, User, CheckCircle, AlertCircle, Trash2, Stethoscope, ShoppingCart, Activity } from 'lucide-react';

// Config des types de tâches avec icônes
const TASK_TYPES_CONFIG = {
  medical: { icon: Stethoscope, label: 'Médical' },
  shopping: { icon: ShoppingCart, label: 'Courses' },
  activity: { icon: Activity, label: 'Activité' },
};

const TaskDetailsModal = ({ task, onClose, onDelete, onVolunteer, onUnvolunteer, onValidate, onUnvalidate, canValidate, canUnvalidate, currentUserId }) => {
    if (!task) return null;

    const isSigned = currentUserId && task.assigned_to && task.assigned_to.includes(currentUserId);

    // Formatage de la date complet (ex: Mardi 14 Octobre)
    const dateStr = new Date(task.date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop flou et sombre */}
            <div
                className="absolute inset-0 backdrop-blur-sm transition-opacity"
                style={{ backgroundColor: 'var(--overlay)' }}
                onClick={onClose}
            />

            {/* Carte Modale */}
            <div 
                className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
                style={{ backgroundColor: 'var(--bg-card)' }}
            >

                {/* 1. Header Coloré & Bouton Fermer */}
                <div 
                    className="h-28 relative flex items-start justify-end p-4"
                    style={{ background: 'linear-gradient(135deg, var(--soft-coral), var(--sage-green))' }}
                >
                    <button
                        onClick={onClose}
                        className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icône flottante (Chevauche le header et le body) */}
                    <div 
                        className="absolute -bottom-8 left-8 w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: 'var(--soft-coral)' }}
                    >
                        {(() => {
                            const IconComponent = TASK_TYPES_CONFIG[task.task_type]?.icon || Activity;
                            return <IconComponent className="w-8 h-8" />;
                        })()}
                    </div>
                </div>

                {/* 2. Corps du Pop-up */}
                <div className="pt-10 px-8 pb-8">
                    {/* Titre et Type */}
                    <div className="mb-6">
                        <span 
                            className="text-xs font-bold uppercase tracking-wider mb-2 block"
                            style={{ color: 'var(--soft-coral)' }}
                        >
                            {task.task_type}
                        </span>
                        <h2 className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                            {task.title}
                        </h2>
                    </div>

                    {/* Infos Pratiques (Grille) */}
                    <div className="grid grid-cols-1 gap-4 mb-6">
                        <div 
                            className="flex items-center gap-3 p-3 rounded-xl border"
                            style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                        >
                            <Calendar className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                            <span className="font-medium capitalize">{dateStr}</span>
                        </div>

                        <div className="flex gap-3">
                            <div 
                                className="flex-1 flex items-center gap-3 p-3 rounded-xl border"
                                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                            >
                                <Clock className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                <span className="font-medium">{task.time ? task.time.slice(0, 5) : '--:--'}</span>
                            </div>
                            <div 
                                className="flex-1 flex items-center gap-3 p-3 rounded-xl border"
                                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}
                            >
                                <User className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                                <span className="font-medium truncate">
                                    {task.helper_name === 'À pourvoir' ? 'Personne' : task.helper_name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Description (Optionnel) */}
                    {task.description && (
                        <div className="mb-8 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {task.description}
                        </div>
                    )}

                    {/* 3. Actions (Bas de page) */}
                    <div 
                        className="flex items-center gap-3 mt-4 pt-4 flex-wrap"
                        style={{ borderTop: '1px solid var(--border-light)' }}
                    >
                        {/* Bouton Supprimer (Discret) */}
                        <button
                            onClick={() => onDelete(task.id)}
                            className="p-3 rounded-xl transition-colors hover:bg-red-50"
                            style={{ color: 'var(--text-muted)' }}
                            title="Supprimer la tâche"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>

                        {/* Bouton Principal (Action) */}
                        {isSigned ? (
                            <button
                                onClick={() => onUnvolunteer(task.id)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#D97706' }}
                            >
                                <X className="w-5 h-5" /> Me désister
                            </button>
                        ) : (
                            <button
                                onClick={() => onVolunteer(task.id)}
                                className="flex-1 text-white py-3 px-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--soft-coral)', boxShadow: 'var(--shadow-glow)' }}
                            >
                                <CheckCircle className="w-5 h-5" /> Je m'en occupe
                            </button>
                        )}

                        {/* Bouton Valider (si autorisé) */}
                        {canValidate && (
                            <button
                                onClick={() => onValidate(task.id)}
                                className="flex-1 text-white py-3 px-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--sage-green)', boxShadow: '0 4px 16px rgba(167, 201, 167, 0.3)' }}
                            >
                                <CheckCircle className="w-5 h-5" /> Valider
                            </button>
                        )}

                        {canUnvalidate && (
                            <button
                                onClick={() => onUnvalidate(task.id)}
                                className="flex-1 text-white py-3 px-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                style={{ backgroundColor: '#D97706', boxShadow: '0 4px 16px rgba(217, 119, 6, 0.3)' }}
                            >
                                <AlertCircle className="w-5 h-5" /> Annuler la validation
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailsModal;
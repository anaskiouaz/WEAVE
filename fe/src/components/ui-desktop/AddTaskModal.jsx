import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import { SKILL_OPTIONS } from '../../constants/skills';

export default function AddTaskModal({ isOpen, onClose, onSave, prefillDate, skills = [] }) {
    const [formData, setFormData] = useState({
        title: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        required_helpers: 1,
        description: ''
    });

    // Mettre à jour la date si on ouvre via le bouton "+" d'un jour spécifique
    useEffect(() => {
        if (isOpen && prefillDate) {
            setFormData(prev => ({ ...prev, date: prefillDate }));
        }
    }, [isOpen, prefillDate]);

    // Définir la compétence par défaut quand la modale s'ouvre ou que la liste change
    useEffect(() => {
        if (!isOpen) return;
        // Merge master list with dynamic backend list and dedupe
        const merged = Array.from(new Set([...(Array.isArray(skills) ? skills : []), ...SKILL_OPTIONS]
          .map(s => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean)
        ));
        const defaultList = merged.length > 0 ? merged : ['Autre'];
        const current = formData.type;
        if (!current || ![...defaultList, 'Autre'].includes(current)) {
            setFormData(prev => ({ ...prev, type: defaultList[0] || 'Autre' }));
        }
    }, [isOpen, skills]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.date) return;
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-800">Nouvelle tâche</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 1. Titre */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Titre de la tâche</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            placeholder="Ex: Rendez-vous cardiologue, Courses semaine..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* 2. Type de tâche (liste de compétences) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Type (Compétence)</label>
                        {(() => {
                            const merged = Array.from(new Set([...(Array.isArray(skills) ? skills : []), ...SKILL_OPTIONS]
                              .map(s => (typeof s === 'string' ? s.trim() : ''))
                              .filter(Boolean)
                            ));
                            const withOther = merged.includes('Autre') ? merged : [...merged, 'Autre'];
                            return (
                        <select
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        >
                            {withOther.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                            );
                        })()}
                    </div>

                    {/* 3. Date et Heure */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Heure</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Nombre d'aidants */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Aidants requis</label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    value={formData.required_helpers}
                                    onChange={e => setFormData({ ...formData, required_helpers: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <span className="text-sm text-slate-500 font-medium">personne(s)</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                        >
                            Créer la tâche
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Check } from 'lucide-react';
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
    const [showCustomType, setShowCustomType] = useState(false);
    const [customType, setCustomType] = useState('');

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
        
        // Si un type personnalisé est en cours de saisie, l'utiliser
        const finalData = {
            ...formData,
            type: (showCustomType && customType.trim()) ? customType.trim() : formData.type
        };
        onSave(finalData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 backdrop-blur-sm transition-opacity" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }} onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: 'var(--bg-card)' }}>

                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-medium)', backgroundColor: 'var(--bg-secondary)' }}>
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Nouvelle tâche</h2>
                    <button onClick={onClose} className="p-2 rounded-full transition" style={{ color: 'var(--text-muted)' }}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* 1. Titre */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Titre de la tâche</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            placeholder="Ex: Rendez-vous cardiologue, Courses semaine..."
                            className="w-full p-3 rounded-xl font-medium focus:outline-none focus:ring-2 transition-all"
                            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--soft-coral)' }}
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* 2. Type de tâche (liste de compétences) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Type (Compétence)</label>
                        {(() => {
                            const merged = Array.from(new Set([...(Array.isArray(skills) ? skills : []), ...SKILL_OPTIONS]
                              .map(s => (typeof s === 'string' ? s.trim() : ''))
                              .filter(Boolean)
                            ));
                            return (
                              <div className="flex flex-wrap gap-2">
                                {merged.map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => { setFormData({ ...formData, type: opt }); setShowCustomType(false); }}
                                    className="px-3 py-2 rounded-full text-sm font-semibold transition-all border-2"
                                    style={{
                                      backgroundColor: formData.type === opt ? 'rgba(240, 128, 128, 0.15)' : 'var(--bg-secondary)',
                                      color: formData.type === opt ? 'var(--soft-coral)' : 'var(--text-secondary)',
                                      borderColor: formData.type === opt ? 'var(--soft-coral)' : 'var(--border-input)'
                                    }}
                                  >
                                    {opt}
                                  </button>
                                ))}
                                {/* Bouton Autre */}
                                {!showCustomType ? (
                                  <button
                                    type="button"
                                    onClick={() => setShowCustomType(true)}
                                    className="px-3 py-2 rounded-full text-sm font-semibold transition-all border-2 border-dashed"
                                    style={{
                                      backgroundColor: 'transparent',
                                      color: 'var(--soft-coral)',
                                      borderColor: 'var(--soft-coral)'
                                    }}
                                  >
                                    + Autre
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={customType}
                                      onChange={(e) => setCustomType(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          if (customType.trim()) {
                                            setFormData({ ...formData, type: customType.trim() });
                                            setShowCustomType(false);
                                          }
                                        }
                                      }}
                                      placeholder="Type personnalisé..."
                                      className="px-3 py-2 rounded-full text-sm border-2 focus:outline-none"
                                      style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        borderColor: 'var(--soft-coral)'
                                      }}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (customType.trim()) {
                                          setFormData({ ...formData, type: customType.trim() });
                                          setShowCustomType(false);
                                        }
                                      }}
                                      disabled={!customType.trim()}
                                      className="p-2 rounded-full transition-all"
                                      style={{
                                        backgroundColor: customType.trim() ? 'var(--soft-coral)' : 'var(--bg-secondary)',
                                        color: customType.trim() ? 'white' : 'var(--text-secondary)'
                                      }}
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setShowCustomType(false); setCustomType(''); }}
                                      className="p-2 rounded-full transition-all"
                                      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                        })()}
                    </div>

                    {/* 3. Date et Heure */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="date"
                                    required
                                    className="w-full pl-10 p-3 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--soft-coral)' }}
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Heure</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-10 p-3 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--soft-coral)' }}
                                    value={formData.time}
                                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Nombre d'aidants */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-secondary)' }}>Aidants requis</label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="w-full pl-10 p-3 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--soft-coral)' }}
                                    value={formData.required_helpers}
                                    onChange={e => setFormData({ ...formData, required_helpers: parseInt(e.target.value) || 1 })}
                                />
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>personne(s)</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full font-bold py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all"
                            style={{ backgroundColor: 'var(--soft-coral)', color: 'var(--text-inverse)', boxShadow: '0 4px 16px rgba(240, 128, 128, 0.25)' }}
                        >
                            Créer la tâche
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
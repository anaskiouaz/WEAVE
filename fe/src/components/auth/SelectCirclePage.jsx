import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { apiPost, apiGet } from '../../api/client';
import { Users, UserPlus, ArrowRight, Loader2, ArrowLeft, Calendar, Phone, Stethoscope, Check, LogIn, Mail } from 'lucide-react';

const MEDICAL_OPTIONS = [
    "Risque d'Escarres", "Phlébite / Thrombose", "Fonte musculaire",
    "Ankyloses / Raideurs", "Constipation", "Incontinence",
    "Encombrement bronchique", "Syndrome de glissement", "Ostéoporose", "Alzheimer", "Autre"
];

export default function SelectCirclePage() {
    const navigate = useNavigate();
    // On récupère setCircleId et setCircleNom depuis le contexte
    const { setCircleId, setCircleNom, setUser } = useAuth();

    const [view, setView] = useState('selection'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myCircles, setMyCircles] = useState([]);
    const [inviteCode, setInviteCode] = useState('');

    const [seniorData, setSeniorData] = useState({
        name: '', birth_date: '', phone: '', email: '', medical_select: []
    });

    const handleSeniorChange = (e) => setSeniorData({ ...seniorData, [e.target.name]: e.target.value });

    const toggleMedicalOption = (option) => {
        setSeniorData(prev => {
            const isSelected = prev.medical_select.includes(option);
            return { 
                ...prev, 
                medical_select: isSelected 
                    ? prev.medical_select.filter(item => item !== option) 
                    : [...prev.medical_select, option] 
            };
        });
    };

    // --- CORRECTION MAJEURE ICI ---
    const handleSuccessRedirect = async (circleId, circleName, role = 'HELPER') => {
        console.log("🚀 Sélection Cercle :", circleId, circleName);
        
        try {
            // 1. Mise à jour du stockage local (Persistance)
            localStorage.setItem('circle_id', circleId);
            if (circleName) localStorage.setItem('circle_nom', circleName);

            // 2. Mise à jour immédiate du Contexte (État React)
            if (setCircleId) setCircleId(circleId);
            if (setCircleNom) setCircleNom(circleName);

            // 3. IMPORTANT : Mettre à jour le User dans le contexte pour qu'il sache qu'il a un cercle actif
            if (setUser) {
                setUser(prev => {
                    const prevCircles = Array.isArray(prev?.circles) ? prev.circles : [];
                    // Si le cercle est déjà présent, on ne le duplique pas
                    const exists = prevCircles.some(c => String(c.id ?? c.circle_id) === String(circleId));
                    const newCircles = exists ? prevCircles : [{ id: circleId, senior_name: circleName, role }].concat(prevCircles);
                    return { ...prev, current_circle_id: circleId, circles: newCircles };
                });
            }
            
            // 4. Redirection douce avec React Router (plus rapide et sans rechargement complet)
            // Le AuthGuard verra que le contexte est à jour et laissera passer.
            navigate('/dashboard', { replace: true });

        } catch (e) {
            console.error("Erreur redirection:", e);
            // Fallback ultime si React Router échoue
            window.location.href = '/dashboard';
        }
    };

    const handleViewList = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiGet('/circles');
            // Gestion robuste : parfois c'est data.circles, parfois data est le tableau directement
            const circles = Array.isArray(data) ? data : (data.circles || data.data || []);
            
            if (!circles || circles.length === 0) {
                setError("Aucun cercle trouvé. Créez-en un nouveau.");
            } else {
                setMyCircles(circles);
                setView('list');
            }
        } catch (err) {
            console.error(err);
            setError("Impossible de charger les cercles");
        } finally {
            setLoading(false);
        }
    };

    const selectExistingCircle = (circle) => {
        handleSuccessRedirect(circle.id, circle.name || circle.senior_name);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (loading) return; 
        if (!seniorData.name.trim()) return setError("Le nom est requis.");
        if (!seniorData.email?.trim()) return setError("L'email du bénéficiaire est requis.");
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seniorData.email.trim());
        if (!emailValid) return setError("Email invalide.");

        const payloadInfo = {
            ...seniorData,
            medical_info: seniorData.medical_select.length > 0 ? seniorData.medical_select.join(', ') : null
        };
        delete payloadInfo.medical_select;

        setLoading(true);
        setError('');

        try {
            const data = await apiPost('/circles', { senior_info: payloadInfo });
            
            const finalId = data.circle_id || data.circle?.id || data.data?.id;
            const finalName = data.circle_name || data.circle?.senior_name || data.data?.senior_name || seniorData.name;

            if (finalId) {
                handleSuccessRedirect(finalId, finalName, 'ADMIN');
            } else {
                setLoading(false);
                throw new Error("ID du cercle manquant dans la réponse");
            }
        } catch (err) {
            setLoading(false);
            setError(err.message || "Erreur création");
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!inviteCode.trim()) return setError("Le code est requis.");
        
        setLoading(true);
        setError('');
        try {
            const data = await apiPost('/circles/join', { invite_code: inviteCode });
            
            const finalId = data.circle_id || data.circle?.id || data.data?.id;
            const finalName = data.circle_name || data.circle?.senior_name || data.data?.senior_name || "Nouveau Cercle";

            if (finalId) {
                handleSuccessRedirect(finalId, finalName);
            } else {
                setLoading(false);
                throw new Error("Erreur ID cercle");
            }
        } catch (err) {
            setLoading(false);
            setError(err.message || "Code invalide");
        }
    };

    return (
        <div className="min-h-screen bg-page flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <Card className="w-full max-w-2xl shadow-xl border-t-6 animate-in fade-in zoom-in duration-500" style={{ backgroundColor: 'var(--bg-card)', borderTopColor: 'var(--sage-green)' }}>

                <CardHeader className="text-center pb-6 space-y-2">
                    {view !== 'selection' && (
                        <Button variant="ghost" onClick={() => { setView('selection'); setError(''); }} className="mb-2 self-start">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                        </Button>
                    )}
                    <CardTitle className="text-3xl font-bold text-primary">
                        {view === 'selection' && "Bienvenue sur Weave"}
                        {view === 'create' && "Créer un Cercle de Soins"}
                        {view === 'join' && "Rejoindre un Cercle"}
                        {view === 'list' && "Vos Cercles"}
                    </CardTitle>
                    <CardDescription className="text-lg text-secondary">
                        {view === 'selection' && "Choisissez votre espace de travail."}
                        {view === 'list' && "Sélectionnez le senior dont vous voulez voir le suivi."}
                    </CardDescription>
                </CardHeader>
                
                <CardContent className="px-8 pb-10">
                    {error && (
                        <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg text-sm font-medium border border-red-200 flex items-center">
                            ⚠️ {error}
                        </div>
                    )}

                    {view === 'selection' && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <button onClick={handleViewList} className="flex flex-col items-center justify-center p-6 border-2 rounded-xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all group border-subtle" style={{ backgroundColor: 'var(--bg-card)' }}>
                                <div className="p-3 rounded-full mb-3 transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--sage-green)' }}>
                                    <LogIn className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-primary mb-1">Continuer</h3>
                                <p className="text-center text-xs text-secondary">Mes cercles existants.</p>
                            </button>

                            <button onClick={() => setView('create')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all group border-subtle" style={{ backgroundColor: 'var(--bg-card)' }}>
                                <div className="p-3 rounded-full mb-3 border transition-colors" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }}>
                                    <UserPlus className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-primary mb-1">Nouveau</h3>
                                <p className="text-center text-xs text-secondary">Je crée un dossier pour un proche.</p>
                            </button>

                            <button onClick={() => setView('join')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl bg-card hover:shadow-lg hover:-translate-y-1 transition-all group border-subtle" style={{ backgroundColor: 'var(--bg-card)' }}>
                                <div className="p-3 rounded-full mb-3 border transition-colors" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-light)' }}>
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-primary mb-1">Invité</h3>
                                <p className="text-center text-xs text-secondary">J'ai un code.</p>
                            </button>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                            ) : myCircles.length === 0 ? (
                                <div className="text-center py-8 text-secondary">Aucun cercle trouvé.</div>
                            ) : (
                                <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                                    {myCircles.map((circle) => (
                                        <div key={circle.id} onClick={() => selectExistingCircle(circle)} className="flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all bg-card shadow-sm group border-subtle hover:shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-full transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--sage-green)' }}>
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-primary">{circle.name || circle.senior_name}</h4>
                                                    <p className="text-xs text-secondary">Rôle: {circle.role || 'Membre'}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="space-y-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du Bénéficiaire *</Label>
                             <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted" />
                                    Nom du Bénéficiaire *
                                </Label>
                                <Input id="name" name="name" placeholder="ex: Mamie Jeanne" className="h-12 input-soft" value={seniorData.name} onChange={handleSeniorChange} required autoFocus />
                            </div>                            </div>
                            {/* ... (Reste du formulaire identique) ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted" />
                                        Date de naissance
                                    </Label>
                                    <Input id="birth_date" name="birth_date" type="date" className="h-12 input-soft w-full" value={seniorData.birth_date} onChange={handleSeniorChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted" />
                                        Téléphone
                                    </Label>
                                    <Input id="phone" name="phone" placeholder="06..." className="h-12 input-soft" value={seniorData.phone} onChange={handleSeniorChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted" />
                                    Email du Bénéficiaire *
                                </Label>
                                <Input id="email" name="email" type="email" placeholder="ex: jeanne@example.com" className="h-12 input-soft" value={seniorData.email} onChange={handleSeniorChange} required />
                            </div>
                            <div className="space-y-3 pt-2">
                                <Label className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Pathologies / Risques <span className="text-secondary text-xs font-normal">(optionnel)</span></Label>
                                <div className="p-4 rounded-lg border shadow-sm bg-card border-subtle">
                                    <div className="flex flex-wrap gap-2">
                                        {MEDICAL_OPTIONS.map((option) => {
                                            const isSelected = seniorData.medical_select.includes(option);
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => toggleMedicalOption(option)}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-elevated text-primary border-subtle' : 'bg-card text-secondary border-subtle hover:bg-elevated'}`}>
                                                    {isSelected && <Check className="w-3 h-3" />} {option}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full h-12 btn-sage mt-4">
                                {loading ? <Loader2 className="animate-spin mr-2 text-primary" /> : "Créer le cercle"}
                            </Button>
                        </form>
                    )}

                    {view === 'join' && (
                        <form onSubmit={handleJoin} className="space-y-6 max-w-md mx-auto mt-4">
                                <div className="space-y-3">
                                <Label htmlFor="inviteCode">Code d'invitation</Label>
                                <Input id="inviteCode" placeholder="ex: W-7X9B2" className="h-14 text-lg input-soft text-center font-mono tracking-widest uppercase" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} autoFocus />
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 btn-sage shadow-md">
                                {loading ? <Loader2 className="animate-spin mr-2 text-primary" /> : "Rejoindre"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
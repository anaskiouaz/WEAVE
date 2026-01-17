import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // On garde ça, c'est important pour le contexte
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Users, UserPlus, ArrowRight, Loader2, ArrowLeft, Calendar, Phone, Stethoscope, Check, LogIn } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// On garde ta liste d'options médicales qui est très bien
const MEDICAL_OPTIONS = [
    "Risque d'Escarres", "Phlébite / Thrombose", "Fonte musculaire",
    "Ankyloses / Raideurs", "Constipation", "Incontinence",
    "Encombrement bronchique", "Syndrome de glissement", "Ostéoporose"
];

export default function SelectCirclePage() {
    const navigate = useNavigate();
    // On utilise le contexte pour sauvegarder le choix de l'utilisateur
    const { setCircleId, setCircleNom, token } = useAuth(); 

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

    // La version améliorée de apiCall (gère les méthodes et le token)
    const apiCall = async (endpoint, method = 'POST', body = null) => {
        setLoading(true);
        setError('');
        
        try {
            const config = { 
                method, 
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                } 
            };
            if (body) config.body = JSON.stringify(body);

            const res = await fetch(`${API_BASE_URL}/circles${endpoint}`, config);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
            return data; 

        } catch (err) {
            setError(err.message);
            throw err; 
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

    // 1. Charger la liste des cercles existants (Nouvelle feature !)
    const handleViewList = async () => {
        try {
            const data = await apiCall('/', 'GET'); 
            const circles = Array.isArray(data) ? data : (data.circles || []);
            setMyCircles(circles);
            setView('list');
        } catch (err) {
            console.error("Impossible de charger les cercles", err);
        }
    };

    // 2. Sélectionner un cercle existant
    const selectExistingCircle = (circle) => {
        localStorage.setItem('circle_id', circle.id);
        localStorage.setItem('circle_nom', circle.name);
        setCircleId(circle.id);
        setCircleNom(circle.name); 
        navigate('/dashboard');
    };

    // 3. Créer un nouveau cercle
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!seniorData.name.trim()) return setError("Le nom est requis.");

        const payloadInfo = {
            ...seniorData,
            medical_info: seniorData.medical_select.length > 0 
                ? seniorData.medical_select.join(', ') 
                : null
        };
        delete payloadInfo.medical_select;

        try {
            const data = await apiCall('/', 'POST', { senior_info: payloadInfo });
            
            if (data.circle_id || data.circle?.id) {
                const finalId = data.circle_id || data.circle.id;
                const finalName = data.circle_name || data.circle.senior_id || seniorData.name; // Fallback nom

                localStorage.setItem('circle_id', finalId);
                localStorage.setItem('circle_nom', finalName);
                setCircleId(finalId);
                setCircleNom(finalName); 
                
                navigate('/dashboard');
            }
        } catch (err) {
            // Erreur gérée dans apiCall
        }
    };

    // 4. Rejoindre un cercle via code
    const handleJoin = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return setError("Le code est requis.");
        
        try {
            const data = await apiCall('/join', 'POST', { invite_code: inviteCode });
            
            if (data.circle_id || data.circle?.id) {
                const finalId = data.circle_id || data.circle.id;
                // On essaie de récupérer le nom, sinon "Nouveau Cercle"
                const finalName = data.circle_name || data.circle?.senior_name || "Mon Cercle";

                localStorage.setItem('circle_id', finalId);
                localStorage.setItem('circle_nom', finalName);
                setCircleId(finalId);
                setCircleNom(finalName);

                navigate('/dashboard');
            }
        } catch (err) {
            // Erreur gérée
        }
    };

    return (
        <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-t-6 border-blue-600 animate-in fade-in zoom-in duration-500">

                <CardHeader className="text-center pb-6 space-y-2">
                    {view !== 'selection' && (
                        <Button variant="ghost" onClick={() => setView('selection')} className="mb-2">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                        </Button>
                    )}
                    <CardTitle className="text-3xl font-bold text-blue-900">
                        {view === 'selection' && "Bienvenue sur Weave"}
                        {view === 'create' && "Créer un Cercle de Soins"}
                        {view === 'join' && "Rejoindre un Cercle"}
                        {view === 'list' && "Vos Cercles"}
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
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
                            {/* Option 1 : Voir mes cercles existants */}
                            <button onClick={handleViewList} className="flex flex-col items-center justify-center p-6 border-2 border-blue-100 rounded-xl bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group">
                                <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <LogIn className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Continuer</h3>
                                <p className="text-center text-xs text-gray-500">Accéder à mes cercles existants.</p>
                            </button>

                            {/* Option 2 : Créer */}
                            <button onClick={() => setView('create')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-green-500 hover:bg-green-50 hover:shadow-lg hover:-translate-y-1 transition-all group">
                                <div className="p-3 bg-white rounded-full text-gray-500 mb-3 border border-gray-200 group-hover:border-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <UserPlus className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Nouveau</h3>
                                <p className="text-center text-xs text-gray-500">Je crée un dossier pour un proche.</p>
                            </button>

                            {/* Option 3 : Rejoindre */}
                            <button onClick={() => setView('join')} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-purple-500 hover:bg-purple-50 hover:shadow-lg hover:-translate-y-1 transition-all group">
                                <div className="p-3 bg-white rounded-full text-gray-500 mb-3 border border-gray-200 group-hover:border-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Invité</h3>
                                <p className="text-center text-xs text-gray-500">J'ai reçu un code d'invitation.</p>
                            </button>
                        </div>
                    )}

                    {view === 'list' && (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
                            ) : myCircles.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Aucun cercle trouvé. Créez-en un ou rejoignez une équipe.</div>
                            ) : (
                                <div className="grid gap-3">
                                    {myCircles.map((circle) => (
                                        <div key={circle.id} onClick={() => selectExistingCircle(circle)} className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all bg-white shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-100 p-2 rounded-full text-blue-700">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{circle.name || circle.senior_name}</h4>
                                                    <p className="text-xs text-gray-500">Rôle: {circle.role || 'Membre'}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="space-y-4 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom complet du Bénéficiaire *</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input id="name" name="name" placeholder="ex: Mamie Jeanne" className="pl-10 h-12 bg-white" value={seniorData.name} onChange={handleSeniorChange} required autoFocus />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date">Date de naissance</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input id="birth_date" name="birth_date" type="date" className="pl-10 h-12 bg-white w-full" value={seniorData.birth_date} onChange={handleSeniorChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input id="phone" name="phone" placeholder="06..." className="pl-10 h-12 bg-white" value={seniorData.phone} onChange={handleSeniorChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Label className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-600" /> Pathologies / Risques</Label>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex flex-wrap gap-2">
                                        {MEDICAL_OPTIONS.map((option) => {
                                            const isSelected = seniorData.medical_select.includes(option);
                                            return (
                                                <button key={option} type="button" onClick={() => toggleMedicalOption(option)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                                                    {isSelected && <Check className="w-3 h-3" />} {option}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white mt-4">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Créer le cercle"}
                            </Button>
                        </form>
                    )}

                    {view === 'join' && (
                        <form onSubmit={handleJoin} className="space-y-6 max-w-md mx-auto mt-4">
                            <div className="space-y-3">
                                <Label htmlFor="inviteCode">Code d'invitation</Label>
                                <Input id="inviteCode" placeholder="ex: W-7X9B2" className="h-14 text-lg bg-white text-center font-mono tracking-widest uppercase" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} autoFocus />
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 bg-blue-700 hover:bg-blue-800 shadow-md">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Rejoindre"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
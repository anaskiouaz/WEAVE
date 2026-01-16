import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Users, UserPlus, ArrowRight, Loader2, ArrowLeft, Calendar, Phone, Mail, Stethoscope, Check } from 'lucide-react';

// Liste des pathologies liées au manque de mobilité (GIR 2-5)
const MEDICAL_OPTIONS = [
    "Risque d'Escarres",
    "Phlébite / Thrombose",
    "Fonte musculaire (Sarcopénie)",
    "Ankyloses / Raideurs",
    "Constipation / Fécalome",
    "Incontinence",
    "Encombrement bronchique",
    "Syndrome de glissement / Dépression",
    "Ostéoporose"
];

export default function SelectCirclePage() {
    const navigate = useNavigate();
    const [view, setView] = useState('selection'); // 'selection', 'create', 'join'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- STATE POUR LES INFOS DU SENIOR ---
    const [seniorData, setSeniorData] = useState({
        name: '',
        birth_date: '',
        phone: '',
        email: '',
        medical_select: [] // Tableau temporaire pour l'UI (cases à cocher)
    });

    const [inviteCode, setInviteCode] = useState('');

    const handleSeniorChange = (e) => {
        setSeniorData({ ...seniorData, [e.target.name]: e.target.value });
    };

    // Gestion de la sélection multiple des pathologies
    const toggleMedicalOption = (option) => {
        setSeniorData(prev => {
            const isSelected = prev.medical_select.includes(option);
            let newSelection;
            if (isSelected) {
                newSelection = prev.medical_select.filter(item => item !== option);
            } else {
                newSelection = [...prev.medical_select, option];
            }
            return { ...prev, medical_select: newSelection };
        });
    };

    // Fonction utilitaire pour les appels API
    const apiCall = async (endpoint, body) => {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('weave_token');

        try {
            const res = await fetch(`http://localhost:4000/api/circles${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Une erreur est survenue");

            // Succès -> Redirection Dashboard
            navigate('/dashboard');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!seniorData.name.trim()) return setError("Le nom est requis.");

        // Préparation des données pour la BDD
        // On convertit le tableau medical_select en string pour la colonne 'text' de la DB
        const payloadInfo = {
            ...seniorData,
            medical_info: seniorData.medical_select.length > 0 
                ? seniorData.medical_select.join(', ') // Ex: "Risque d'Escarres, Phlébite"
                : null
        };
        
        // On retire la clé temporaire 'medical_select' avant l'envoi
        delete payloadInfo.medical_select;

        apiCall('/', { senior_info: payloadInfo });
    };

    const handleJoin = (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return setError("Le code est requis.");
        apiCall('/join', { invite_code: inviteCode });
    };

    return (
        <div className="min-h-screen bg-blue-50/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl shadow-xl border-t-6 border-blue-600 animate-in fade-in zoom-in duration-500">

                {/* Header commun */}
                <CardHeader className="text-center pb-6 space-y-2">
                    {view !== 'selection' && (
                        <div className="w-full flex justify-start">
                            <Button variant="ghost" onClick={() => { setView('selection'); setError(''); }} className="text-gray-500 hover:text-blue-700">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                            </Button>
                        </div>
                    )}
                    <CardTitle className="text-3xl font-bold text-blue-900">
                        {view === 'selection' && "Rejoindre Weave"}
                        {view === 'create' && "Créer un Cercle de Soins"}
                        {view === 'join' && "Rejoindre un Cercle"}
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        {view === 'selection' && "Pour commencer, choisissez comment vous souhaitez utiliser l'application."}
                        {view === 'create' && "Créez le profil du bénéficiaire pour générer son cercle."}
                        {view === 'join' && "Entrez le code unique fourni par l'administrateur du cercle."}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-10">

                    {/* Gestion des erreurs */}
                    {error && (
                        <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg text-sm font-medium border border-red-200 flex items-center animate-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* VUE 1 : SÉLECTION */}
                    {view === 'selection' && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Option Créer */}
                            <button
                                onClick={() => setView('create')}
                                className="flex flex-col items-center justify-center p-8 border-2 border-blue-100 rounded-xl bg-white hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
                            >
                                <div className="p-4 bg-blue-50 rounded-full text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <UserPlus className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Je crée un cercle</h3>
                                <p className="text-center text-gray-500 leading-snug">
                                    Je suis l'aidant principal et je veux créer le dossier.
                                </p>
                            </button>

                            {/* Option Rejoindre */}
                            <button
                                onClick={() => setView('join')}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:border-blue-400 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all group"
                            >
                                <div className="p-4 bg-white rounded-full text-gray-500 mb-4 border border-gray-200 group-hover:border-blue-400 group-hover:text-blue-600 transition-colors">
                                    <Users className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">J'ai un code</h3>
                                <p className="text-center text-gray-500 leading-snug">
                                    Je veux rejoindre une équipe existante (bénévole, famille).
                                </p>
                            </button>
                        </div>
                    )}

                    {/* VUE 2 : CRÉATION AVEC INFO MÉDICALES */}
                    {view === 'create' && (
                        <form onSubmit={handleCreate} className="space-y-4 max-w-lg mx-auto">

                            {/* Nom complet */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-base font-semibold">Nom complet du Bénéficiaire *</Label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="ex: Mamie Jeanne Dupont"
                                        className="pl-10 h-12 bg-white"
                                        value={seniorData.name}
                                        onChange={handleSeniorChange}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Date de naissance */}
                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="text-base font-semibold">Date de naissance</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="birth_date"
                                            name="birth_date"
                                            type="date"
                                            className="pl-10 h-12 bg-white block w-full"
                                            value={seniorData.birth_date}
                                            onChange={handleSeniorChange}
                                        />
                                    </div>
                                </div>

                                {/* Téléphone */}
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-base font-semibold">Téléphone (Optionnel)</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            placeholder="06 12 34 56 78"
                                            className="pl-10 h-12 bg-white"
                                            value={seniorData.phone}
                                            onChange={handleSeniorChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* --- NOUVELLE SECTION INFO MÉDICALE --- */}
                            <div className="space-y-3 pt-2">
                                <Label className="text-base font-semibold flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-blue-600" />
                                    Pathologies / Risques (Liés à la mobilité)
                                </Label>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <p className="text-sm text-gray-500 mb-3">Sélectionnez les complications présentes ou à surveiller :</p>
                                    <div className="flex flex-wrap gap-2">
                                        {MEDICAL_OPTIONS.map((option) => {
                                            const isSelected = seniorData.medical_select.includes(option);
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => toggleMedicalOption(option)}
                                                    className={`
                                                        px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5
                                                        ${isSelected 
                                                            ? 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm' 
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}
                                                    `}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                    {option}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-base font-semibold">Email (Optionnel)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="email@exemple.com"
                                        className="pl-10 h-12 bg-white"
                                        value={seniorData.email}
                                        onChange={handleSeniorChange}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Si laissé vide, un email technique sera généré.</p>
                            </div>

                            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 text-lg font-bold bg-blue-700 hover:bg-blue-800 shadow-md mt-4 text-white">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : "Créer le profil et le cercle"}
                            </Button>
                        </form>
                    )}

                    {/* VUE 3 : REJOINDRE */}
                    {view === 'join' && (
                        <form onSubmit={handleJoin} className="space-y-6 max-w-md mx-auto mt-4">
                            <div className="space-y-3">
                                <Label htmlFor="inviteCode" className="text-lg font-semibold">Code d'invitation</Label>
                                <Input
                                    id="inviteCode"
                                    placeholder="ex: W-7X9B2"
                                    className="h-14 text-lg bg-white text-center font-mono tracking-widest uppercase"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    autoFocus
                                />
                                <p className="text-sm text-gray-500 text-center">Le code vous a été transmis par l'administrateur.</p>
                            </div>
                            <Button type="submit" size="lg" disabled={loading} className="w-full h-14 text-lg font-bold bg-blue-700 hover:bg-blue-800 shadow-md">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <span className="flex items-center">Rejoindre <ArrowRight className="ml-2 w-5 h-5" /></span>}
                            </Button>
                        </form>
                    )}

                </CardContent>

                {view === 'selection' && (
                    <CardFooter className="justify-center py-6 bg-gray-50/50 rounded-b-xl border-t">
                        <p className="text-gray-500 text-sm">Vous pourrez créer ou rejoindre d'autres cercles plus tard.</p>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
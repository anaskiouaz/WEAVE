import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Props reçues depuis Messagerie.jsx :
const Sidebar = ({
    roleUtilisateur,
    membresDuCercle = [],
    conversations = [],
    onStartChat,
    onSelectConversation,
    activeId,
    onDeleteConversation // <--- 1. ON RÉCUPÈRE LA FONCTION ICI
}) => {
    const { user, circleId } = useAuth();
    console.log('Sidebar init user:', user, 'auth.circleId:', circleId);
    const [showModal, setShowModal] = useState(false);
    const [nomGroupe, setNomGroupe] = useState("");
    const [selection, setSelection] = useState([]);
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

    // Exclure l'utilisateur courant de la liste affichée
    const sourceMembers = (Array.isArray(members) && members.length > 0) ? members : (Array.isArray(membresDuCercle) ? membresDuCercle : []);
    const filteredMembers = Array.isArray(sourceMembers) ? sourceMembers.filter(m => m.id !== user?.id) : [];

    // Fetch members (same pattern as Admin.jsx)
    const fetchMembers = async (circleId) => {
        console.log('Sidebar.fetchMembers start for circleId=', circleId);
        try {
            const token = localStorage.getItem('weave_token');
            const res = await fetch(`${API_BASE_URL}/circles/${circleId}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                console.log('Sidebar.fetchMembers success, count=', Array.isArray(data) ? data.length : 0);
                setMembers(Array.isArray(data) ? data : []);
            } else {
                console.warn('Sidebar.fetchMembers non-ok response', res.status);
            }
        } catch (err) {
            console.error("Erreur chargement membres", err);
        } finally {
            setLoadingMembers(false);
            console.log('Sidebar.fetchMembers finished');
        }
    };

    // Charger les membres quand on ouvre la modale
    useEffect(() => {
        if (!showModal) return;
        console.log('Sidebar: modal opened; user.circles=', user?.circles, 'auth.circleId=', circleId);
        const resolved = circleId || (user && user.circles && user.circles.length > 0 ? user.circles[0].id : null);
        const targetCircleId = resolved;
        console.log('Sidebar: resolved targetCircleId=', targetCircleId);
        if (!targetCircleId) { setLoadingMembers(false); return; }
        setLoadingMembers(true);
        fetchMembers(targetCircleId);
    }, [showModal, user]);

    // Gestion de la sélection des membres dans la modale
    const toggleMembre = (id) => {
        setSelection(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Validation de la création de groupe
    const handleValiderGroupe = () => {
        console.log('Sidebar: handleValiderGroupe', { nomGroupe, selection });
        if (!nomGroupe || selection.length === 0) return;
        onStartChat('GROUPE', selection, nomGroupe);
        setShowModal(false);
        setNomGroupe("");
        setSelection([]);
    };

    return (
        <div className="w-64 bg-white border-r h-full flex flex-col">
            {/* Bouton "Nouvelle Discussion" */}
            <div className="p-4 border-b">
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 shadow-sm transition-colors"
                >
                    + Nouvelle Discussion
                </button>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider p-4 pb-2">
                    Vos conversations
                </h3>
                <ul>
                    {conversations.length === 0 && (
                        <li className="p-4 text-sm text-gray-400 italic">Aucune conversation</li>
                    )}

                    {conversations.map(conv => (
                        <li
                            key={conv.id}
                            onClick={() => onSelectConversation && onSelectConversation(conv)}
                            // 2. MODIF CSS : On ajoute 'group' et 'relative' pour gérer le bouton poubelle
                            className={`group relative p-4 cursor-pointer border-b border-gray-50 transition-colors border-l-4 ${activeId === conv.id
                                ? 'bg-blue-50 border-l-blue-600'
                                : 'hover:bg-gray-100 border-l-transparent'
                                }`}
                        >
                            <div className="font-medium text-gray-800 pr-6"> {/* pr-6 pour laisser place à la poubelle */}
                                {conv.nom || "Discussion sans nom"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                <span>{conv.type === 'GROUPE' ? 'Groupe' : 'Privé'}</span>
                            </div>

                            {/* 3. LE BOUTON SUPPRIMER */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // EMPÊCHE d'ouvrir le chat quand on clique sur supprimer
                                    onDeleteConversation(conv.id);
                                }}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all bg-white/80 hover:bg-white rounded-full shadow-sm"
                                title="Supprimer la conversation"
                            >
                                🗑️
                            </button>

                        </li>
                    ))}
                </ul>
            </div>

            {/* Modal de création de conversation */}
            {showModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h3 className="font-bold mb-4">Créer une conversation</h3>

                        {(roleUtilisateur === 'ADMIN' || roleUtilisateur === 'AIDANT_PRINCIPAL') && (
                            <div className="mb-4 border-b pb-4">
                                <h4 className="text-sm font-semibold mb-2 text-blue-600">Nouveau Groupe</h4>
                                <input
                                    type="text"
                                    placeholder="Nom du groupe (ex: Anniversaire)"
                                    className="w-full border p-2 mb-2 rounded focus:outline-blue-500"
                                    value={nomGroupe}
                                    onChange={e => setNomGroupe(e.target.value)}
                                />
                                <label className="block text-xs text-gray-500 mb-1">Participants :</label>
                                <div className="max-h-32 overflow-y-auto border p-2 mb-2 rounded bg-gray-50">
                                    {filteredMembers.length === 0 ? (
                                        <p className="text-xs text-red-500">Aucun autre membre dans le cercle.</p>
                                    ) : (
                                        filteredMembers.map(m => (
                                            <div key={m.id} className="flex items-center mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={selection.includes(m.id)}
                                                    onChange={() => toggleMembre(m.id)}
                                                    className="mr-2"
                                                />
                                                <span className="text-sm">{m.nom} <span className="text-xs text-gray-400">({m.role})</span></span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <button onClick={handleValiderGroupe} className="w-full bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700 transition">
                                    Valider le groupe
                                </button>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-semibold mb-2 text-green-600">Message Privé</h4>
                            <ul className="space-y-1 max-h-32 overflow-y-auto">
                                {filteredMembers.length === 0 && <li className="text-xs text-gray-400">Personne à contacter</li>}
                                {filteredMembers.map(m => (
                                    <li
                                        key={m.id}
                                        onClick={() => {
                                            onStartChat('PRIVE', [m.id], null);
                                            setShowModal(false);
                                        }}
                                        className="cursor-pointer hover:bg-gray-100 p-2 rounded flex justify-between items-center transition"
                                    >
                                        <span className="text-sm">{m.nom}</span>
                                        <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{m.role}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button onClick={() => setShowModal(false)} className="w-full text-gray-500 text-sm mt-4 underline hover:text-gray-700">
                            Annuler
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
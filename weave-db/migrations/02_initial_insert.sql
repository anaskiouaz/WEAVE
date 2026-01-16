-- 1. Création de 3 utilisateurs (Un admin famille, un bénévole, une voisine)
-- Correction : medical_info est à NULL pour éviter de faire planter le déchiffrement au démarrage
INSERT INTO users (id, name, email, password_hash, role_global, medical_info, privacy_consent) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Thomas Durand', 
    'thomas@weave.app', 
    'hash_secret_123', 
    'ADMIN',
    NULL,  -- Pas de données chiffrées pour l'instant (évite le crash)
    TRUE   -- Consentement DONNÉ
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 
    'Sophie Martin', 
    'sophie@weave.app', 
    'hash_secret_456', 
    'USER', 
    NULL, 
    FALSE
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 
    'Marc Voisin', 
    'marc@weave.app', 
    'hash_secret_789', 
    'USER', 
    NULL, 
    FALSE
);

-- 2. Création du Cercle de Soins pour "Mamie Monique" (Créé par Thomas)
INSERT INTO care_circles (id, senior_name, created_by) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Monique Durand', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- 3. Tentative avec rôle SUPERADMIN (Thomas)
INSERT INTO user_roles (user_id, circle_id, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'ADMIN'), -- Thomas est l'admin global
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'HELPER'); -- Sophie aide


-- 4. Création des Tâches (avec descriptions détaillées)
INSERT INTO tasks (circle_id, title, task_type, description, date, time, required_helpers, helper_name) VALUES
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Consultation Cardiologue',
    'medical',
    'Accompagner Monique à sa visite de suivi chez le cardiologue à la clinique Saint-Jean.',
    '2025-06-12',
    '14:30:00',
    1,
    'Sophie Martin'
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Courses au Supermarché (Lait, Eau, Fruits)',
    'shopping',
    'Faire les achats hebdomadaires pour remplir le frigo et vérifier les stocks de produits frais.',
    '2025-06-13',
    '10:00:00',
    1,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Prendre le thé et discuter',
    'social',
    'Moment convivial à la maison pour maintenir le lien social et écouter les nouvelles de Monique.',
    '2025-06-14',
    '16:00:00',
    2,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Récupérer ordonnance pharmacie centrale',
    'logistics',
    'Aller chercher l’ordonnance et vérifier qu’il ne manque aucun médicament prescrit.',
    '2025-06-12',
    '18:00:00',
    1,
    'Marc Voisin'
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Sortir les poubelles et arroser les plantes',
    'home',
    'Gestion des sacs poubelles du soir et arrosage des plantes du salon et du balcon.',
    '2025-06-15',
    '19:00:00',
    1,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Déposer Monique au club de bridge',
    'transport',
    'Trajet aller-retour en voiture pour déposer Monique et l’aider à s’installer à la table de jeu.',
    '2025-06-16',
    '13:45:00',
    1,
    NULL
);
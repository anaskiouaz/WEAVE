-- 1. Création de 3 utilisateurs (Un admin famille, un bénévole, une voisine)
-- Correction : medical_info est à NULL pour éviter de faire planter le déchiffrement au démarrage
INSERT INTO users (id, name, email, password_hash, role_global, medical_info, privacy_consent) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Thomas Durand', 
    'thomas@weave.app', 
    'hash_secret_123', 
    'SUPERADMIN',
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
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'SUPERADMIN'), -- Thomas est l'admin global
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'HELPER'); -- Sophie aide


-- 4. Création des Tâches
INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name) VALUES
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Consultation Cardiologue',
    'medical',
    '2025-06-12',
    '14:30:00',
    1,
    'Sophie Martin'
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Courses au Supermarché (Lait, Eau, Fruits)',
    'shopping',
    '2025-06-13',
    '10:00:00',
    1,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Prendre le thé et discuter',
    'social',
    '2025-06-14',
    '16:00:00',
    2,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Récupérer ordonnance pharmacie centrale',
    'logistics',
    '2025-06-12',
    '18:00:00',
    1,
    'Marc Voisin'
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Sortir les poubelles et arroser les plantes',
    'home',
    '2025-06-15',
    '19:00:00',
    1,
    NULL
),
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Déposer Monique au club de bridge',
    'transport',
    '2025-06-16',
    '13:45:00',
    1,
    NULL
);


INSERT INTO journal_entries (circle_id, author_id, mood, text_content, photo_url, created_at) VALUES
-- 1. Souvenir joyeux posté par Sophie (L'aide) : Moment thé/photos
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', -- Cercle de Monique
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', -- Auteur : Sophie Martin
    9,                                      -- Humeur : Excellente
    'Super après-midi avec Monique ! Nous avons ressorti les vieux albums photos autour d''un thé. Elle m''a raconté son voyage en Italie en 1980. Elle avait le sourire jusqu''aux oreilles.',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1000&auto=format&fit=crop', -- Image: Mains âgées tenant une tasse (Ambiance chaleureuse)
    '2025-06-10 16:30:00'
),

-- 2. Observation calme postée par Thomas (Le fils) : Repos au jardin
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', -- Cercle de Monique
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Auteur : Thomas Durand
    6,                                      -- Humeur : Moyenne/Fatiguée
    'Maman était un peu fatiguée après le déjeuner aujourd''hui. Je l''ai installée au jardin pour qu''elle profite du soleil sans trop d''effort. Elle s''est assoupie un moment.',
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop', -- Image: Chaise de jardin paisible
    '2025-06-11 14:15:00'
);
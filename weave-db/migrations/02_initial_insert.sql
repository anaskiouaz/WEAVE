-- 1. Création de 3 utilisateurs (Un admin famille, un bénévole, une voisine)
INSERT INTO users (id, name, email, password_hash, role_global) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thomas Durand', 'thomas@weave.app', 'hash_secret_123', 'USER'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Sophie Martin', 'sophie@weave.app', 'hash_secret_456', 'USER'),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Marc Voisin', 'marc@weave.app', 'hash_secret_789', 'USER');

-- 2. Création du Cercle de Soins pour "Mamie Monique" (Créé par Thomas)
INSERT INTO care_circles (id, senior_name, created_by) VALUES
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'Monique Durand', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- 3. Définition des rôles dans le cercle
INSERT INTO user_roles (user_id, circle_id, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'ADMIN'), -- Thomas est l'admin
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'HELPER'); -- Sophie aide


INSERT INTO tasks (circle_id, title, task_type, date, time, required_helpers, helper_name) VALUES
-- Tâche 1 : Rendez-vous médical (Déjà assigné à Sophie)
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', -- ID du Cercle Monique
    'Consultation Cardiologue',              -- Titre
    'medical',                               -- Type
    '2025-06-12',                            -- Date
    '14:30:00',                              -- Heure
    1,                                       -- 1 personne requise
    'Sophie Martin'                          -- Déjà pris par Sophie (Affichage simple)
),

-- Tâche 2 : Courses hebdomadaires (Disponible - Personne n'a encore pris la tâche)
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Courses au Supermarché (Lait, Eau, Fruits)',
    'shopping',
    '2025-06-13',
    '10:00:00',
    1,
    NULL                                     -- NULL car personne n'a encore accepté
),

-- Tâche 3 : Visite de courtoisie (Lien social - Disponible)
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Prendre le thé et discuter',
    'social',
    '2025-06-14',
    '16:00:00',
    2,                                       -- Idéalement 2 personnes pour plus de convivialité
    NULL
),

-- Tâche 4 : Passage Pharmacie (Petit service rapide)
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Récupérer ordonnance pharmacie centrale',
    'logistics',
    '2025-06-12',
    '18:00:00',
    1,
    'Marc Voisin'                            -- Marc s'en occupe en rentrant du travail
),

-- Tâche 5 : Aide ménagère (Besoin physique)
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'Sortir les poubelles et arroser les plantes',
    'home',
    '2025-06-15',
    '19:00:00',
    1,
    NULL
),

-- Tâche 6 : Transport vers le club de bridge
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
),

-- 3. Passage rapide posté par Marc (Le voisin) : Fleurs et moral
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', -- Cercle de Monique
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', -- Auteur : Marc Voisin
    8,                                      -- Humeur : Bonne
    'Je suis passé en coup de vent lui apporter quelques fleurs de mon jardin. Elle va bien, elle regardait son émission préférée. Pas d''inquiétude à avoir pour ce soir.',
    'https://images.unsplash.com/photo-1490750967868-58cb7506a90a?q=80&w=1000&auto=format&fit=crop', -- Image: Bouquet de fleurs fraiches
    '2025-06-12 18:45:00'
);
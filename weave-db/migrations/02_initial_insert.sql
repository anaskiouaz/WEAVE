-- ============================================================
-- SEED DATA (DONNÉES DE TEST)
-- ============================================================

-- 1. Création des utilisateurs
-- NOTE : On doit créer "Mamie Monique" en tant qu'utilisateur car care_circles demande un senior_id
INSERT INTO users (id, name, email, password_hash, role_global, medical_info, privacy_consent) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'Thomas Durand', 
    'thomas@weave.app', 
    'hash_secret_123', 
    'SUPERADMIN',
    NULL,
    TRUE
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
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', -- UUID pour Monique
    'Monique Durand', 
    'monique.durand@nomail.com', -- Email fictif requis par la contrainte UNIQUE
    'hash_secret_000', 
    'USER',
    NULL, 
    TRUE
);

-- 2. Création du Cercle de Soins
-- Correction : On utilise senior_id (UUID de Monique) au lieu de senior_name
INSERT INTO care_circles (id, senior_id, created_by, invite_code) VALUES
(
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', -- ID de Monique
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- ID de Thomas (Créateur)
    'WEAVE12345'
);

-- 3. Attribution des rôles dans le cercle
-- Ajout de Monique avec le rôle 'PC'
INSERT INTO user_roles (user_id, circle_id, role) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Thomas
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'ADMIN'
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', -- Sophie
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'HELPER'
),
(
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e55', -- Monique
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44',
    'PC' -- Rôle technique pour le bénéficiaire
);

-- 4. Création des tâches
-- (Pas de changement de structure ici, juste s'assurer que le circle_id est bon)
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
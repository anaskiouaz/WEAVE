-- ============================================================
-- SCHEMA COMPLET FUSIONNÉ (CARE CIRCLES)
-- SÉCURISÉ, COMPLET ET SANS DOUBLONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. NETTOYAGE (DROP)
-- ============================================================
DROP VIEW IF EXISTS helper_rating_averages;
DROP TABLE IF EXISTS helper_ratings CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS participant_conversation CASCADE;
DROP TABLE IF EXISTS conversation CASCADE;
DROP TABLE IF EXISTS task_signups CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user_availability CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS care_circles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Suppression des types
DROP TYPE IF EXISTS severity_type CASCADE;
DROP TYPE IF EXISTS incident_status_type CASCADE;
DROP TYPE IF EXISTS circle_role_type CASCADE;
DROP TYPE IF EXISTS global_role_type CASCADE;
DROP TYPE IF EXISTS type_conversation CASCADE;

-- 1. TYPES (ENUMS)
-- ============================================================
CREATE TYPE global_role_type AS ENUM ('SUPERADMIN', 'ADMIN', 'HELPER', 'PC', 'USER');
CREATE TYPE circle_role_type AS ENUM ('ADMIN', 'HELPER', 'PC'); 
CREATE TYPE incident_status_type AS ENUM ('OPEN', 'ESCALATED', 'RESOLVED');
CREATE TYPE severity_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE type_conversation AS ENUM ('PRIVE', 'GROUPE');

-- 2. UTILISATEURS & CERCLES
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    onboarding_role VARCHAR(50),
    phone VARCHAR(20),
    profile_photo VARCHAR(500),
    address TEXT,
    birth_date DATE,
    skills TEXT[],
    medical_info TEXT,                      
    privacy_consent BOOLEAN DEFAULT FALSE,   
    notifications_enabled BOOLEAN DEFAULT FALSE,  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_global global_role_type DEFAULT 'USER',
    fcm_token TEXT,
    -- Colonnes issues de la fusion (Gestion Mail/Sécurité)
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expires TIMESTAMP,
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP
);

CREATE TABLE care_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_id UUID NOT NULL,
    created_by UUID NOT NULL,
    invite_code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_circle_senior FOREIGN KEY (senior_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_circle_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    circle_id UUID NOT NULL,
    role circle_role_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, circle_id),
    CONSTRAINT fk_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    circle_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, 
    slots JSONB NOT NULL DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_availability_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_day_circle UNIQUE (user_id, circle_id, day_of_week)
);

-- 3. TACHES
-- ============================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50),      
    description TEXT,
    date DATE,                  
    time TIME,                  
    required_helpers INT DEFAULT 1,
    helper_name VARCHAR(100), -- Optionnel si on utilise assigned_to
    assigned_to UUID[] DEFAULT '{}'::uuid[],
    due_date TIMESTAMP,             
    completed BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reminder_sent BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_task_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

CREATE TABLE task_signups (
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_signup_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_signup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. MESSAGERIE
-- ============================================================
CREATE TABLE conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255),
    type type_conversation NOT NULL DEFAULT 'PRIVE',
    cercle_id UUID REFERENCES care_circles(id) ON DELETE CASCADE, 
    date_creation TIMESTAMP DEFAULT NOW()
);

CREATE TABLE participant_conversation (
    conversation_id UUID REFERENCES conversation(id) ON DELETE CASCADE,
    utilisateur_id UUID REFERENCES users(id) ON DELETE CASCADE,   
    date_lecture TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (conversation_id, utilisateur_id)
);

CREATE TABLE message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversation(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    contenu TEXT NOT NULL,
    is_moderated BOOLEAN DEFAULT FALSE,
    date_envoi TIMESTAMP DEFAULT NOW()
);

-- Index pour la performance
CREATE INDEX idx_message_conversation ON message(conversation_id);
CREATE INDEX idx_message_date ON message(date_envoi);
CREATE INDEX idx_participant_user ON participant_conversation(utilisateur_id);

-- 5. AUTRES (JOURNAL, AUDIT, INCIDENTS, RATINGS)
-- ============================================================
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    author_id UUID NOT NULL,
    mood INT CHECK (mood BETWEEN 1 AND 10),
    text_content TEXT,
    photo_data VARCHAR, 
    is_moderated BOOLEAN DEFAULT FALSE, -- Inclus de la 2ème version
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT fk_journal_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                       
    action VARCHAR(50) NOT NULL,                   
    details TEXT,                                         
    ip_address VARCHAR(45),                       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    severity severity_type NOT NULL,
    description TEXT NOT NULL,
    status incident_status_type DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE, 
    CONSTRAINT fk_incident_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

CREATE TABLE helper_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rated_user_id UUID NOT NULL, 
    rater_user_id UUID NOT NULL, 
    circle_id UUID NOT NULL, 
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),  
    comment TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rating_rated_user FOREIGN KEY (rated_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_rater_user FOREIGN KEY (rater_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_rating_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
    CONSTRAINT uq_rating_per_circle UNIQUE (rated_user_id, rater_user_id, circle_id),
    CONSTRAINT chk_no_self_rating CHECK (rated_user_id != rater_user_id)
);

-- Vue pour les statistiques de notation
CREATE OR REPLACE VIEW helper_rating_averages AS
SELECT 
    rated_user_id, 
    ROUND(AVG(rating)::numeric, 2) as average_rating, 
    COUNT(*) as total_ratings
FROM helper_ratings 
GROUP BY rated_user_id;
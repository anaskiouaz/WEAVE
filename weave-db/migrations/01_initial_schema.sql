-- ============================================================
-- SCHEMA COMPLET FUSIONNÉ (CARE CIRCLES)
-- NETTOYAGE ET CRÉATION
-- ============================================================

-- 0. RESET / NETTOYAGE
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS message CASCADE;       -- Attention: singulier dans la v2
DROP TABLE IF EXISTS messages CASCADE;      -- Attention: pluriel dans la v1
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

-- ============================================================
-- 1. DEFINITION DES TYPES (ENUMS)
-- ============================================================
CREATE TYPE global_role_type AS ENUM ('SUPERADMIN', 'ADMIN', 'HELPER', 'PC', 'USER');
CREATE TYPE circle_role_type AS ENUM ('ADMIN', 'HELPER', 'PC'); 
CREATE TYPE incident_status_type AS ENUM ('OPEN', 'ESCALATED', 'RESOLVED');
CREATE TYPE severity_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE type_conversation AS ENUM ('PRIVE', 'GROUPE');

-- ============================================================
-- 2. TABLES PRINCIPALES (UTILISATEURS & CERCLES)
-- ============================================================

-- TABLE UTILISATEURS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    onboarding_role VARCHAR(50),
    phone VARCHAR(20),
    birth_date DATE,
    medical_info TEXT,                      
    privacy_consent BOOLEAN DEFAULT FALSE,  
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_global global_role_type,
    fcm_token TEXT                          
);

-- CERCLES DE SOINS
CREATE TABLE care_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_id UUID NOT NULL,
    created_by UUID NOT NULL,
    invite_code VARCHAR(10) UNIQUE, -- Ajouté directement ici
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_circle_senior FOREIGN KEY (senior_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_circle_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ROLES DANS LE CERCLE
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    circle_id UUID NOT NULL,
    role circle_role_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, circle_id),
    CONSTRAINT fk_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

-- DISPONIBILITÉS
CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    circle_id UUID NOT NULL,
    day_of_week VARCHAR(20) NOT NULL, 
    slots JSONB NOT NULL DEFAULT '[]'::jsonb, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_availability_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_day UNIQUE (user_id, day_of_week)
);

-- ============================================================
-- 3. GESTION DES TACHES
-- ============================================================

-- TACHES
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    
    -- Détails
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    description TEXT, -- Ajouté car présent dans v1 mais pas v2 (utile)
    
    -- Planification
    date DATE NOT NULL,
    time TIME NOT NULL,
    
    -- Gestion des aidants
    required_helpers INT DEFAULT 1,
    helper_name VARCHAR(100),
    assigned_to UUID[] DEFAULT '{}',
    
    -- Suivi
    completed BOOLEAN DEFAULT FALSE, -- Ajouté depuis v1 (utile)
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_task_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

-- ASSIGNATION DES TACHES
CREATE TABLE task_signups (
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_signup_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_signup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. MESSAGERIE (VERSION AVANCÉE)
-- ============================================================

-- CONVERSATION
CREATE TABLE conversation (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255),
    type type_conversation NOT NULL,
    cercle_id UUID REFERENCES care_circles(id) ON DELETE CASCADE,
    date_creation TIMESTAMP DEFAULT NOW()
);

-- PARTICIPANT CONVERSATION
CREATE TABLE participant_conversation (
    conversation_id INT REFERENCES conversation(id) ON DELETE CASCADE,
    utilisateur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_lecture TIMESTAMP,
    PRIMARY KEY (conversation_id, utilisateur_id)
);

-- MESSAGES
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversation(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id),
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. AUTRES FONCTIONNALITÉS
-- ============================================================

-- JOURNAL DE BORD
-- JOURNAL DE BORD
    CREATE TABLE journal_entries (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    circle_id UUID NOT NULL,
        author_id UUID NOT NULL,
                                    mood INT CHECK (mood BETWEEN 1 AND 10),
                                    text_content TEXT,
        photo_data VARCHAR, -- Stockage du nom du blob Azure (privé avec SAS token
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comments JSONB DEFAULT '[]'::jsonb,
        CONSTRAINT fk_journal_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
        CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );
-- INCIDENTS (Corrigé : Une seule Primary Key)
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    severity severity_type NOT NULL,
    description TEXT NOT NULL,
    status incident_status_type DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_incident_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
    CONSTRAINT fk_incident_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
);

-- LOGS AUDIT
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                           
    action VARCHAR(50) NOT NULL,                   
    details TEXT,                                     
    ip_address VARCHAR(45),                       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
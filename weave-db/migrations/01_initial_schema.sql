-- ============================================================
-- SCHEMA COMPLET FUSIONNÉ ET À JOUR (CARE CIRCLES)
-- Mis à jour selon le scan de la base de données
-- ============================================================

-- 1. DEFINITION DES TYPES (ENUMS)
CREATE TYPE global_role_type AS ENUM ('SUPERADMIN', 'ADMIN', 'HELPER', 'PC', 'USER');
CREATE TYPE circle_role_type AS ENUM ('SUPERADMIN', 'ADMIN', 'HELPER', 'PC');
CREATE TYPE incident_status_type AS ENUM ('OPEN', 'ESCALATED', 'RESOLVED');
CREATE TYPE severity_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- 2. TABLE UTILISATEURS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    medical_info TEXT,
    privacy_consent BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- Note: marqué 'nullable' dans ta DB, mais souvent requis en pratique
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role_global global_role_type,
    
    -- Colonne ajoutée suite au scan DB
    fcm_token TEXT 
);

-- 3. CERCLES DE SOINS
CREATE TABLE care_circles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_name VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_circle_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. ROLES DANS LE CERCLE
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    circle_id UUID NOT NULL,
    role circle_role_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, circle_id),
    CONSTRAINT fk_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

-- 5. DISPONIBILITÉS
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

-- 6. TACHES
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,

    -- Détails de base
    title VARCHAR(255) NOT NULL,
    task_type VARCHAR(50),      -- Nullable dans la DB
    description TEXT,

    -- Planification (Format historique)
    date DATE,                  -- Nullable dans la DB
    time TIME,                  -- Nullable dans la DB

    -- Gestion des aidants
    required_helpers INT DEFAULT 1,
    helper_name VARCHAR(100),

    -- Colonnes ajoutées suite au scan DB
    assigned_to VARCHAR(255),       -- Pour l'assignation directe (string)
    due_date TIMESTAMP,             -- Pour une date d'échéance précise
    completed BOOLEAN DEFAULT FALSE, -- Statut de complétion simple

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

-- 7. ASSIGNATION DES TACHES (Table de jointure)
CREATE TABLE task_signups (
    task_id UUID NOT NULL,
    user_id UUID NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_signup_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_signup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. JOURNAL DE BORD
CREATE TABLE journal_entries (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     circle_id UUID NOT NULL,
     author_id UUID NOT NULL,
     mood INT CHECK (mood BETWEEN 1 AND 10),
     text_content TEXT,
     photo_url VARCHAR(2048),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     comments JSONB DEFAULT '[]'::jsonb,

     CONSTRAINT fk_journal_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
     CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. JOURNAUX D'AUDIT
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,                      
    action VARCHAR(50) NOT NULL,                   
    details TEXT,                                 
    ip_address VARCHAR(45),                       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. INCIDENTS
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
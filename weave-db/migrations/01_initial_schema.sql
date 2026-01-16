    -- ============================================================
    -- SCHEMA COMPLET FUSIONNÉ (CARE CIRCLES)
    -- AVEC RESET TOTAL (DROP TABLE)
    -- ============================================================

    -- 0. RESET / NETTOYAGE (Attention : Supprime toutes les données existantes)
    DROP TABLE IF EXISTS incidents CASCADE;
    DROP TABLE IF EXISTS audit_logs CASCADE;
    DROP TABLE IF EXISTS journal_entries CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS task_signups CASCADE;
    DROP TABLE IF EXISTS tasks CASCADE;
    DROP TABLE IF EXISTS user_availability CASCADE;
    DROP TABLE IF EXISTS user_roles CASCADE;
    DROP TABLE IF EXISTS care_circles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;

    -- Suppression des types (Enums) pour les recréer proprement
    DROP TYPE IF EXISTS severity_type CASCADE;
    DROP TYPE IF EXISTS incident_status_type CASCADE;
    DROP TYPE IF EXISTS circle_role_type CASCADE;
    DROP TYPE IF EXISTS global_role_type CASCADE;


    -- ============================================================
    -- 1. DEFINITION DES TYPES (ENUMS)
    CREATE TYPE global_role_type AS ENUM ('SUPERADMIN', 'ADMIN', 'HELPER', 'PC', 'USER');
    CREATE TYPE circle_role_type AS ENUM ('ADMIN', 'HELPER', 'PC'); -- PC = Person Cared For (Bénéficiaire)
    CREATE TYPE incident_status_type AS ENUM ('OPEN', 'ESCALATED', 'RESOLVED');
    CREATE TYPE severity_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');


    -- ============================================================
    -- 2. TABLES PRINCIPALES
    -- ============================================================

    -- TABLE UTILISATEURS
    CREATE TABLE users (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) UNIQUE NOT NULL,
                        onboarding_role VARCHAR(50),
                        phone VARCHAR(20),
                        birth_date DATE,
                        medical_info TEXT,                       -- Pour stocker les données chiffrées
                        privacy_consent BOOLEAN DEFAULT FALSE,   -- Pour le consentement RGPD
                        password_hash VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        role_global global_role_type,
                        fcm_token TEXT                      -- Pour les notifications push
    );

    -- CERCLES DE SOINS
    CREATE TABLE care_circles (
                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                senior_id UUID NOT NULL,
                                created_by UUID NOT NULL,
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

    -- TACHES
    CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        circle_id UUID NOT NULL,

        -- Détails
        title VARCHAR(255) NOT NULL,
        task_type VARCHAR(50),      
        description TEXT,

        -- Planification
        date DATE,                  
        time TIME,                  

        -- Gestion des aidants
        required_helpers INT DEFAULT 1,
        helper_name VARCHAR(100),

        -- Suivi
        assigned_to VARCHAR(255),       
        due_date TIMESTAMP,             
        completed BOOLEAN DEFAULT FALSE, 

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reminder_sent BOOLEAN DEFAULT FALSE,

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

    -- MESSAGES
    CREATE TABLE messages (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            circle_id UUID NOT NULL,
                            sender_id UUID NOT NULL,
                            content TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            CONSTRAINT fk_message_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
                            CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- JOURNAL DE BORD
    CREATE TABLE journal_entries (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    circle_id UUID NOT NULL,
        author_id UUID NOT NULL,
                                    mood INT CHECK (mood BETWEEN 1 AND 10),
                                    text_content TEXT,
        photo_data VARCHAR, -- Stockage du nom du blob Azure (privé avec SAS token)
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        comments JSONB DEFAULT '[]'::jsonb,

        CONSTRAINT fk_journal_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
        CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 10. JOURNAUX D'AUDIT (Pour savoir qui a fait quoi)
    CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,                      
        action VARCHAR(50) NOT NULL,                   
        details TEXT,                                 
        ip_address VARCHAR(45),                       
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- INCIDENTS
    CREATE TABLE incidents (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            circle_id UUID NOT NULL,
                            reporter_id UUID NOT NULL,
                            severity severity_type NOT NULL,
                            description TEXT NOT NULL,
                            status incident_status_type DEFAULT 'OPEN',
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
    CONSTRAINT uq_user_circle_day UNIQUE (user_id, circle_id, day_of_week)
);

-- TACHES
CREATE TABLE tasks (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       circle_id UUID NOT NULL,

    -- Détails
                       title VARCHAR(255) NOT NULL,
                       task_type VARCHAR(50) NOT NULL,     -- Ajouté (ex: "medical", "shopping")

    -- Planification
                       date DATE NOT NULL,
                       time TIME NOT NULL,

    -- Gestion des aidants
                       required_helpers INT DEFAULT 1,
                       helper_name VARCHAR(100),           -- Ajouté (Nom simple pour affichage rapide)

                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                       CONSTRAINT fk_task_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE
);

-- 6. ASSIGNATION DES TACHES (RELATIONNELLE)
-- Note : Cette table permet de lier un "vrai" user inscrit à une tâche.
CREATE TABLE task_signups (
                              task_id UUID NOT NULL,
                              user_id UUID NOT NULL,
                              confirmed BOOLEAN DEFAULT FALSE,
                              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    
                              PRIMARY KEY (task_id, user_id),
                              CONSTRAINT fk_signup_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                              CONSTRAINT fk_signup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. TYPES CONVERSATIONS
-- Créer un type pour différencier les conversations
CREATE TYPE type_conversation AS ENUM ('PRIVE', 'GROUPE');

-- 8.CONVERSATION
-- Elle est liée au CERCLE (pour savoir de quel senior on parle)
CREATE TABLE conversation (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255),
    type type_conversation NOT NULL,
    cercle_id UUID REFERENCES care_circles(id) ON DELETE CASCADE, -- CHANGÉ: UUID + nom table anglais
    date_creation TIMESTAMP DEFAULT NOW()
);

-- 9. PARTICIPANT_CONVERSATION
CREATE TABLE participant_conversation (
    conversation_id INT REFERENCES conversation(id) ON DELETE CASCADE,
    utilisateur_id UUID REFERENCES users(id) ON DELETE CASCADE,   -- CHANGÉ: UUID + nom table anglais
    date_lecture TIMESTAMP,
    PRIMARY KEY (conversation_id, utilisateur_id)
);

-- 10. La table MESSAGE
CREATE TABLE message (
    id SERIAL PRIMARY KEY,
    conversation_id INT REFERENCES conversation(id) ON DELETE CASCADE,
    auteur_id UUID REFERENCES users(id),                          -- CHANGÉ: UUID + nom table anglais
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP DEFAULT NOW()
);

-- 11. JOURNAL DE BORD
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circle_id UUID NOT NULL,
    author_id UUID NOT NULL,
    mood INT CHECK (mood BETWEEN 1 AND 10),
    text_content TEXT,
    photo_data VARCHAR, -- Stockage du nom du blob Azure (privé avec SAS token)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments JSONB DEFAULT '[]'::jsonb,

    CONSTRAINT fk_journal_circle FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. INCIDENTS
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

    ALTER TABLE care_circles 
    ADD COLUMN invite_code VARCHAR(10) UNIQUE;

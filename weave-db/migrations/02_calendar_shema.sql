CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,              -- Identifiant unique (auto-incrémenté)
    title VARCHAR(255) NOT NULL,        -- Titre (ex: "Visite médicale")
    task_type VARCHAR(50) NOT NULL,     -- Type (ex: "medical", "shopping")
    day_of_week VARCHAR(20) NOT NULL,   -- Jour (ex: "lundi", "mardi")
    task_time VARCHAR(5) NOT NULL,      -- Heure (ex: "14:00")
    helper_name VARCHAR(100),           -- Nom de l'aidant (ex: "Marie D.")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
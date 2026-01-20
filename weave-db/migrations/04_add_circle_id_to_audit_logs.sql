-- ============================================================
-- MIGRATION: Ajouter circle_id à audit_logs pour filtrer par cercle
-- ============================================================

-- Ajouter la colonne circle_id si elle n'existe pas
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS circle_id UUID;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE audit_logs 
ADD CONSTRAINT fk_audit_circle 
FOREIGN KEY (circle_id) REFERENCES care_circles(id) ON DELETE CASCADE;

-- Créer un index pour optimiser les requêtes par cercle
CREATE INDEX IF NOT EXISTS idx_audit_logs_circle ON audit_logs(circle_id);

-- Créer un index pour optimiser les requêtes par date
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- MIGRATION: Ajouter la colonne is_moderated à la table message
-- ============================================================

-- Ajouter la colonne is_moderated si elle n'existe pas
ALTER TABLE message
ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT FALSE;

-- Créer un index pour accélérer les requêtes filtrant par modération
CREATE INDEX IF NOT EXISTS idx_message_is_moderated ON message(is_moderated);

-- ============================================================
-- MIGRATION: Ajouter les champs de vérification et reset sur users
-- ============================================================

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_token TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_token TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;

-- Index utile si on recherche par token (ex: reset)
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_password_token ON users(reset_password_token);
ALTER TABLE message
  ADD COLUMN IF NOT EXISTS is_moderated BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_message_is_moderated ON message(is_moderated);
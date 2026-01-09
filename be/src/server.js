import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 4000;

// --- DÉBUT BLOC DE RÉPARATION DB ---
import db from './config/db.js';

const reparerDB = async () => {
  console.log("🔧 Vérification de la base de données...");
  try {
    // 1. Vérifier/Créer la colonne fcm_token
    await db.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fcm_token') THEN 
          ALTER TABLE users ADD COLUMN fcm_token TEXT; 
          RAISE NOTICE 'Colonne fcm_token ajoutée !';
        END IF;
      END $$;
    `);
    console.log("✅ Colonne 'fcm_token' vérifiée/créée.");

    // 2. Vérifier si on peut insérer sans mot de passe (pour les notifs anonymes)
    // On rend la colonne password_hash nullable si elle ne l'est pas
    await db.query(`
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    `);
    console.log("✅ Contrainte mot de passe assouplie (pour mode anonyme).");

  } catch (e) {
    console.error("⚠️ Note réparation:", e.message); // On log juste, sans planter
  }
};

reparerDB();
// --- FIN BLOC DE RÉPARATION DB ---

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});

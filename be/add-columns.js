import db from './src/config/db.js';

async function migrate() {
  console.log("🛠️ Tentative d'ajout de la colonne medical_info...");

  try {
    // La commande SQL magique
    // IF NOT EXISTS évite de planter si tu l'as déjà fait sans le savoir
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS medical_info TEXT;
    `);
    
    console.log("✅ SUCCÈS : La colonne 'medical_info' a été ajoutée à la table users.");
  } catch (error) {
    console.error("❌ ERREUR SQL :", error.message);
  } finally {
    // On coupe la connexion pour que le script s'arrête
    process.exit(); 
  }
}

migrate();
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ''
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'weave_user',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'weave_local',
    };

// AJOUT : Ajoutez 'export' devant const pool ou exportez-le à la fin
export const pool = new Pool(poolConfig); 

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.stack);
  } else {
    console.log('✅ Connexion à la base de données établie avec succès');
    release();
  }
}); 

// On garde l'export par défaut pour la compatibilité avec le reste de votre code
export default {
  query: (text, params) => pool.query(text, params),
};
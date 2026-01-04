import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Support pour DATABASE_URL (production) ou variables PG* séparées (développement)
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'weave_user',
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE || 'weave_local',
    };

const pool = new Pool(poolConfig);

// Test de connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.stack);
  } else {
    console.log('✅ Connexion à la base de données établie avec succès');
    release();
  }
}); 

export default {
  query: (text, params) => pool.query(text, params),
};
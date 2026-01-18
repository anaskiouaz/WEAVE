import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuration qui marche partout (Local et Docker)
const poolConfig = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== ''
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'db',
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || 'weave_user',
      password: process.env.PGPASSWORD || 'weave_password',
      database: process.env.PGDATABASE || 'weave_db', // Vérifie si c'est weave_db ou weave_local dans ton .env
    };

const pool = new Pool(poolConfig);

// Gestion des erreurs pour éviter que l'API ne crashe silencieusement
pool.on('error', (err) => {
  console.error('❌ ERREUR CRITIQUE DB:', err);
});

// ✅ LA CORRECTION EST ICI :
// On exporte directement le "pool". 
// Comme ça, circles.js peut faire db.connect() et auth.js peut faire db.query()
export default pool;
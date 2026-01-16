import http from 'http';
import dotenv from 'dotenv';
import app from './app.js'; // Importe l'app configurée (CORS, routes, etc.)
import db from './config/db.js';
import { initFirebase } from './config/firebase.js';
import initCronJobs from './services/cronService.js';
import { initSocket } from './services/socketService.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 1. On crée un serveur HTTP "natif" qui englobe ton app Express
const server = http.createServer(app);

// 2. On attache Socket.io à ce serveur
initSocket(server);

// NOTE : Pas de app.use(cors()) ici, car c'est déjà géré proprement dans app.js

const initDB = async () => {
  console.log("Vérification de la structure de la base de données...");
  try {
    // Création des tables de base
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_type VARCHAR(50),
        assigned_to VARCHAR(100),
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ajout des colonnes manquantes (Migration)
    await db.query(`
      DO $$ 
      BEGIN 
        -- USERS : fcm_token
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fcm_token') THEN 
          ALTER TABLE users ADD COLUMN fcm_token TEXT; 
        END IF;

        -- TASKS : description
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='description') THEN 
          ALTER TABLE tasks ADD COLUMN description TEXT; 
        END IF;
        
        -- TASKS : task_type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='task_type') THEN 
          ALTER TABLE tasks ADD COLUMN task_type VARCHAR(50); 
        END IF;

        -- TASKS : assigned_to
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigned_to') THEN 
          ALTER TABLE tasks ADD COLUMN assigned_to VARCHAR(100); 
        END IF;

        -- TASKS : due_date
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN 
          ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP; 
        END IF;

        -- TASKS : completed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completed') THEN 
          ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT FALSE; 
        END IF;

        -- TASKS : circle_id
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='circle_id') THEN 
          ALTER TABLE tasks ADD COLUMN circle_id INTEGER; 
        END IF;
        
        -- TASKS : date & time
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='date') THEN 
          ALTER TABLE tasks ADD COLUMN date DATE; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='time') THEN 
          ALTER TABLE tasks ADD COLUMN time TIME; 
        END IF;

      END $$;
    `);

    // Assouplissement des contraintes
    try {
        await db.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`);
        await db.query(`ALTER TABLE tasks ALTER COLUMN circle_id DROP NOT NULL;`);
        await db.query(`ALTER TABLE tasks ALTER COLUMN task_type DROP NOT NULL;`);
        await db.query(`ALTER TABLE tasks ALTER COLUMN date DROP NOT NULL;`);
        await db.query(`ALTER TABLE tasks ALTER COLUMN time DROP NOT NULL;`);
        console.log("Base de données prête : Colonnes vérifiées et contraintes assouplies.");
    } catch (e) {
        // Ignorer si déjà fait
        console.log("Contraintes déjà ajustées ou erreur mineure.");
    }
    
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la DB :", err.message);
  }
};

// --- INITIALISATION ---
initFirebase();
initDB(); 
initCronJobs();

// --- DÉMARRAGE DU SERVEUR ---
// IMPORTANT : On utilise 'server.listen' et non 'app.listen' pour que Socket.io fonctionne
server.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
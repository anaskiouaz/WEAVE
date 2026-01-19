import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import db from './config/db.js';
import { initFirebase } from './config/firebase.js';
import initCronJobs from './services/cronService.js';
import { initSocket } from './services/socketService.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 1. Création du serveur HTTP
const server = http.createServer(app);

// 2. Initialisation Socket.io
initSocket(server);

// 3. Initialisation DB
const initDB = async () => {
  console.log("Vérification de la structure de la base de données...");
  try {
    // Table Users
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table Tasks
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

    // Migrations dynamiques (Colonnes manquantes)
    await db.query(`
      DO $$ 
      BEGIN 
        -- USERS
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fcm_token') THEN 
          ALTER TABLE users ADD COLUMN fcm_token TEXT; 
        END IF;

        -- TASKS
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='description') THEN 
          ALTER TABLE tasks ADD COLUMN description TEXT; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='task_type') THEN 
          ALTER TABLE tasks ADD COLUMN task_type VARCHAR(50); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assigned_to') THEN 
          ALTER TABLE tasks ADD COLUMN assigned_to VARCHAR(100); 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN 
          ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='completed') THEN 
          ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT FALSE; 
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='circle_id') THEN 
          ALTER TABLE tasks ADD COLUMN circle_id INTEGER; 
        END IF;
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
        console.log("Base de données prête.");
    } catch (e) {
        console.log("Contraintes DB déjà OK.");
    }
  } catch (err) {
    console.error("Erreur Init DB :", err.message);
  }
};

// Initialisation Services
initFirebase();
initDB(); 
initCronJobs();

// Démarrage Serveur
server.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
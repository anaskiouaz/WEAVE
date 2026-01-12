import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());

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

  
    // Ajout des tables si besoin
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
import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
  console.log('Test modification');
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/db.js';
import { initFirebase } from './config/firebase.js';
import initCronJobs from './services/cronService.js';
import app from './app.js';

// --- IMPORTS DES ROUTES ---
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import circlesRoutes from './routes/circles.js'; 
import auditRoutes from './routes/audit.js';     

dotenv.config();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
// app.use('/api/circles', circlesRoutes);
app.use('/api/audit', auditRoutes);      // ✅ C'est cette ligne qui corrige l'erreur 404

// --- INIT DB ---
const initDB = async () => {
  console.log("🛠️  Vérification de la Base de Données...");
  try {
    // 1. Table USERS
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fcm_token TEXT,
        onboarding_role VARCHAR(50),
        role_global VARCHAR(50) DEFAULT 'USER'
      );
    `);

    // 2. Table AUDIT_LOGS (CORRECTION DU TYPE ICI)
    // On crée la table avec user_id en TEXT (pour accepter les UUID)
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT, 
        action VARCHAR(255),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🚨 PATCH AUTOMATIQUE (Pour corriger ta table existante qui est en INTEGER)
    // Cette commande va transformer la colonne INTEGER en TEXT sans perdre les données
    try {
        await db.query(`ALTER TABLE audit_logs ALTER COLUMN user_id TYPE TEXT;`);
        console.log("✅ Colonne audit_logs.user_id convertie en TEXT avec succès.");
    } catch (e) {
        // On ignore l'erreur si c'est déjà fait
    }

    // 3. Table TASKS
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_type VARCHAR(50),
        assigned_to VARCHAR(100),
        due_date TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        circle_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date DATE,
        time TIME,
        required_helpers INTEGER DEFAULT 1,
        helper_name VARCHAR(100)
      );
    `);

    console.log("✅ Base de données prête.");
    
  } catch (err) {
    console.error("❌ Erreur Init DB:", err.message);
  }
};

// Initialisation
initFirebase();
initDB();
initCronJobs();

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Démarrage
app.listen(PORT, () => {
  console.log(`🚀 API en ligne sur le port ${PORT}`);
});
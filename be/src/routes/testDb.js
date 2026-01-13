import { Router } from 'express';
// On importe la connexion depuis votre fichier de config existant
// Assurez-vous que db.js exporte bien 'pool' ou le client par défaut
import pool from '../config/db.js'; 

const router = Router();

router.get("/", async (req, res) => {
  try {
    // On essaie de récupérer tous les utilisateurs de la table 'users'
    // visible dans votre capture d'écran (id, email, created_at)
    const result = await pool.query('SELECT * FROM users');

    res.json({
      status: "success",
      message: "Connexion établie avec succès entre Azure App Service et PostgreSQL",
      env: process.env.NODE_ENV,
      server_time: new Date(),
      user_count: result.rowCount, // Nombre d'utilisateurs trouvés
      data: result.rows // Le contenu de la table users
    });

  } catch (error) {
    // Si la connexion échoue (ex: Firewall Azure, mot de passe incorrect)
    // on renvoie l'erreur détaillée pour aider au débogage
    console.error("Erreur de connexion DB:", error);
    res.status(500).json({
      status: "error",
      message: "Échec de la connexion à la base de données",
      error_details: error.message
    });
  }
});

export default router;
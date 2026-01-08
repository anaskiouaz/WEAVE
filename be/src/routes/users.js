import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// GET /users - Récupère tous les utilisateurs (Route existante)
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows,
    });
  } catch (error) {
    console.error('❌ Erreur récupération users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /users/:id - Récupère UN profil spécifique et ses disponibilités
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Infos utilisateur
    const userResult = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    // 2. Disponibilités (nécessite la table user_availability)
    // On utilise un try/catch silencieux ici au cas où la table n'existerait pas encore
    let availResult = { rows: [] };
    try {
        availResult = await db.query(
        'SELECT day_of_week, slots FROM user_availability WHERE user_id = $1',
        [id]
        );
    } catch (e) {
        console.warn("Table user_availability manquante ou vide, on continue sans.");
    }

    res.json({
      success: true,
      user: userResult.rows[0],
      availability: availResult.rows
    });
  } catch (error) {
    console.error('❌ Erreur GET user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /users/:id - Met à jour les infos personnelles
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           phone = COALESCE($2, phone), 
           address = COALESCE($3, address)
       WHERE id = $4 
       RETURNING id, name, email, phone, address`,
      [name, phone, address, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur UPDATE user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /users/:id/availability - Met à jour les disponibilités
router.put('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body; // Doit être un tableau

    await db.query('BEGIN');
    
    // On nettoie les anciennes dispos
    await db.query('DELETE FROM user_availability WHERE user_id = $1', [id]);

    // On insère les nouvelles
if (Array.isArray(availability)) {
        for (const item of availability) {
            if (item.day && item.slots) {
                await db.query(
                'INSERT INTO user_availability (user_id, day_of_week, slots) VALUES ($1, $2, $3)',
                [
                    id, 
                    item.day, 
                    JSON.stringify(item.slots) // <--- AJOUTEZ JSON.stringify() ICI
                ]
                );
            }
        }
    }    
    await db.query('COMMIT');
    res.json({ success: true, message: "Disponibilités mises à jour" });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('❌ Erreur UPDATE availability:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
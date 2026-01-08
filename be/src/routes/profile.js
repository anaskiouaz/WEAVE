import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// GET /:id - Récupérer UN profil et ses disponibilités
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Infos utilisateur
    const userResult = await db.query(
      'SELECT id, name, email, phone, address, birth_date, role_global, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    // 2. Disponibilités
    let availResult = { rows: [] };
    try {
        availResult = await db.query(
        'SELECT day_of_week, slots FROM user_availability WHERE user_id = $1',
        [id]
        );
    } catch (e) {
        // On ignore l'erreur si la table n'existe pas encore
    }

    res.json({
      success: true,
      user: userResult.rows[0],
      availability: availResult.rows
    });
  } catch (error) {
    console.error('❌ Erreur GET profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /:id - Mettre à jour les infos de base
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
    console.error('❌ Erreur UPDATE profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /:id/availability - Mettre à jour les disponibilités
router.put('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body; 

    await db.query('BEGIN');
    
    // Nettoyage des anciennes
    await db.query('DELETE FROM user_availability WHERE user_id = $1', [id]);

    // Insertion des nouvelles
    if (Array.isArray(availability)) {
        for (const item of availability) {
            if (item.day && item.slots) {
                // IMPORTANT: Si ta colonne 'slots' est du JSONB en base, garde JSON.stringify.
                // Si c'est du TEXT, tu peux l'enlever. Par sécurité je le mets ici.
                const slotsValue = typeof item.slots === 'string' ? item.slots : JSON.stringify(item.slots);
                
                await db.query(
                'INSERT INTO user_availability (user_id, day_of_week, slots) VALUES ($1, $2, $3)',
                [id, item.day, slotsValue]
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
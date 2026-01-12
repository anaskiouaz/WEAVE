import { Router } from 'express';
import pool from '../config/db.js'; // Note le .js à la fin, obligatoire en ES Modules

const router = Router();

// POST /api/incidents
router.post('/', async (req, res) => {
    const { type, description } = req.body;

    if (!description) {
        return res.status(400).json({ error: "La description est obligatoire." });
    }

    // Mapping Frontend -> DB Enum
    // Frontend envoie 'URGENT' ou 'NON_URGENT'
    // DB attend 'CRITICAL', 'HIGH', 'MEDIUM', ou 'LOW'
    let severity = 'LOW';
    if (type === 'URGENT') {
        severity = 'CRITICAL';
    }

    // IDs en dur pour la démo (Car l'authentification n'est pas encore liée)
    // Ces UUIDs viennent de ton fichier '02_initial_insert.sql'
    const HARDCODED_CIRCLE_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44';
    const HARDCODED_REPORTER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    try {
        const query = `
            INSERT INTO incidents (circle_id, reporter_id, severity, description, status) 
            VALUES ($1, $2, $3, $4, 'OPEN') 
            RETURNING *
        `;
        
        const values = [HARDCODED_CIRCLE_ID, HARDCODED_REPORTER_ID, severity, description];
        
        const result = await pool.query(query, values);
        
        console.log("✅ Incident enregistré :", result.rows[0]);
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("❌ Erreur SQL:", err);
        if (err.code === '23503') {
             return res.status(400).json({ error: "Erreur FK: Utilisateur ou Cercle introuvable." });
        }
        res.status(500).json({ error: "Impossible d'enregistrer le rapport." });
    }
});

export default router;
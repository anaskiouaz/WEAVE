import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: "Email/Mot de passe incorrect." });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, error: "Email/Mot de passe incorrect." });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    delete user.password_hash;
    
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

export default router;
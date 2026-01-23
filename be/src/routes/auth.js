import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const router = Router();

// ============================================================
// 1. INSCRIPTION (REGISTER)
// ============================================================
router.post('/register', async (req, res) => {
  const { name, email, password, onboarding_role, phone, birth_date } = req.body;

  try {
    // A. Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ success: false, error: "Cet email est déjà utilisé." });
    }

    // B. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // C. Generate Code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // LOG for Devs
    console.log("==========================================");
    console.log(`🔑 NEW CODE FOR ${email}: ${verificationCode}`);
    console.log("==========================================");

    // D. Insert User
    const newUser = await db.query(
      `INSERT INTO users (
          name, email, password_hash, onboarding_role, role_global, phone, birth_date,
          verification_token, verification_token_expires, is_verified
       ) 
       VALUES ($1, $2, $3, $4, 'USER', $5, $6, $7, $8, FALSE) 
       RETURNING id, name, email`,
      [name, email, passwordHash, onboarding_role, phone, birth_date, verificationCode, verificationExpires]
    );

    // E. Send Email — await so we ensure the verification email is actually sent.
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (err) {
      console.error('Verification email failed, rolling back user insert:', err);
      // Rollback: remove the user we just created to avoid dangling unverified accounts when email fails
      try {
        await db.query('DELETE FROM users WHERE email = $1', [email]);
      } catch (delErr) {
        console.error('Failed to delete user after email failure:', delErr);
      }
      return res.status(500).json({ success: false, error: 'Échec de l\'envoi de l\'email de vérification.' });
    }

    res.status(201).json({ 
        success: true, 
        message: "Inscription réussie. Vérifiez votre code.", 
        user: newUser.rows[0] 
    });

  } catch (error) {
    console.error('ERREUR REGISTER:', error);
    res.status(500).json({ success: false, error: "Erreur lors de l'inscription." });
  }
});

// ============================================================
// 2. CONNEXION (LOGIN)
// ============================================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Compte inexistant." });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Mot de passe incorrect." });
    }

    // Block login if the user's email is not verified
    if (user.is_verified === false) {
      return res.status(403).json({ success: false, error: "Compte non activé. Vérifiez votre boîte mail." });
    }

    // Get Circles for Context
    const circlesResult = await db.query(`
      SELECT cc.id, cc.invite_code, u.name AS senior_name, ur.role
      FROM care_circles cc
      JOIN user_roles ur ON cc.id = ur.circle_id
      JOIN users u ON cc.senior_id = u.id
      WHERE ur.user_id = $1
    `, [user.id]);

    const activeRole = user.role_global || user.onboarding_role;
    const token = jwt.sign(
        { id: user.id, role: activeRole }, 
        process.env.JWT_SECRET || 'secret', 
        { expiresIn: '30d' }
    );
    
    delete user.password_hash; 

    res.json({ 
        success: true, 
        token, 
        user: { ...user, circles: circlesResult.rows }, 
        circle_id: circlesResult.rows[0]?.id || null
    });

  } catch (error) {
    console.error('ERREUR LOGIN:', error);
    res.status(500).json({ success: false, error: "Erreur serveur." });
  }
});

// ============================================================
// 3. VERIFY EMAIL
// ============================================================
router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body; 

    try {
        const result = await db.query(
          `UPDATE users 
           SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
           WHERE email = $1 AND verification_token = $2 AND verification_token_expires > NOW()
           RETURNING id`,
          [email, code]
        );
        
        if (result.rowCount === 0) {
            return res.status(400).json({ error: "Lien invalide ou code expiré." });
        }
        
        res.json({ success: true, message: "Email vérifié !" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// ============================================================
// 4. FORGOT PASSWORD
// ============================================================
router.post('/forgot-password', async (req, res) => {
    try {
      const rawEmail = req.body.email;
      if (!rawEmail) return res.status(400).json({ error: "Email manquant." });
  
      const cleanEmail = rawEmail.trim().toLowerCase();
      const user = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
  
      if (user.rows.length === 0) {
        return res.status(404).json({ error: "Email inconnu." });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour
  
      await db.query(
        'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
        [token, expires, user.rows[0].id]
      );
  
      // Fire and forget email
      sendPasswordResetEmail(cleanEmail, token)
        .catch(e => console.error("Reset Email Error:", e));

      res.json({ success: true, message: "Email envoyé." });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur." });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
      const user = await db.query(
        'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
        [token]
      );
  
      if (user.rows.length === 0) return res.status(400).json({ error: "Lien invalide." });
  
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
  
      await db.query(
        'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
        [hash, user.rows[0].id]
      );
  
      res.json({ success: true, message: "Mot de passe modifié." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur." });
    }
});

// ============================================================
// 5. UTILS (ME, CHECK-ROLE)
// ============================================================
router.get('/check-role', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const circleId = req.query.circle_id;
      if (!userId || !circleId) return res.status(400).json({ success: false });
  
      const q = 'SELECT role FROM user_roles WHERE user_id = $1 AND circle_id = $2 LIMIT 1';
      const result = await db.query(q, [userId, circleId]);
      return res.json({ success: true, role: result.rows[0]?.role || null });
    } catch (err) {
      return res.status(500).json({ success: false });
    }
});
  
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRes = await db.query(
            'SELECT id, name, email, onboarding_role, role_global, profile_photo, phone, birth_date FROM users WHERE id = $1', 
            [userId]
        );
        
        if (userRes.rows.length === 0) return res.status(404).json({ success: false });
        const user = userRes.rows[0];

        const circlesResult = await db.query(`
            SELECT cc.id, cc.invite_code, u.name AS senior_name, ur.role
            FROM care_circles cc
            JOIN user_roles ur ON cc.id = ur.circle_id
            JOIN users u ON cc.senior_id = u.id
            WHERE ur.user_id = $1
        `, [userId]);

        res.json({ 
            success: true, 
            user: { ...user, circles: circlesResult.rows },
            circle_id: circlesResult.rows[0]?.id || null 
        });

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;
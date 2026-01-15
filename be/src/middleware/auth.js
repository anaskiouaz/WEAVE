import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  // CORRECTION ICI : Même clé que dans auth.js
  const SECRET_KEY = process.env.JWT_SECRET || 'secret'; 

  jwt.verify(token, SECRET_KEY, (err, userDecoded) => {
    if (err) {
      console.error("Erreur vérification JWT:", err.message); // Ajout de log pour t'aider
      return res.status(403).json({ error: "Session expirée ou invalide." });
    }

    req.user = userDecoded; 
    next();
  });
};
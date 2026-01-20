import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // 1. LAISSER PASSER LES PRÉ-VÉRIFICATIONS (CORS)
  // C'est ça qui bloquait : le navigateur demande "Je peux ?" sans token, et on lui disait "Non".
  if (req.method === 'OPTIONS') {
    return next();
  }

  // 2. Récupérer le token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    // On loggue l'erreur pour être sûr
    console.warn(`⛔ 401 Unauthorized sur ${req.method} ${req.path}`);
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  // 3. Vérifier la validité
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      console.warn(`⛔ 403 Forbidden sur ${req.path} : Token invalide`);
      return res.status(403).json({ error: "Token invalide ou expiré." });
    }
    req.user = user;
    next();
  });
};
import crypto from 'crypto';

const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = 'ma_cle_secrete_super_securisee_!'; // Doit faire 32 caractères pile
const IV_LENGTH = 16;

export const encrypt = (text) => {
  if (!text) return null;
  
  // Génère un vecteur d'initialisation aléatoire
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Crée le chiffrage
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Retourne le IV + le texte chiffré (séparés par :)
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text) => {
  if (!text) return null;

  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};
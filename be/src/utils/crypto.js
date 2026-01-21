/*
 * Chiffrement AES-256 des données médicales (conformité RGPD)
 * 
 * AES-256-CTR = algorithme de chiffrement symétrique (même clé pour chiffrer/déchiffrer)
 * L'IV (vecteur d'initialisation) rend chaque chiffrement unique même pour le même texte
 * Format stocké en BDD : "iv_en_hex:donnees_chiffrees_en_hex"
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-ctr';  // Algorithme : AES 256 bits en mode Counter
const SECRET_KEY = 'ma_cle_secrete_super_securisee_!'; // DOIT faire 32 caractères (256 bits)
const IV_LENGTH = 16; // Taille de l'IV en bytes

// Chiffre un texte avant stockage en BDD
export const encrypt = (text) => {
  if (!text) return null;
  
  // Génère un IV aléatoire (rend chaque chiffrement unique)
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Crée le chiffreur et chiffre le texte
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // Retourne "IV:données" en hexadécimal
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Déchiffre un texte stocké en BDD
export const decrypt = (text) => {
  if (!text) return null;

  // Sépare l'IV et les données
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  
  // Déchiffre avec les mêmes paramètres
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
};

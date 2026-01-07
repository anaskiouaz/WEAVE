// be/src/config/firebase.js
import admin from 'firebase-admin';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// Assure-toi que le chemin est correct vers le fichier JSON téléchargé à l'étape 1
const serviceAccount = require('./service-account.json'); 

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialisé');
} catch (error) {
  console.error('❌ Erreur init Firebase:', error);
}

export default admin;
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let serviceAccount;
try {
    serviceAccount = require('../../service-account.json');
} catch (e) {
    console.error("❌ ERREUR CRITIQUE: Impossible de trouver 'service-account.json' à la racine du backend !");
    process.exit(1);
}

export const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialisé avec succès");
    }
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase:", error);
  }
};

export default admin;
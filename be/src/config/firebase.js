import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let serviceAccount;

// 1. TENTATIVE : Via Variable d'Environnement (Mode Production / Azure)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // On parse le JSON stocké dans la variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log("✅ Config Firebase chargée depuis la variable d'environnement.");
  } catch (e) {
    console.error("❌ Erreur de lecture de la variable FIREBASE_SERVICE_ACCOUNT :", e.message);
  }
}

// 2. TENTATIVE : Via Fichier Local (Mode Développement / PC)
if (!serviceAccount) {
  try {
    // On cherche le fichier uniquement si la variable n'est pas là
    serviceAccount = require('../../service-account.json');
    console.log("✅ Config Firebase chargée depuis le fichier local.");
  } catch (e) {
    console.warn("⚠️ Fichier service-account.json introuvable (Normal en Prod si la variable est utilisée).");
  }
}

// 3. VÉRIFICATION FINALE
if (!serviceAccount) {
  console.error("❌ ERREUR CRITIQUE : Impossible de charger les identifiants Firebase (ni variable d'env, ni fichier).");
  // En production, on arrête tout car sans Firebase, l'app ne marchera pas
  if (process.env.NODE_ENV === 'production') {
      process.exit(1);
  }
}

export const initFirebase = () => {
  try {
    if (!admin.apps.length && serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("🚀 Firebase Admin initialisé avec succès");
    }
  } catch (error) {
    console.error("❌ Erreur initialisation Firebase:", error);
  }
};

export default admin;
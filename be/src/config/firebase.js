import admin from 'firebase-admin';
import 'dotenv/config'; // Charge les variables du fichier .env

let serviceAccount;

try {
  // On vérifie que la variable existe
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("La variable d'environnement FIREBASE_SERVICE_ACCOUNT est vide.");
  }

  // On transforme la string JSON en objet JavaScript
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

} catch (e) {
  console.error("ERREUR CRITIQUE: Impossible de lire la configuration Firebase !");
  console.error("Détail de l'erreur :", e.message);
  // Vérifie bien que ton JSON est valide et sur une seule ligne dans le .env
  process.exit(1);
}

export const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialisé avec succès via variable d'environnement");
    }
  } catch (error) {
    console.error("Erreur initialisation Firebase:", error);
  }
};

export default admin;
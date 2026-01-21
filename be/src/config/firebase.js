import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

try {
    let serviceAccount;

    // 1. On essaie de récupérer la variable d'environnement
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (rawServiceAccount) {
        // NETTOYAGE CRITIQUE : Parfois Docker ou le .env ajoute des ' autour du JSON
        // On enlève les guillemets simples au début et à la fin si présents
        const cleanServiceAccount = rawServiceAccount.trim().replace(/^'|'$/g, '');

        try {
            serviceAccount = JSON.parse(cleanServiceAccount);
            console.log("🔹 Configuration Firebase chargée depuis ENV");
        } catch (parseError) {
            console.error("❌ Erreur de parsing JSON Firebase:", parseError.message);
            console.error("Début du JSON reçu:", cleanServiceAccount.substring(0, 50) + "...");
        }
    } else {
        console.warn("⚠️ Variable FIREBASE_SERVICE_ACCOUNT manquante !");
    }

    // 2. Initialisation (Uniquement si pas déjà fait)
    if (!admin.apps.length) {
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin SDK initialisé avec succès !");
        } else {
            console.error("❌ Impossible d'initialiser Firebase : Aucune clé valide.");
        }
    }

} catch (error) {
    console.error("❌ CRASH Initialisation Firebase:", error);
}

export default admin;
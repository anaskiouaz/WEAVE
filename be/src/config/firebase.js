import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

try {
    const serviceAccount = JSON.parse(
      await readFile(new URL('./service-account.json', import.meta.url))
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    console.log("✅ Firebase Admin initialisé");
} catch (e) {
    console.error("⚠️ ATTENTION : Fichier service-account.json manquant ou invalide.");
    console.error("   -> Les notifications ne partiront pas, mais l'app ne plantera pas.");
    
    // Mock pour éviter le crash lors de l'appel
    admin.messaging = () => ({
        sendMulticast: async () => console.log(">> [Simulation] Notification envoyée (pas de config Firebase)")
    });
}

export default admin;
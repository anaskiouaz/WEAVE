// On importe les fonctions depuis le fichier qu'on vient de créer
import { encrypt, decrypt } from './src/utils/crypto.js';

console.log("\n--- 🔐 TEST DU MODULE CRYPTO ---");

// 1. Définition d'une donnée sensible factice
const secretMessage = "Patient diabétique - Insuline requise à 12h00";
console.log(`📝 Message original :  "${secretMessage}"`);

// 2. Test du Chiffrement
const encrypted = encrypt(secretMessage);
console.log(`🔒 Message chiffré  :  "${encrypted}"`);

// Vérification de sécurité basique
if (encrypted === secretMessage) {
    console.error("❌ ERREUR GRAVE : Le message n'est pas chiffré !");
    process.exit(1);
}

// 3. Test du Déchiffrement
try {
    const decrypted = decrypt(encrypted);
    console.log(`🔓 Message déchiffré:  "${decrypted}"`);

    // 4. Validation finale
    if (decrypted === secretMessage) {
        console.log("\n✅ SUCCÈS TOTAL : Le chiffrement est fonctionnel et réversible.");
    } else {
        console.error("\n❌ ÉCHEC : Le message déchiffré est différent de l'original.");
    }
} catch (error) {
    console.error("\n❌ ERREUR CRITIQUE (Crash) :", error.message);
}
console.log("----------------------------------\n");
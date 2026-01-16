// be/src/test-crypto.js
import { chiffrer, dechiffrer } from './utils/crypto.js';

console.log("--- DÉBUT DU TEST ---");

const messageClair = "Patient";
const messageChiffre = chiffrer(messageClair);

console.log("🔒 Message chiffré :", messageChiffre);

if (messageChiffre.includes(':')) {
    console.log("✅ Le format est bon");
} else {
    console.log("❌ ERREUR : Le format est mauvais");
}

const messageDechiffre = dechiffrer(messageChiffre);
console.log("🔓 Message déchiffré :", messageDechiffre);

if (messageDechiffre === messageClair) {
    console.log(" SUCCÈS : Le système fonctionne bon");
} else {
    console.log(" ÉCHEC : Le message n'est pas revenu à la normale.");
}

console.log("--- FIN DU TEST ---");
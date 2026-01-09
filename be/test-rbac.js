

async function testRBAC() {
    console.log("👮 Test du contrôle d'accès (RBAC)...");
    const url = 'http://localhost:4000/api/users';

    // SCÉNARIO 1 : Pas d'identité (Pas de header)
    console.log("\n1. Tentative sans identité...");
    const res1 = await fetch(url);
    console.log(`   Résultat : ${res1.status} (Attendu: 401 Unauthorized)`);

    // SCÉNARIO 2 : Sophie (Rôle USER) essaie d'entrer dans la zone SUPERADMIN
    console.log("\n2. Tentative avec rôle USER (Sophie)...");
    const res2 = await fetch(url, {
        headers: { 'x-user-id': 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22' } // ID de Sophie
    });
    console.log(`   Résultat : ${res2.status} (Attendu: 403 Forbidden - Accès refusé)`);

    // SCÉNARIO 3 : Thomas (Rôle SUPERADMIN) essaie d'entrer
    console.log("\n3. Tentative avec rôle SUPERADMIN (Thomas)...");
    const res3 = await fetch(url, {
        headers: { 'x-user-id': 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' } // ID de Thomas
    });
    console.log(`   Résultat : ${res3.status} (Attendu: 200 OK)`);
    
    if (res3.status === 200) {
        console.log("   ✅ SUCCÈS : Le système sécurisé fonctionne !");
    } else {
        console.error(`   ❌ ERREUR : accès refusé (${res3.status}). Vérifie que Thomas a bien le rôle SUPERADMIN et que l'API tourne.`);
    }
}

testRBAC();
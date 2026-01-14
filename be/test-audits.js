async function testAudit() {
    console.log("🕵️  Test du système d'Audit...");
    
    const thomasId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // SUPERADMIN
    const urlUsers = 'http://localhost:4000/api/users';
    const urlAudit = 'http://localhost:4000/api/users/audit-logs';

    // 1. Thomas accède aux données sensibles (Liste des users)
    console.log("\n1. Thomas consulte la liste des utilisateurs...");
    await fetch(urlUsers, { headers: { 'x-user-id': thomasId } });
    console.log("   Action effectuée.");

    // 2. Thomas vérifie le journal de bord
    console.log("\n2. Vérification du journal d'audit...");
    const res = await fetch(urlAudit, { headers: { 'x-user-id': thomasId } });
    const data = await res.json();

    if (data.success && data.logs.length > 0) {
        const lastLog = data.logs[0];
        console.log("   ✅ LOG TROUVÉ !");
        console.log(`      - Qui : ${lastLog.user_name}`);
        console.log(`      - Quoi : ${lastLog.action}`);
        console.log(`      - Quand : ${lastLog.created_at}`);
    } else {
        console.log("   ❌ Erreur : Aucun log trouvé.");
        console.log(data);
    }
}

testAudit();
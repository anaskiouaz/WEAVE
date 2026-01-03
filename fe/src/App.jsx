import { useEffect, useState } from 'react';
import { apiGet } from './api/client';

function App() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Récupère le statut de santé
    apiGet('/health')
      .then(setHealth)
      .catch((err) => setError(err.message));

    // Récupère les utilisateurs
    apiGet('/users')
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌐 Weave Dev Frontend</h1>

      {/* Health Check */}
      <section>
        <h2>🏥 Statut Backend</h2>
        {health && (
          <pre
            style={{
              backgroundColor: '#f0f0f0',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(health, null, 2)}
          </pre>
        )}
      </section>

      {/* Users List */}
      <section>
        <h2>👥 Utilisateurs (DB)</h2>
        {users ? (
          <div>
            <p><strong>Total:</strong> {users.count} utilisateurs</p>
            {users.users && users.users.length > 0 ? (
              <table
                style={{
                  borderCollapse: 'collapse',
                  width: '100%',
                  marginTop: '10px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>ID</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {users.users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {user.id}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {user.email}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>Aucun utilisateur trouvé.</p>
            )}
          </div>
        ) : (
          <p>Chargement...</p>
        )}
      </section>

      {/* Error */}
      {error && (
        <section>
          <p style={{ color: 'red' }}>
            <strong>❌ Erreur:</strong> {error}
          </p>
        </section>
      )}
    </div>
  );
}

export default App;

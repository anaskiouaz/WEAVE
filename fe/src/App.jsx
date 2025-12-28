import { useEffect, useState } from 'react';
import { apiGet } from './api/client';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet('/health')
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>Weave Dev Frontend</h1>
      {health && (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;

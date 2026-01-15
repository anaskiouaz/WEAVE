# Configuration des Variables d'Environnement

## Backend (be/)

Copiez `.env.example` vers `.env` et configurez les valeurs:

```bash
cd be
cp .env.example .env
```

### Variables disponibles:

- `DATABASE_URL`: URL complète de connexion PostgreSQL
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Paramètres de connexion PostgreSQL individuels
- `PORT`: Port du serveur backend (défaut: 4000)
- `API_BASE_URL`: URL de base de l'API backend (défaut: http://localhost:4000)
- `ALLOWED_ORIGINS`: Origins autorisées pour CORS (séparées par des virgules)
- `JWT_SECRET`: Clé secrète pour la génération de tokens JWT
- `AZURE_STORAGE_*`: Configuration pour Azure Storage (optionnel)

## Frontend (fe/)

Copiez `.env.example` vers `.env` et configurez les valeurs:

```bash
cd fe
cp .env.example .env
```

### Variables disponibles:

- `VITE_API_BASE_URL`: URL de base de l'API (défaut: http://localhost:4000/api)

**Note:** Les variables Vite doivent commencer par `VITE_` pour être exposées au client.

## Fichiers de Test

Les fichiers de test (`test-audits.js`, `test-rbac.js`) utilisent maintenant `process.env.API_BASE_URL` pour se connecter à l'API.

Pour les exécuter avec une URL personnalisée:

```bash
API_BASE_URL=http://localhost:4000 node test-audits.js
```

## Docker

Les variables d'environnement sont configurées dans `docker-compose.yml` pour les conteneurs.

## Sécurité

⚠️ **Important:**
- Ne jamais commiter les fichiers `.env` contenant des données sensibles
- Les fichiers `.env.example` sont sûrs à commiter
- Utiliser des valeurs différentes pour production
- Les fichiers `.env` doivent être dans `.gitignore`

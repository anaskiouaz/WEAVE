# Guide de Migration - Variables d'Environnement

## 🎯 Objectif

Ce guide vous aide à migrer d'un environnement de développement avec des URLs hardcodées vers une configuration basée sur des variables d'environnement.

## ⚡ Actions Immédiates Requises

### 1. Backend - Créer le fichier `.env`

```bash
cd be
cp .env.example .env
```

Éditez `be/.env` et ajustez les valeurs si nécessaire:
```env
API_BASE_URL=http://localhost:4000
PORT=4000
# ... autres variables
```

### 2. Frontend - Créer le fichier `.env`

```bash
cd fe
cp .env.example .env
```

Éditez `fe/.env` si nécessaire:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

### 3. Vérifier les fichiers existants

✅ **Aucune modification de code nécessaire** - Tous les fichiers ont été mis à jour pour utiliser les variables d'environnement avec des fallbacks appropriés.

## 🔍 Ce qui a changé

### Avant
```javascript
// ❌ URL hardcodée
const url = 'http://localhost:4000/api/users';
```

### Après
```javascript
// ✅ Variable d'environnement avec fallback
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const url = `${API_BASE_URL}/api/users`;
```

## 📋 Fichiers Modifiés

### Backend
- ✅ `test-audits.js` - Utilise `process.env.API_BASE_URL`
- ✅ `test-rbac.js` - Utilise `process.env.API_BASE_URL`
- ✅ `package.json` - Scripts de test ajoutés
- ✅ `.env` - Variable `API_BASE_URL` ajoutée

### Frontend
- ✅ `vite.config.js` - Proxies utilisent `process.env.VITE_API_BASE_URL`
- ✅ `src/api/client.js` - Déjà configuré ✓
- ✅ `src/components/Memories.jsx` - Déjà configuré ✓

### Infrastructure
- ✅ `docker-compose.yml` - Variable `API_BASE_URL` ajoutée au service API

## 🚀 Utilisation

### Mode Développement Local

Les valeurs par défaut fonctionnent sans configuration:
```bash
npm run dev
```

### Tests avec Configuration Personnalisée

```bash
# Tester avec une URL différente
API_BASE_URL=http://192.168.1.100:4000 npm run test:audit

# Ou définir dans .env et exécuter simplement:
npm run test:audit
npm run test:rbac
npm run test:crypto
```

### Docker

Docker Compose injecte automatiquement les variables:
```bash
docker-compose up --build
```

## 🌍 Environnements

### Développement Local
```env
API_BASE_URL=http://localhost:4000
VITE_API_BASE_URL=http://localhost:4000/api
```

### Réseau Local (Test sur mobile)
```env
API_BASE_URL=http://192.168.1.100:4000
VITE_API_BASE_URL=http://192.168.1.100:4000/api
```

### Production (Exemple)
```env
API_BASE_URL=https://api.weave.example.com
VITE_API_BASE_URL=https://api.weave.example.com/api
```

## 💡 Bonnes Pratiques

### ✅ À Faire
- Utiliser des variables d'environnement pour les URLs
- Toujours fournir un fallback approprié pour le développement
- Documenter les variables dans `.env.example`
- Commiter `.env.example`, ignorer `.env`

### ❌ À Éviter
- Hardcoder des URLs en production
- Commiter des fichiers `.env` avec des secrets
- Oublier de mettre à jour `.env.example`
- Utiliser la même configuration pour dev et prod

## 🔐 Sécurité

### Variables à NE JAMAIS commiter
- `PGPASSWORD` / `DATABASE_URL` avec vraies credentials
- `JWT_SECRET` de production
- `AZURE_STORAGE_ACCOUNT_KEY`
- Toute clé API ou secret

### Variables OK à commiter (dans .env.example)
- URLs de développement local (`http://localhost:*`)
- Noms de base de données de développement
- Ports standards

## 🆘 Dépannage

### Problème: "Cannot connect to API"
**Solution:** Vérifiez que `API_BASE_URL` / `VITE_API_BASE_URL` correspondent à l'URL où l'API est accessible.

### Problème: "Variable not defined"
**Solution:** 
1. Vérifiez que le fichier `.env` existe
2. Pour Node.js: `dotenv` doit être importé et configuré
3. Pour Vite: Les variables doivent commencer par `VITE_`

### Problème: "Changes not reflected"
**Solution:**
1. Backend: Redémarrez le serveur Node.js
2. Frontend: Redémarrez le serveur Vite
3. Variables Vite sont fixées au moment du build

## 📚 Documentation Complémentaire

- [ENV_CONFIG.md](ENV_CONFIG.md) - Documentation complète des variables
- [CHANGELOG_ENV.md](CHANGELOG_ENV.md) - Récapitulatif des modifications
- [README.md](README.md) - Instructions d'installation générales

## ✨ Avantages de cette Migration

1. **Flexibilité** - Changez d'environnement sans modifier le code
2. **Sécurité** - Pas de secrets dans le code source
3. **Équipe** - Chaque développeur peut avoir sa propre config
4. **CI/CD** - Facilite les déploiements automatisés
5. **Mobile** - Testez sur différents appareils facilement

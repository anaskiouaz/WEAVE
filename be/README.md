# Weave Backend 🔧

Backend Node.js + Express pour la plateforme collaborative de soins **Weave**.

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Configuration](#-configuration)
- [API Endpoints](#-api-endpoints)
- [Architecture](#-architecture)
- [Sécurité](#-sécurité)

---

## 🎯 Vue d'Ensemble

**Weave Backend** est une API REST construite avec :
- **Node.js 22.21** pour les performances
- **Express 4.x** framework minimaliste
- **PostgreSQL** pour la persistence
- **Socket.IO** pour la communication temps réel
- **JWT** pour l'authentification stateless
- **Firebase Admin** pour les notifications push

### Fonctionnalités Principales

✅ **Authentication** – Login/Register avec JWT  
✅ **REST API** – Endpoints pour tâches, incidents, utilisateurs  
✅ **Real-time** – Messagerie et notifications via WebSocket  
✅ **Cron Jobs** – Escalade automatique des incidents  
✅ **Cloud Storage** – Upload images vers Azure Blob  
✅ **Push Notifications** – Notifications Firebase  
✅ **RBAC** – Contrôle d'accès basé rôles  
✅ **Audit Logs** – Traçabilité complète  

---

## 📦 Prérequis

- **Node.js** v22+ 
- **npm** ou **yarn**
- **PostgreSQL** 17+
- **Firebase Project** avec credentials
- **Azure Storage Account** (optionnel)

---

## 🚀 Installation

```bash
cd WEAVE/be
npm install
```

Créez un fichier `.env` :

```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://weave_user:!QAZ1qaz23Q#@localhost:5432/weave_local
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

Placez le fichier `service-account.json` dans `be/`

---

## 🏃 Démarrage

```bash
npm run dev      # Mode développement (nodemon)
npm start        # Production
```

L'API démarre sur `http://localhost:4000`

Vérifier la connexion :
```bash
curl http://localhost:4000/health
```

---

## 🔌 API Endpoints

### Authentification
```
POST   /auth/login         
POST   /auth/register      
POST   /auth/refresh       
```

### Utilisateurs
```
GET    /users/me           
PUT    /users/me           
POST   /users/device-token 
```

### Tâches
```
GET    /tasks              
POST   /tasks              
PUT    /tasks/:id          
DELETE /tasks/:id          
```

### Incidents
```
POST   /incidents          
GET    /incidents/:id      
PUT    /incidents/:id      
```

### Messagerie
```
GET    /conversations      
POST   /conversations      
GET    /conversations/:id/messages     
POST   /conversations/:id/messages     
PUT    /conversations/:id/read         
```

### Cercles de Soins
```
GET    /circles/:id        
PUT    /circles/:id        
GET    /circles/:id/members
POST   /circles/:id/members
```

---

## 📂 Structure du Projet

```
be/src/
├── routes/          # API endpoints
├── middleware/      # Auth, RBAC
├── services/        # Cron, Socket, Notifications
├── utils/           # Helpers
├── config/          # DB & Firebase
├── app.js           # Configuration Express
└── server.js        # Entry point + Socket.IO
```

---

## 🛠 Technologies Clés

| Package | Version | Utilité |
|---------|---------|---------|
| Express | 4.x | Framework web |
| pg | 8.x | Client PostgreSQL |
| jsonwebtoken | 9.x | JWT signing |
| bcryptjs | 2.x | Hash passwords |
| Socket.IO | 4.8 | WebSocket |
| Firebase Admin | 12.0 | Push notifications |
| node-cron | 4.2 | Scheduled jobs |

---

## 🏗 Architecture

**Authentification :**
```
POST /login → JWT créé → Client stocke JWT → Chaque requête inclut JWT → Middleware vérifie
```

**Messagerie Temps Réel :**
```
WebSocket établie → join_conversation → Message envoyé → Broadcast à tous les clients
```

**Escalade Incident :**
```
Incident signalé → Timer défini → Cron vérifie → Si délai écoulé → Escalade automatique
```

---

## 🔐 Sécurité

- ✅ **JWT stateless** avec expiry
- ✅ **RBAC** – Contrôle d'accès par rôles
- ✅ **Helmet** – Headers HTTP sécurisés
- ✅ **Requêtes paramétrées** – Pas de SQL injection
- ✅ **Audit logs** – Traçabilité complète
- ✅ **Password hashing** – bcryptjs 10 rounds

---

## 🐛 Troubleshooting

**Erreur DB :**
```bash
echo $DATABASE_URL
psql -h localhost -U weave_user -d weave_local
```

**Port occupé :**
```bash
PORT=4001  # Changer dans .env
```

**Firebase ne fonctionne pas :**
```bash
ls be/service-account.json
```

---

## 📄 Licence

MIT - Voir [../LICENSE](../LICENSE)

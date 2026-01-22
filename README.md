# Weave  - Plateforme Collaborative de Soins

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![React](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react) ![Node](https://img.shields.io/badge/backend-Node.js_22-339933?logo=nodedotjs) ![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL_17-336791?logo=postgresql) ![Docker](https://img.shields.io/badge/deployment-Docker-2496ED?logo=docker)

> **Weave** est une plateforme web et mobile collaborative conçue pour coordonner le maintien à domicile. Elle connecte aidants familiaux, voisins et bénévoles autour d'un agenda partagé et d'outils sécurisés pour soutenir les personnes en perte d'autonomie.

---

##  Table des Matières

- [ Vision & Contexte](#-vision--contexte)
- [ Fonctionnalités Principales](#-fonctionnalités-principales)
- [ Stack Technique Détaillé](#-stack-technique-détaillé)
- [ Architecture Globale](#-architecture-globale)
- [ Installation & Démarrage](#-installation--démarrage)
- [ Structure du Projet](#-structure-du-projet)
- [ Flux de Données & Cas d'Usage](#-flux-de-données--cas-dusage)
- [ Sécurité & RGPD](#-sécurité--rgpd)
- [ Déploiement Mobile](#-déploiement-mobile)

---

##  Vision & Contexte

### Le Problème

Face au vieillissement de la population, l'organisation du soutien quotidien (courses, suivi médical, lien social) devient complexe et fragmentée. Les informations circulant par SMS, appels ou cahiers papier génèrent des doublons, des oublis et des malentendus potentiellement dangereux.

### La Solution : Weave

**Weave centralise et structure la coordination** en fournissant :
-  Un **agenda partagé** pour éviter les conflits et optimiser les interventions
-  Un **système d'alerte intelligente** pour escalader automatiquement les incidents non résolus
-  Une **messagerie sécurisée** pour la communication instantanée intra-cercle
-  Un **journal de suivi** pour documenter l'humeur et les souvenirs du bénéficiaire
-  Une **gestion des rôles stricte** pour respecter la confidentialité et les hiérarchies décisionnelles

---

##  Fonctionnalités Principales

###  Calendrier Collaboratif
- **Planification des tâches** (visites, courses, médecin, loisirs)
- **Inscription instantanée** des aidants avec gestion des quotas
- **Confirmation et commentaires** pour chaque intervention
- **Filtrage par type de tâche** (médical, shopping, activité)
- **Export iCalendar** pour intégration à d'autres calendriers

###  Gestion des Incidents (Système Critique)
- **Signalement en temps réel** par les aidants sur place
- **Timer intelligent** : si l'Aidant Principal (AP) ne répond pas en X minutes (configurable), l'alerte remonte au tiers de confiance ou aux secours
- **Historique complet** de tous les incidents avec horodatage
- **Audit trail** pour responsabilité légale

###  Messagerie Sécurisée
- **Conversations privées** entre membres du cercle avec affichage des photos de profil
- **Groupes de discussion** pour coordonner les interventions
- **Notifications en temps réel** via WebSocket (Socket.IO)
- **Marquage comme lu** pour éviter les doublons de messages
- **Historique complet** archivé

###  Journal de Bord
- **Suivi quotidien** de l'humeur (échelle 1-10)
- **Partage de souvenirs** (photos, notes) avec timestamps
- **Export en PDF** du journal pour documentation médicale
- **Visibility contrôlée** par rôle

###  Gestion des Rôles & Cercles de Soins
- **Administrateur** (Aidant Principal) : contrôle total du cercle
- **Aidants Secondaires** : accès complet sauf suppression du cercle
- **Bénévoles** : accès aux tâches et incidents, messagerie limitée
- **Cercles de soins multiples** : un utilisateur peut appartenir à plusieurs cercles
- **Privacy by Design** : chaque rôle voit uniquement ce qu'il doit voir

###  Onboarding & Tours Guidés
- **Tour interactif** au premier accès avec React Joyride
- **Explication contextuelle** des features
- **Option de rejouer le tour** à tout moment

###  Gestion des Cookies & RGPD
- **Banneau de consentement** avec choix granulaires
- **Cookies essentiels** (non désactivables, conformes GDPR)
- **Cookies analytiques** et marketing optionnels
- **Préférences stockées** localement

---

##  Stack Technique Détaillé

###  Frontend (/fe)

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | React | 19.2 |
| **Build Tool** | Vite | 7.2 |
| **Routing** | React Router | 7.1 |
| **Styling** | TailwindCSS | 4.0 |
| **Icônes** | Lucide React | 0.469 |
| **Animations** | Framer Motion | 12.28 |
| **HTTP Client** | Axios | 1.13 |
| **PDF Export** | jsPDF | 4.0 |
| **Tours Guidés** | React Joyride | 2.9 |
| **Real-time** | Socket.IO Client | 4.8 |
| **Mobile** | Capacitor | 8.0 |

###  Backend (/be)

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Runtime** | Node.js | 22.21 |
| **Framework** | Express | 4.x |
| **Authentification** | JWT | 9.x |
| **Hash Mots de passe** | bcryptjs | 2.x |
| **Sécurité Headers** | Helmet | 7.x |
| **Real-time** | Socket.IO | 4.8 |
| **Database Client** | pg | 8.x |
| **Cron Jobs** | node-cron | 4.2 |
| **Cloud Storage** | Azure Blob | 12.x |
| **Push Notifications** | Firebase Admin | 12.0 |

###  Base de Données

| Composant | Tech | Version |
|-----------|------|---------|
| **SGBD** | PostgreSQL | 17.7 |
| **Hébergement** | Azure Database PostgreSQL | Cloud |

---

##  Architecture Globale

\\\
Client (React SPA + Mobile)  API Express (Node.js)  PostgreSQL
           (HTTPS/WSS)              (JWT Auth)           (ACID)
\\\

**Flux de Communication :**
1. Frontend envoie requête HTTPS
2. Middleware JWT vérifie authentification
3. Contrôle d'accès basé rôle (RBAC)
4. Backend interroge PostgreSQL
5. WebSocket (Socket.IO) pour temps réel (chat, notifications)
6. Cron jobs pour escalade automatique des incidents

---

##  Installation & Démarrage

### Prérequis

- **Docker** & **Docker Compose** installés
- **Git**
- **Fichier service account** (Firebase)   *À demander à l'admin*

###  Fichier Service Account

Pour que l'application fonctionne, vous avez besoin d'un fichier de credentials :

1. **Récupérez le fichier** auprès de l'administrateur du projet
2. **Placez-le** dans e/service-account.json
3. **Vérifiez** que le backend le détecte au démarrage

### Procédure Complète

#### 1 Cloner le dépôt

\\\ash
git clone https://github.com/anaskiouaz/WEAVE.git
cd WEAVE
\\\

#### 2 Configurer le fichier service account

\\\ash
cp /path/to/service-account.json be/service-account.json
\\\

#### 3 Lancer l'environnement complet

\\\ash
docker-compose up --build
\\\

Cela démarre simultanément :
-  **PostgreSQL** (\localhost:5432\)
-  **API Backend** (\http://localhost:4000\)
-  **Frontend** (\http://localhost:5173\)

#### 4 Accéder à l'application

| Service | URL |
|---------|-----|
| **Frontend** | \http://localhost:5173\ |
| **API** | \http://localhost:4000\ |
| **Database** | \localhost:5432\ |

### Identifiants Développement (Docker)

\\\
Base de Données
 User: weave_user
 Password: !QAZ1qaz23Q#
 Database: weave_local
\\\

###  Arrêter l'environnement

\\\ash
docker-compose down
\\\

---

##  Structure du Projet

\\\
WEAVE/
 fe/                   # Frontend React + Vite
    src/
       components/   # Dashboard, Calendar, Profile, Chat...
       context/      # Auth & Cookie context
       api/          # Requêtes HTTP
       style/        # TailwindCSS
    capacitor.config.json
    package.json

 be/                   # Backend Node.js + Express
    src/
       routes/       # API endpoints
       middleware/   # Auth, RBAC
       services/     # Cron, Socket, Notifications
       utils/        # Utilities & helpers
       config/       # DB & Firebase config
       server.js     # Entry point
    service-account.json  #  À récupérer (non versionné)
    package.json

 weave-db/             # Base de données
    migrations/       # SQL scripts
    Dockerfile

 docker-compose.yml    # Orchestration
 README.md
\\\

---

##  Flux de Données & Cas d'Usage

### 1 Créer une Tâche

\\\
Admin  POST /tasks  Validation rôle  INSERT DB  Socket.IO broadcast  Notification mobile
\\\

### 2 Escalade Automatique d'Incident

\\\
Aidant signale problème  Timer (1h)  Cron job vérifie  Si Admin absent  Escalade automatique  SMS + Push
\\\

### 3 Messagerie Temps Réel

\\\
User 1  POST /message  Backend  Socket.IO emit  User 2 reçoit live
\\\

---

##  Sécurité & RGPD

###  Mesures

-  **Authentification JWT**
-  **Hash bcryptjs** pour mots de passe
-  **Helmet** pour headers HTTP sécurisés
-  **CORS whitelist**
-  **Audit logs** complets
-  **Contrôle d'accès basé rôles (RBAC)**

###  Conformité RGPD

-  Consentement explicite aux cookies
-  Droit à l'oubli (DELETE endpoint)
-  Audit trail complet
-  Privacy by Design
-  HTTPS en production

---

##  Déploiement Mobile

### Compilation iOS/Android

\\\ash
cd fe
npm run build
npx cap copy
npx cap open ios     # Xcode
npx cap open android # Android Studio
\\\

### Fonctionnalités Natives

-  Notifications Push (Firebase)
-  Stockage local (Preferences)
-  Appareil photo (Camera)
-  Géolocalisation (prévu)
-  Biométrie (prévu)

---

##  Roadmap

-  Intégration Calendrier Externe (Google, Outlook)
-  Dashboard Admin avancé
-  IA & Recommandations
-  Géolocalisation temps réel
-  Appels vidéo intégrés
-  Accessibilité WCAG 2.1 AA
-  Multilingue

---

##  Contribution

Pour contribuer :
1. Fork le dépôt
2. Créez une branche (\git checkout -b feature/amazing-feature\)
3. Committez (\git commit -m 'Add amazing feature'\)
4. Poussez (\git push origin feature/amazing-feature\)
5. Ouvrez une Pull Request

---

##  Licence

MIT License - voir [LICENSE](LICENSE)

---

##  Équipe

- **Anas Kiouaz**  Founder & Lead Developer
- Merci à tous les contributeurs ! 

---

<div align="center">

**Weave**  *Tisser la solidarité autour du soin* 

</div>

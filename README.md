# Weave 🧶

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![React](https://img.shields.io/badge/frontend-React_19-61DAFB?logo=react) ![Node](https://img.shields.io/badge/backend-Node.js_22-339933?logo=nodedotjs) ![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL_17-336791?logo=postgresql) ![Docker](https://img.shields.io/badge/deployment-Docker-2496ED?logo=docker)

> **Weave** est une application web collaborative d'emploi du temps solidaire. Elle est conçue pour faciliter la coordination entre les proches, les voisins et les bénévoles afin de soutenir le maintien à domicile des personnes en perte d'autonomie.

## 📋 Table des matières

- [Contexte et Objectifs](#-contexte-et-objectifs)
- [Fonctionnalités Clés](#-fonctionnalités-clés)
- [Stack Technique](#-stack-technique)
- [Installation et Démarrage](#-installation-et-démarrage)
- [Structure du Projet](#-structure-du-projet)
- [L'Équipe](#-léquipe)

---

## 🎯 Contexte et Objectifs

Face au vieillissement de la population, l'organisation du soutien quotidien (courses, lien social, rendez-vous médicaux) devient complexe. **Weave** apporte une solution structurante pour fluidifier cette coordination.

**Nos objectifs :**
* **Centraliser** l'information via un agenda partagé pour éviter les doublons et les oublis.
* **Sécuriser** les interventions grâce à un système de gestion des incidents et d'escalade automatique.
* **Rompre l'isolement** en facilitant l'interaction entre aidants familiaux, voisins et bénévoles.

---

## ✨ Fonctionnalités Clés

* **📅 Calendrier Collaboratif :** Planification des tâches (visites, courses) et inscription des bénévoles avec gestion des quotas en temps réel.
* **🚨 Gestion des Incidents (Critique) :** Signalement d'anomalies par les bénévoles sur place. Système intelligent de "Timer" : si l'aidant principal ne répond pas sous un délai imparti (ex: 1h), l'alerte est escaladée automatiquement à un tiers de confiance ou aux secours.
* **💬 Messagerie Sécurisée :** Chat intégré pour la communication instantanée entre les membres du "Cercle de Soins".
* **📒 Journal de Bord :** Suivi de l'humeur du bénéficiaire et partage de souvenirs (photos/notes) exportables en PDF.
* **🛡️ Gestion des Rôles :** Distinction stricte entre Administrateur (Aidant Principal), Aidants secondaires et Bénévoles pour assurer la confidentialité (Privacy by Design).

---

## 🛠 Stack Technique

Le projet repose sur une architecture moderne séparant le frontend, le backend et la base de données, le tout conteneurisé.

### **Frontend (`/fe`)**
* **Framework :** React 19.2 (Vite 7.2).
* **Langage :** JavaScript (ESModules).
* **Styling :** TailwindCSS 4.0.
* **UI/UX :** Lucide-react (icônes), React Router v7.
* **Fonctionnalités :** Génération PDF (`jspdf`) pour les exports de journal.

### **Backend (`/be`)**
* **Runtime :** Node.js 22.21.1.
* **Framework :** Express v4.
* **Sécurité :** `helmet`, `bcryptjs` (hachage), `jsonwebtoken` (JWT).
* **Logging :** `morgan`.

### **Base de Données**
* **SGBD :** PostgreSQL 17.7.
* **Hébergement Production :** Azure Database for PostgreSQL.

---

## 🚀 Installation et Démarrage

Le projet est entièrement "dockerisé" pour faciliter le développement local via `docker-compose`.

### ⚠️ Fichier Service Account (Firebase ou autre)

Pour fonctionner correctement en local, l'API a besoin d'un fichier de credentials de service (service account) au format `.json` (par exemple pour Firebase).

**Ce fichier n'est pas versionné pour des raisons de sécurité.**

**Étapes à suivre :**

1. Récupérez le fichier de service account auprès de l'administrateur du projet ou via le Discord.
2. Placez ce fichier dans le dossier approprié du backend (`be/`).
3. Vérifiez que la variable d'environnement ou la configuration pointe bien vers ce fichier (tout devrai être bon).

Sans ce fichier, certaines fonctionnalités (authentification, notifications, etc.) ne fonctionneront pas et la connection serait impossible.

### Prérequis
* [Docker](https://www.docker.com/) et Docker Compose installés sur votre machine.
* Git.

### Procédure

1.  **Cloner le dépôt :**
    ```bash
    git clone [https://github.com/anaskiouaz/WEAVE.git](https://github.com/anaskiouaz/WEAVE.git) 
    cd WEAVE
    ```

2.  **Lancer l'environnement :**
    Cette commande monte la base de données, lance l'API et le frontend simultanément.
    ```bash
    docker-compose up --build
    ```

3.  **Accéder à l'application :**
    * **Frontend :** `http://localhost:5173`
    * **API :** `http://localhost:4000`
    * **Base de données :** `localhost:5432`

### Identifiants Locaux (Développement)
Configurés dans le `docker-compose.yml` :
* **DB User :** `weave_user`
* **DB Password :** `!QAZ1qaz23Q#`
* **DB Name :** `weave_local`

---

## 📂 Structure du Projet

```text
WEAVE/
├── .github/              # Workflows CI/CD
├── be/                   # Backend (Node.js/Express)
│   ├── src/
│   │   ├── config/       # Configuration DB
│   │   ├── routes/       # API Routes (health, tasks, users...)
│   │   ├── app.js        # Setup Express
│   │   └── server.js     # Entry point
│   └── Dockerfile 
├── fe/                   # Frontend (React/Vite)
│   ├── src/              # Composants, Pages, Assets
│   ├── vite.config.js
│   └── Dockerfile
├── weave-db/             # Base de données
│   └── migrations/       # Scripts SQL (01_initial_schema.sql...)
└── docker-compose.yml    # Orchestration locale
``` 
 
## App Mobile

# Capacitor :

Encapsuler l'app web dans une app native afin d'avoir toutes 
les fonctionnalités d'une vraie app (notifs, localisation, photos...).

# Fonctionnement :

1/ Enregistrement
L'app mobile démarre, elle demande à Firebase un token.
Firebase répond en lui envoyant le token.
L'app mobile envoie ce Token au Serveur Node.js.
Le serveur le sauvegarde dans la base de données dans la colonne fcm_token.

2/ Action (ajout tache)
Sur PC, créer une tâche "Sortir les poubelles".
Le frontend envoie cette info au backend via une requête HTTP (POST /tasks).

3/ Tri notif
Le backend reçoit la tâche et l'enregistre dans la BD.
Après, il demande à la BD qui doivent recevoir la notif.
La BD ressort la liste des fcm_token enregistrés.

4/ L'Envoi Notif
Le backend utilise la librairie firebase-admin et le fichier service-account.json.
Ca dit aux serveurs de Google d'envoyer le message 'Nouvelle tâche' à l'adresse Token.
Google (FCM) cherche le tel lié au Token sur Internet.
Il push l'action directement dans le système Android du tel.
Le tel reçoit le signal, réveille l'app, et affiche la notif "Nouvelle tâche".

# Fichiers Firebase :

Utiles afin de créer un token pour les notifs.

google-services.json (Côté Téléphone / Android) : 
Quand l'app démarre sur le téléphone, elle montre ce fichier à Google.
Google vérifie si c'est bien l'application WEAVE.
Ensuite, Google donne au téléphone un Token. C'est l'id du tel.

service-account.json (Côté Serveur / Docker) : 
Il contient une clé privée.
Il dit à Google d'envoyer une notif quand demandé.

Firebase.js : Initialisation de firebase.
Il initialise le SDK "Admin" qui a le droit d'envoyer des messages aux téléphones.

# Fichiers .env de fe/

Stocke l'adresse ip locale du PC afin de se connecter car le serveur (Docker) tourne dessus.
Ou alors l'adresse du backend de Azure afin d'avoir l'app en prod.

Il utilise admin.messaging().sendEachForMulticast(...). C'est la méthode obligatoire de Google.

Auto-Réparation (initDB) : Au démarrage, il vérifie chaque colonne..
Assouplissement : Il retire les obligations strictes (NOT NULL). Avant, si pas de circle_id, ça plantait. Maintenant, ca accepte les champs vides.

# Fichier Dashboard.jsx

Fichier pour envoyer la demande notification et enregistrer sur GoogleFirebase le token.

# Dossier Android

Dossier crée à l'installation de Capacitor, ne pas toucher, configurations de bases.
npm i @capacitor/core
npm i -D @capacitor/cli
npm i @capacitor/android
etc...

# Logique de notifications.js

notifyCircle : Pour informer tout un cercle d'aidants (Tâches, Souvenirs).
notifyConversation : Pour informer les participants d'un chat (Messages).

# Logique de cronService

Un script tourne chaque minute pour vérifier les tâches qui commencent dans 30 minutes.
Cas 1 (Tâche assignée) : Envoie un rappel personnel ("C'est bientôt !") uniquement au bénévole inscrit.
Cas 2 (Tâche non pourvue) : Envoie une alerte générale ("Urgent : Besoin d'aide !") à tous les membres du cercle disponibles à cette heure-là.

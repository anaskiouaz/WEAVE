# Weave Frontend 

Frontend React + Vite pour la plateforme collaborative de soins **Weave**.

##  Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Démarrage](#-démarrage)
- [Structure du Projet](#-structure-du-projet)
- [Technologies Clés](#-technologies-clés)
- [Commandes Disponibles](#-commandes-disponibles)
- [Architecture](#-architecture)
- [Déploiement](#-déploiement)

---

##  Vue d'Ensemble

**Weave Frontend** est une Single Page Application (SPA) moderne construite avec :
- **React 19.2** pour la réactivité maximale
- **Vite 7.2** pour un build ultra-rapide
- **TailwindCSS 4.0** pour le styling responsive
- **Socket.IO** pour la communication temps réel
- **Capacitor** pour la compilation mobile iOS/Android

### Fonctionnalités Principales

 **Dashboard**  Vue d'ensemble avec stats aidants, tâches, messages, souvenirs  
 **Calendrier**  Planification collaborative des interventions  
 **Messagerie**  Chat privé et groupes temps réel  
 **Journal de Bord**  Suivi humeur + partage souvenirs  
 **Gestion Profil**  Configuration utilisateur et préférences  
 **Admin Panel**  Gestion du cercle de soins  
 **Authentification**  Login/Register avec JWT  
 **Mobile**  Responsive design + app native iOS/Android  

---

##  Prérequis

- **Node.js** v20+ ([télécharger](https://nodejs.org/))
- **npm** ou **yarn**
- **Git**
- Backend Weave en fonctionnement (\http://localhost:4000\)

---

##  Installation

### 1 Cloner et installer les dépendances

\\\ash
cd WEAVE/fe
npm install
\\\

### 2 Configurer les variables d'environnement

Créez un fichier \.env.local\ à la racine du dossier \e/\ :

\\\ash
# .env.local
VITE_API_BASE_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_FIREBASE_CONFIG={...}  # Optionnel pour le dev local
\\\

### 3 Vérifier la connexion au backend

Le backend doit être accessible sur \http://localhost:4000/health\

\\\ash
curl http://localhost:4000/health
\\\

---

##  Démarrage

### Mode Développement

\\\ash
npm run dev
\\\

Le frontend démarre sur \http://localhost:5173\ avec HMR (Hot Module Replacement) activé.

### Build Production

\\\ash
npm run build
\\\

Génère un dossier \dist/\ optimisé.

### Prévisualiser la build

\\\ash
npm run preview
\\\

---

##  Structure du Projet

\\\
fe/src/

 components/
    Dashboard.jsx          # Vue d'ensemble
    Calendar/              # Gestion interventions
    Memories.jsx           # Journal de bord
    Profile.jsx            # Profil utilisateur
    Admin.jsx              # Gestion cercle
    LandingPage.jsx        # Page d'accueil
    auth/                  # Auth (Login, Register, Guards)
    messagerie/            # Chat temps réel
    ui-mobile/             # Composants mobile
    App.jsx                # Layout principal

 context/
    AuthContext.jsx        # État authentification
    CookieContext.jsx      # État cookies

 api/
    client.js              # Client HTTP Axios

 constants/
    skills.js              # Listes compétences

 assets/                    # Images et icônes

 style/
    App.css
    index.css
    tailwind.css
    theme.css

 main.jsx                   # Entry point
\\\

---

##  Technologies Clés

| Package | Version | Utilité |
|---------|---------|---------|
| React | 19.2 | Framework UI |
| Vite | 7.2 | Build tool |
| React Router | 7.1 | Navigation SPA |
| TailwindCSS | 4.0 | Styling CSS |
| Lucide React | 0.469 | Icônes |
| Framer Motion | 12.28 | Animations |
| Axios | 1.13 | Client HTTP |
| Socket.IO Client | 4.8 | WebSocket real-time |
| jsPDF | 4.0 | Export PDF |
| React Joyride | 2.9 | Tours guidés |
| Capacitor | 8.0 | Mobile iOS/Android |

---

##  Commandes Disponibles

\\\ash
npm run dev          # Démarrage développement
npm run build        # Build production
npm run preview      # Prévisualiser production
npm run lint         # Lint ESLint
npx cap add ios      # Ajouter iOS
npx cap add android  # Ajouter Android
npx cap open ios     # Ouvrir Xcode
npx cap open android # Ouvrir Android Studio
\\\

---

##  Architecture

### Context API
- **AuthContext** : Utilisateur, circleId, token, fonction logout
- **CookieContext** : Consentement cookies, banneau, préférences

### Client API (Axios)
- Requêtes centralisées avec JWT auto
- Circle ID auto-ajouté aux requêtes
- Gestion erreurs et timeout

### Socket.IO
- Messages temps réel
- Notifications push
- Join/Leave conversations

---

##  Déploiement

### Web (Vercel)
\\\ash
# Push sur GitHub  Deploy auto sur Vercel
npm run build
\\\

### Mobile (iOS)
\\\ash
npm run build
npx cap copy
npx cap open ios
# Build & run dans Xcode
\\\

### Mobile (Android)
\\\ash
npm run build
npx cap copy
npx cap open android
# Build & run dans Android Studio
\\\

---

##  Troubleshooting

**Frontend ne se connecte pas à l'API**
\\\ash
curl http://localhost:4000/health  # Vérifier l'API
# Vérifier .env.local VITE_API_BASE_URL
\\\

**HMR ne fonctionne pas**
\\\ash
npm run dev  # Redémarrer
\\\

**Build échoue**
\\\ash
rm -rf node_modules dist
npm install
npm run build
npm run lint  # Vérifier erreurs
\\\

---

##  Licence

MIT - Voir [../LICENSE](../LICENSE)

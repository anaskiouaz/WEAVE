# WEAVE

Plateforme web collaborative pour la gestion de projets et la communication d'équipe.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## 🚀 Fonctionnalités

- Gestion de projets en équipe
- Outils de collaboration en temps réel
- Interface utilisateur moderne
- Support Docker pour le déploiement

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/anaskiouaz/WEAVE.git

# Installer les dépendances
cd WEAVE
npm install

# Lancer le projet en mode développement
npm run dev

# OU avec Docker
docker-compose up
```

## 📁 Structure du projet

```
WEAVE/
├── fe/          # Frontend (Node.js)
├── be/          # Backend (API)
├── weave-db/    # Base de données
└── docker-compose.yml
```

## 🛠️ Technologies

- **Frontend:** JavaScript, Node.js
- **Backend:** API REST
- **Base de données:** (à configurer)
- **Conteneurisation:** Docker

## 🔧 Configuration

Créer un fichier `.env` à la racine :

```env
DB_HOST=localhost
DB_PORT=5432
API_PORT=3000
```

## 📝 Licence

MIT License
# be/Dockerfile

# 1. Image de base légère
FROM node:22-alpine

# 2. Répertoire de travail
WORKDIR /app

# 3. Copier les fichiers de dépendances
COPY package*.json ./

# 4. Installation propre des dépendances (uniquement production)
RUN npm ci --only=production

# 5. Copier le reste du code source
COPY . .

# 6. Exposer le port (Azure utilise souvent le 80 ou 8080, mais on peut mapper le 4000)
EXPOSE 4000

# 7. Commande de démarrage
CMD ["node", "src/index.js"] 
# (Assure-toi que ton index.js est bien là, ou ajuste selon ton "main" dans package.json)
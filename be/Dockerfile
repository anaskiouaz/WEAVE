# 1. Image de base légère
FROM node:22-alpine

# 2. Répertoire de travail
WORKDIR /app

# 3. Copier les dépendances
COPY package*.json ./

# 4. Installation propre (prod uniquement)
RUN npm ci --only=production

# 5. Copier le code source
COPY . .

# 6. Port (Azure map dynamiquement, mais 8080 est standard)
EXPOSE 8080

# 7. Démarrage
CMD ["node", "src/server.js"]
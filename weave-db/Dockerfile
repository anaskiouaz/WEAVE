# On part d'une image légère Linux
FROM alpine:3.18

# On installe le client Postgres pour pouvoir envoyer les commandes SQL
RUN apk add --no-cache postgresql-client bash

# On définit le dossier de travail
WORKDIR /app

# On copie vos fichiers SQL depuis votre dossier local vers le conteneur
COPY ./migrations ./migrations

# On copie aussi vos scripts (au cas où vous voudriez utiliser run_migrations_local.sh plus tard)
COPY ./scripts ./scripts

# Commande qui s'exécute au démarrage :
# Elle attend un peu, puis exécute tous les fichiers .sql du dossier migrations par ordre alphabétique
CMD ["sh", "-c", "echo 'Waiting for DB...'; sleep 2; for f in ./migrations/*.sql; do echo \"Running $f ...\"; psql -h weave-db -U user -d weave_db -f \"$f\"; done; echo 'Migrations completed.'"]
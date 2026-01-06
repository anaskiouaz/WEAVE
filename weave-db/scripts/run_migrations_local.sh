#!/bin/bash
set -e

# On utilise les variables d'env fournies par Docker, sinon on prend les défauts
DB_NAME="${PGDATABASE:-weave_local}"
DB_USER="${PGUSER:-postgres}"
DB_HOST="${PGHOST:-localhost}"

# Petite pause pour être sûr que la DB est prête (optionnel mais utile)
echo "Waiting for database..."
sleep 2

# Note: Le script assume qu'il est lancé depuis la racine du dossier weave-db
for FILE in $(ls migrations/*.sql 2>/dev/null | sort); do
    BASENAME=$(basename "$FILE")
    echo "Applying migration: $BASENAME"
    # PGPASSWORD est lu automatiquement par psql s'il est dans l'env
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$FILE"
done

echo "All migrations applied to database: $DB_NAME"
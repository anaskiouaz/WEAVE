#!/bin/bash
set -e

DB_NAME="weave_local"
DB_USER="postgres"
DB_HOST="localhost"

for FILE in $(ls migrations/*.sql 2>/dev/null | sort); do
    BASENAME=$(basename "$FILE")
    echo "Applying migration: $BASENAME"
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$FILE"
done

echo "All migrations applied to local database: $DB_NAME"

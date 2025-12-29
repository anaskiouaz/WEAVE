cat > README.md << 'EOF'
# Weave Database Repository

This repository contains:

- Database schema migrations
- Data migrations
- Utility scripts (local migrations, sync, etc.)
- DB-related documentation

## Usage (high-level)

- Branches are created from Jira (source = develop)
- Migrations live under `migrations/` and `data-migrations/`
- No local merges. All merges via PR into `develop` / `main`.

The database is currently empty. The first developer who needs a table will create `001_...sql` in `migrations/`.
EOF

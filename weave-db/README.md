# Weave Database 🗄

Base de données PostgreSQL pour la plateforme collaborative de soins **Weave**.

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Schéma de la Base de Données](#-schéma-de-la-base-de-données)
- [Migrations](#-migrations)
- [Connexion](#-connexion)
- [Backup & Restore](#-backup--restore)

---

## 🎯 Vue d'Ensemble

**Weave Database** est une base de données PostgreSQL 17+ conçue pour gérer :

- ✅ **Utilisateurs & Authentification** – Profils, credentials, device tokens
- ✅ **Cercles de Soins** – Groupes d'aidants avec rôles
- ✅ **Tâches & Interventions** – Planification collaborative
- ✅ **Incidents** – Alertes critiques avec escalade
- ✅ **Messagerie** – Conversations privées et groupes
- ✅ **Journal de Bord** – Suivi humeur et souvenirs
- ✅ **Audit Logs** – Traçabilité de toutes les actions

---

## 📦 Prérequis

- **PostgreSQL** 17+ ([télécharger](https://www.postgresql.org/download/))
- **psql** CLI tool
- **Docker** (optionnel, pour exécuter en conteneur)

---

## 🚀 Installation

### Avec Docker (Recommandé)

```bash
cd WEAVE/weave-db
docker build -t weave-db .
docker run -d \
  -e POSTGRES_USER=weave_user \
  -e POSTGRES_PASSWORD='!QAZ1qaz23Q#' \
  -e POSTGRES_DB=weave_local \
  -p 5432:5432 \
  weave-db
```

### Localement

```bash
# Créer la base de données
createdb weave_local -U postgres

# Exécuter les migrations
psql -h localhost -U weave_user -d weave_local < migrations/01_initial_schema.sql
psql -h localhost -U weave_user -d weave_local < migrations/02_initial_insert.sql
psql -h localhost -U weave_user -d weave_local < migrations/04_add_circle_id_to_audit_logs.sql
```

---

## 📊 Schéma de la Base de Données

### Utilisateurs

```sql
users (id, email, password_hash, name, profile_photo, phone, address, 
       notifications_enabled, created_at, updated_at)
```

### Cercles de Soins

```sql
care_circles (id, name, description, owner_id, created_at, updated_at)
```

### Rôles Utilisateurs

```sql
user_roles (user_id, circle_id, role, joined_at)
-- Rôles: ADMIN, AIDANT_PRINCIPAL, AIDANT_SECONDAIRE, BENEVOLE
```

### Tâches

```sql
tasks (id, circle_id, title, description, date, time, task_type,
       status, helper_id, helper_name, created_at, updated_at)
-- Types: medical, shopping, activity
-- Status: pending, confirmed, completed, cancelled
```

### Incidents

```sql
incidents (id, circle_id, title, description, status, reported_by,
           reported_at, escalated_to, escalated_at, resolved_at, 
           created_at, updated_at)
-- Status: open, escalated, resolved
```

### Messagerie

```sql
conversation (id, nom, type, cercle_id, date_creation)
-- Type: PRIVE, GROUPE

participant_conversation (conversation_id, utilisateur_id, date_lecture)

message (id, conversation_id, auteur_id, contenu, date_envoi)
```

### Journal de Bord

```sql
journal_entries (id, circle_id, author_id, mood, text_content, 
                 photo_data, created_at, updated_at)
-- mood: 1-10
```

### Audit Logs

```sql
audit_logs (id, user_id, circle_id, action, entity_type, entity_id,
            old_values, new_values, timestamp)
-- Actions: CREATE, UPDATE, DELETE, LOGIN
```

---

## 📁 Migrations

Les migrations sont numérotées et doivent être exécutées dans l'ordre :

### `01_initial_schema.sql`
Crée toutes les tables et indexes principaux.

**Tables créées :**
- users
- care_circles
- user_roles
- tasks
- incidents
- conversation
- participant_conversation
- message
- journal_entries
- skills
- user_skills
- availability
- user_availability
- audit_logs

### `02_initial_insert.sql`
Insère les données de test et valeurs par défaut.

### `04_add_circle_id_to_audit_logs.sql`
Ajoute la colonne `circle_id` à la table `audit_logs` pour améliorer les requêtes de filtrage.

---

## 🔗 Connexion

### Avec psql

```bash
psql -h localhost -U weave_user -d weave_local -W

# Paramètres :
# Host: localhost
# Port: 5432
# User: weave_user
# Password: !QAZ1qaz23Q#
# Database: weave_local
```

### Depuis l'application

```javascript
// .env backend
DATABASE_URL=postgresql://weave_user:!QAZ1qaz23Q#@localhost:5432/weave_local
```

---

## 💾 Backup & Restore

### Créer un backup complet

```bash
pg_dump -h localhost -U weave_user -d weave_local -F c -b -v -f weave_backup.dump
```

### Restaurer depuis un backup

```bash
pg_restore -h localhost -U weave_user -d weave_local -v weave_backup.dump
```

### Backup uniquement la structure (sans données)

```bash
pg_dump -h localhost -U weave_user -d weave_local -s > schema_only.sql
```

---

## 📈 Optimisations

### Indexes Créés

```sql
CREATE INDEX idx_tasks_circle ON tasks(circle_id);
CREATE INDEX idx_tasks_date ON tasks(date);
CREATE INDEX idx_incidents_circle ON incidents(circle_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_messages_conversation ON message(conversation_id);
CREATE INDEX idx_messages_date ON message(date_envoi);
CREATE INDEX idx_participant_user ON participant_conversation(utilisateur_id);
CREATE INDEX idx_journal_circle ON journal_entries(circle_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_circle ON audit_logs(circle_id);
```

### Recommandations

- ✅ Vaccum hebdomadaire pour nettoyer les tuples morts
- ✅ Analyze pour mettre à jour les stats du query planner
- ✅ Backups quotidiens en production
- ✅ Replication pour haute disponibilité

---

## 🐛 Troubleshooting

**Connexion refusée**

```bash
# Vérifier que PostgreSQL est en fonctionnement
sudo systemctl status postgresql

# Vérifier les credentials
psql -h localhost -U postgres
```

**Base de données n'existe pas**

```bash
# Lister les bases
psql -h localhost -U postgres -l

# Créer la base
createdb weave_local -U weave_user
```

**Migrations non appliquées**

```bash
# Vérifier les tables
psql -h localhost -U weave_user -d weave_local -c "\dt"

# Exécuter les migrations manquantes
psql -h localhost -U weave_user -d weave_local < migrations/01_initial_schema.sql
```

---

## 📊 Monitoring

### Vérifier la taille de la DB

```sql
SELECT pg_size_pretty(pg_database_size('weave_local'));
```

### Lister les tables et leurs tailles

```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname != 'pg_catalog' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Nombre de lignes par table

```sql
SELECT schemaname, tablename, n_live_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
```

---

## 🔐 Sécurité

- ✅ **Authentification** – Credentials stockés avec hashes bcryptjs
- ✅ **HTTPS en prod** – Connexions chiffrées
- ✅ **Row-level security** – Filtre par cercle_id
- ✅ **Audit logs** – Traçabilité complète
- ✅ **Backups chiffrés** – En production sur Azure

---

## 📄 Licence

MIT - Voir [../LICENSE](../LICENSE)

---

## 📞 Support

Pour toute question sur la DB :
1. Vérifier la connexion : `psql -h localhost -U weave_user -d weave_local`
2. Vérifier les migrations : `psql -c "\dt"`
3. Consulter les logs PostgreSQL
4. Ouvrir une GitHub Issue

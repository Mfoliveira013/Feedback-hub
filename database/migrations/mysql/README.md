# MySQL migrations

## Prerequisites
- MySQL 8.0.16+ (for `CHECK` constraints)
- User with privileges to create database/tables

## Apply migration
```bash
mysql -u root -p < database/migrations/mysql/001_create_schema.up.sql
```

## Rollback migration
```bash
mysql -u root -p < database/migrations/mysql/001_create_schema.down.sql
```

## Notes
- Database name used by migration: `feedback_hub`
- Charset/collation: `utf8mb4` / `utf8mb4_unicode_ci`
- Array-like fields from frontend are stored as JSON (for example `titulo_json`, `respostas_json`)
- Team management (`gestores_responsaveis`) is normalized in `user_gestores`


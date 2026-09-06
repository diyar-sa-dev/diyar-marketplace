# Database Operations Audit — Phase 28.14

## Engine

MySQL 8.x — strict mode, utf8mb4

## Indexes (28.9 — preserved)

Composite indexes on catalog, orders — **do not modify**.

## Connection management

```
max_connections ≥ PHP-FPM max_children + (queue_workers × 2) + 20
```

- No persistent connections by default (Laravel)
- Queue workers: `--max-time=3600` recycles DB connections

## Backups

Daily mysqldump — see BACKUP_RESTORE_STRATEGY.md

## Migration safety

- Forward-only in production deploy script
- Large-table alters: document online migration strategy before deploy
- Never `migrate:fresh` outside local/E2E

## Timezone / charset

- `utf8mb4_unicode_ci` for Arabic + English content
- App timezone: `Asia/Riyadh` (verify in production `.env`)

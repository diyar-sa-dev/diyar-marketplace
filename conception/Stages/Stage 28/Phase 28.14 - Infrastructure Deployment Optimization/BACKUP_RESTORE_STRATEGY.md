# Backup & Restore Strategy — Phase 28.14

## Database (MySQL)

| Setting | Recommendation |
|---------|----------------|
| Frequency | Daily full backup + binlog if available |
| Retention | 7 daily, 4 weekly |
| Encryption | At rest on backup storage |
| Restore test | Monthly on staging clone |

Procedure: see `conception/runbooks/DATABASE_BACKUP.md`

```bash
mysqldump --single-transaction --routines diyar_production | gzip > backup.sql.gz
```

## Media (storage/app/public)

| Setting | Recommendation |
|---------|----------------|
| Frequency | Daily rsync or object-storage sync |
| Scope | `storage/app/public/media/` |
| Exclusion | `storage/logs/`, `storage/framework/cache/` |

## Configuration secrets

- `.env` stored outside git in `shared/.env` on VPS
- Secrets in password manager / Hostinger env panel
- Never commit `.env`, credentials, or API keys

## Application code

- Git tags for each production release
- Release artifacts retained 3 versions on VPS

## Restore validation

1. Restore DB to staging MySQL
2. `php artisan migrate:status`
3. Run `scripts/staging/smoke.sh`
4. Spot-check order/payment records

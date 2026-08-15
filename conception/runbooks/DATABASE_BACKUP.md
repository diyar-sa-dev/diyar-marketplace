# Database Backup Strategy

> **Status:** CURRENT — Stage 1 operational foundation  
> **Last updated:** 2026-08-15

---

## Scope

This document defines the **minimum backup strategy** before production data exists. Full automation is implemented during staging/production deployment (Stage 2+).

---

## V1 Database

- **Engine:** MySQL 8
- **Name:** `diyar` (default local; override via `DB_DATABASE`)

---

## Local Development

Developers are responsible for their local database. No centralized backup required.

For quick reset:

```bash
cd backend
php artisan migrate:fresh
```

---

## Staging / Production (Future)

| Item | Approach |
|------|----------|
| Frequency | Daily full backup minimum; hourly binlog if available |
| Retention | 30 days rolling |
| Storage | Off-site object storage (separate from app server) |
| Encryption | At rest + in transit |
| Restore test | Quarterly restore drill |
| RPO target | ≤ 24 hours (adjust per SLA) |
| RTO target | ≤ 4 hours (adjust per SLA) |

---

## Backup Command (MySQL)

```bash
mysqldump -u "$DB_USERNAME" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_DATABASE" \
  > "diyar-backup-$(date +%Y%m%d-%H%M%S).sql"
```

---

## Restore Command

```bash
mysql -u "$DB_USERNAME" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_DATABASE" < backup.sql
```

---

## Related

- `conception/runbooks/STAGING.md`
- `conception/runbooks/PRODUCTION.md`

# Rollback & Disaster Recovery — Phase 28.14

## RPO / RTO targets (VPS deployment)

| Scenario | RPO | RTO |
|----------|-----|-----|
| Bad deploy (app only) | 0 | 5–15 min (symlink rollback) |
| Database corruption | 24h (daily backup) | 1–4h |
| Redis loss | N/A (rebuild from MySQL) | 15–30 min |
| Full VPS loss | 24h | 4–8h (new VPS + restore) |

## Application rollback

1. `ln -sfn releases/<previous> current`
2. Reload PHP-FPM + Nginx + workers
3. Verify health endpoints
4. **Do not** run `migrate:rollback` unless migration was backward-compatible

## Database rollback limitations

- Irreversible migrations (column drops, data transforms) require forward-fix migrations
- Always test migrations on staging clone first

## Redis recovery

- Cache: cold rebuild acceptable
- Queue: replay from `failed_jobs` table; monitor for duplicate side effects on payment jobs
- Sessions: users re-authenticate if session store lost

## VPS replacement procedure

1. Provision new VPS (MySQL 8, Redis 7, PHP 8.2+, Nginx)
2. Restore MySQL from latest backup
3. Restore `storage/app/public` media
4. Deploy latest release artifact
5. Configure Supervisor + cron
6. Update DNS

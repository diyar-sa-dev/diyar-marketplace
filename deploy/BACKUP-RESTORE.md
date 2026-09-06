# DIYAR Backup & Restore

## Automated daily backup

Production compose includes an ops profile:

```bash
docker compose -f docker-compose.production.yml --profile ops run --rm backup
```

Writes `diyar-YYYYMMDD-HHMMSS.sql` to volume `diyar_mysql_backups`. Copy off-server:

```bash
docker compose -f docker-compose.production.yml run --rm -v $(pwd)/backups:/export alpine \
  sh -c 'cp /backups/*.sql /export/ 2>/dev/null || true'
```

Retention: 14 days (configured in backup service entrypoint).

## Manual backup

```bash
docker compose -f docker-compose.production.yml exec mysql \
  mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction diyar_production \
  > diyar-manual-$(date +%Y%m%d).sql
```

## Restore drill

```bash
# 1. Stop writers
docker compose -f docker-compose.production.yml stop app queue-critical queue-default scheduler

# 2. Restore
docker compose -f docker-compose.production.yml exec -T mysql \
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" diyar_production < diyar-manual-YYYYMMDD.sql

# 3. Start and verify
docker compose -f docker-compose.production.yml start app queue-critical queue-default scheduler
curl -fsS https://api.<DOMAIN>/api/v1/health/ready
docker compose -f docker-compose.production.yml exec app php artisan tinker --execute="echo \\App\\Models\\User::count();"
```

## Verification queries

- User count stable
- Recent orders present
- Product catalog non-empty
- Payment records consistent

**Restore tested:** YES in Phase 28.17 prior session (multinode MySQL). Re-run on production compose before go-live.

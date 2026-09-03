# DIYAR Operations

## Daily checks

```bash
docker compose -f docker-compose.production.yml ps
curl -fsS https://api.<DOMAIN>/api/v1/health/ready | jq .
docker compose -f docker-compose.production.yml exec app php artisan queue:monitor redis:critical,redis:default
```

## Logs

```bash
docker compose -f docker-compose.production.yml logs -f --tail=200 nginx app queue-critical
```

Laravel logs: `storage/logs/laravel.log` (inside `app` volume). Rotate via host logrotate or Docker logging driver limits.

## Queue backlog

```bash
docker compose -f docker-compose.production.yml exec redis redis-cli -a "$REDIS_PASSWORD" LLEN diyar-production-queues:critical
docker compose -f docker-compose.production.yml exec app php artisan queue:failed
```

## Scheduler

Single `scheduler` container runs `schedule:run` every 60s. Tasks using `onOneServer()` require Redis cache lock (configured).

## Reverb

Two instances (`reverb-1`, `reverb-2`) behind Nginx `least_conn`. Scaling requires `REVERB_SCALING_ENABLED=true` and shared Redis.

Probe: `php scripts/stage2817-reverb-multinode.php --base=http://127.0.0.1:8093`

## Maintenance mode

```bash
docker compose -f docker-compose.production.yml exec app php artisan down --secret=<TOKEN>
# bypass: https://api.<DOMAIN>/<TOKEN>
docker compose -f docker-compose.production.yml exec app php artisan up
```

## Incident runbooks

| Incident | First action |
|----------|--------------|
| API 5xx | Check `nginx` + `app` logs; verify MySQL/Redis health |
| Queue backlog | Scale `queue-default` replicas or increase workers |
| Redis OOM | Check evictions; increase maxmemory or upgrade plan |
| Reverb disconnects | Verify Cloudflare WS; check `reverb-*` logs |
| Disk full | Prune Docker images; rotate logs; verify backup retention |

Detailed steps: `deploy/MONITORING.md` alert section.

## Resource profile (KVM2 target)

| Service | Budget |
|---------|--------|
| MySQL | 512M buffer pool |
| Redis | 512M maxmemory |
| PHP-FPM | 10 workers max |
| Queue | 2 containers |
| Reverb | 2 instances when WS load warrants |

Upgrade triggers: see `deploy/SCALING.md`.

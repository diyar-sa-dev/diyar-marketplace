# DIYAR Monitoring

## Health endpoints

| Endpoint | Meaning |
|----------|---------|
| `GET /api/v1/health/live` | Process alive |
| `GET /api/v1/health/ready` | DB + Redis + queue checks |
| `GET /api/v1/health` | Full platform health + maintenance flag |

Docker healthchecks: `nginx` (live), `mysql`, `redis`, `reverb-*`, `queue-*`.

## Host metrics (KVM2)

Monitor via Netdata, Prometheus node_exporter, or Hostinger panel:

- CPU %, load average
- RAM, swap
- Disk usage, I/O
- Network throughput

## Container metrics

```bash
docker stats --no-stream
docker compose -f docker-compose.production.yml ps
```

## Laravel / application

- 4xx/5xx rate at Nginx access log
- Queue latency: `redis LLEN` on queue keys
- Failed jobs: `php artisan queue:failed`
- Slow requests: PHP-FPM slowlog → stderr

## MySQL

- Connections: `SHOW STATUS LIKE 'Threads_connected'`
- Slow queries: slow query log (enable in `deploy/docker/mysql-kvm2.cnf` for tuning window)
- Deadlocks: `SHOW ENGINE INNODB STATUS`

## Redis

```bash
redis-cli -a "$REDIS_PASSWORD" INFO memory
redis-cli -a "$REDIS_PASSWORD" INFO stats
```

Watch: `used_memory`, `evicted_keys`, `blocked_clients`.

## Reverb

- Connection count via application metrics (future: Reverb Pulse)
- Nginx upstream failures in error log
- Probe script: `stage2817-reverb-multinode.php`

## Alerts (recommended thresholds)

| Signal | Warning | Critical |
|--------|---------|----------|
| CPU | >70% 15m | >85% 10m |
| RAM | >80% | >90% |
| Disk | >75% | >90% |
| 5xx rate | >1% 5m | >5% 5m |
| Queue depth | >500 | >2000 |
| Health ready | 1 failure | 3 consecutive |

**Alert pipeline wired:** NOT VERIFIED — configure PagerDuty/Slack on production host.

## Load testing scripts

- `backend/scripts/stage2817-hosting-capacity-audit.php`
- `backend/scripts/stage2817-fpm-octane-benchmark.php`
- `backend/scripts/stage2817-rate-limit-probe.php`

Do **not** use k6 (project constraint).

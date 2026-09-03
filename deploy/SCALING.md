# DIYAR Scaling

## Upgrade triggers (KVM2 → KVM4)

| Trigger | Action |
|---------|--------|
| CPU >70–80% sustained 15m | Upgrade to KVM4 or add app node |
| RAM >80% | Reduce workers or upgrade |
| Swap activity | Upgrade RAM |
| p95 API >500ms at safe concurrency | Profile DB; consider Octane or KVM4 |
| Queue backlog growth | Add queue worker replicas |
| MySQL connections >70% max | Dedicated DB or tune pool |
| Redis evictions sustained | Increase maxmemory or dedicated Redis |
| Reverb connections >500 | Enable second Reverb (already in compose) |
| Disk >75% | Expand volume; move backups off-server |

## Horizontal scaling (no business logic rewrite)

### Application nodes

- Stateless Laravel; sessions in Redis
- Shared MySQL + Redis
- Nginx LB → multiple `app` containers (Octane or FPM)
- Same `deploy/docker/production.env` secrets

### Dedicated services

1. Move MySQL to managed/dedicated host — update `DB_HOST`
2. Move Redis to dedicated — update `REDIS_HOST`
3. Scale queue workers independently
4. Scale Reverb behind Nginx upstream (already `least_conn`)

### Object storage

Configure `FILESYSTEM_DISK=s3` (S3-compatible). Upload paths already abstracted via Laravel disks.

### CDN

Cloudflare cache **public** catalog assets only. Never cache authenticated API.

### AI infrastructure (future)

```
DIYAR API → HTTP/queue → AI Gateway → GPU/CPU workers
```

Do not run inference on transactional KVM2 workers.

## Capacity model (honest)

| Metric | Measured locally | Projected KVM2 |
|--------|------------------|----------------|
| Octane categories RPS | ~350 @ c=25 | Requires VPS soak |
| FPM categories RPS | ~28 @ c=25 | Low-traffic only |
| Octane auth isolation | 120/120 pass | Verified |
| Registered users | N/A | Not a capacity metric |

Distinguish **registered users**, **DAU**, **concurrent HTTP**, **RPS**, **WS connections** in capacity planning.

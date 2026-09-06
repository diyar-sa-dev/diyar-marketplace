# Infrastructure Review

## VPS tiers (28.14 templates)

| Tier | FPM | Workers | Redis |
|------|-----|---------|-------|
| Small | fpm-pool-small | 1-2 queue | 256MB |
| Medium | fpm-pool-medium | 2-4 queue | 512MB |
| Large | fpm-pool-large | 4+ queue | 1GB+ |

## OOM risks

- PHP-FPM max_children too high for RAM — use pool templates
- Redis no maxmemory-policy — set `allkeys-lru` in prod
- MySQL connection exhaustion — FPM × workers < max_connections

## Deploy

- `scripts/deploy/deploy-release.sh` — atomic, no migrate:fresh
- `diyar:validate-php-runtime` — BCMath gate

## CI gaps

- Default PHPUnit: SQLite + array cache
- **Added:** `scripts/test-phpunit-mysql.ps1`, `scripts/test-redis-integration.ps1`
- **Recommend:** Wire both into CI pre-production

## Observability

- Request correlation ID middleware ✓
- Health + readiness endpoints ✓
- Structured log keys on payment/loyalty failures ✓
- No APM/RUM — integration point exists via correlation ID

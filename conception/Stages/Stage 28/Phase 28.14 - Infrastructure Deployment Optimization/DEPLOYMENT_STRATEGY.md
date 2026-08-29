# Deployment Strategy — Phase 28.14

## Principles

- **Forward-only migrations** — never `migrate:fresh` / `db:wipe` in production
- **Atomic releases** — symlink swap with retained previous releases
- **Zero-downtime assets** — keep N−1 release chunks for lazy-load recovery (28.12/28.13)
- **Validate before activate** — env + PHP runtime checks before symlink swap

## Release artifact contents

- `backend/` — composer vendor, cached config/routes/views
- `frontend/dist/` — hashed Vite build
- Shared (not in release): `.env`, `storage/`

## Cache warming order

1. `config:cache`
2. `route:cache`
3. `view:cache`
4. PHP-FPM reload (OPcache with `validate_timestamps=0`)

## Frontend deployment

- `index.html` → `no-cache` (Nginx)
- `/assets/*` → `immutable` 1 year
- CDN optional via `VITE_CDN_BASE_URL`

## Maintenance mode

Use platform maintenance flags (`platform.marketplace_maintenance_enabled`) before destructive ops; health endpoints remain available.

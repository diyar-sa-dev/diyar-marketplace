# DIYAR Production Architecture (Hostinger KVM2 + Vercel)

**Status:** Implemented in repo; KVM2 VPS deployment requires operator secrets and DNS.

## Topology

```
Internet → Cloudflare
    ├── app.<DOMAIN>      → Vercel (React/Vite SPA)
    ├── api.<DOMAIN>      → KVM2 Nginx :443 → PHP-FPM → Laravel
    └── realtime.<DOMAIN> → KVM2 Nginx :443 → Reverb (WebSocket /app/)

Internal Docker network (no public 3306/6379):
    mysql, redis, app, queue-*, scheduler, reverb-1, reverb-2
```

## Compose files

| File | Purpose |
|------|---------|
| `docker-compose.production.yml` | KVM2 production stack (FPM default) |
| `docker-compose.production.octane.yml` | Octane override for benchmarks / alternate runtime |
| `docker-compose.production-like.yml` | Local FPM benchmark stack (`:8092`) |
| `docker-compose.multinode.yml` | Octane multi-node + LB (`:8088`) |

## Runtime selection (measured 2026-09-03)

| Metric | FPM `:8092` | Octane `:8088` |
|--------|-------------|----------------|
| health RPS (c=50) | ~17 | ~343 |
| categories RPS (c=25) | ~28 | ~353 |
| products RPS (c=15) | ~26 | ~39 |

**Recommendation:** Octane for throughput on KVM2 **after** session isolation soak on VPS; FPM remains supported via `docker-compose.production.yml` for simpler ops at low traffic.

Evidence: `conception/Stages/Stage 28/Phase 28.17 - Enterprise Concurrency & Octane Hardening/_raw/fpm-octane-benchmark-*.json`

## Environment separation

| Env | Backend | Frontend |
|-----|---------|----------|
| local | `.env` / Sail | `localhost:5173` |
| staging | staging VPS / compose | staging Vercel |
| production | `deploy/docker/production.env` | Vercel production env |

**Never** set `DIYAR_LOADTEST_MODE=true` in production.

## Secrets

Copy `deploy/docker/production.env.example` → `deploy/docker/production.env`. Placeholders only in git.

## DNS

| Host | Target |
|------|--------|
| `app.<DOMAIN>` | Vercel |
| `api.<DOMAIN>` | KVM2 public IP (Cloudflare proxied) |
| `realtime.<DOMAIN>` | KVM2 public IP (Cloudflare proxied, WebSockets ON) |

## Scaling path

KVM2 → KVM4 → multiple `app` replicas behind LB → dedicated MySQL/Redis → horizontal Reverb → object storage (S3-compatible) → separate AI gateway/workers.

See `deploy/SCALING.md`.

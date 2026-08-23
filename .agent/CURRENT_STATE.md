# CURRENT_STATE.md

> **Last updated:** 2026-08-23  
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor commerce + services + affiliate + admin operations — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stages 0–19 | **COMPLETE** |
| Stage 20 — Security | **PARTIAL** |
| Stage 21 — E2E | **PARTIAL** (19 Playwright tests) |
| Stage 22 — Performance | **CODE COMPLETE** — 25K **NOT VERIFIED** |
| Stage 23 — Staging | **CODE COMPLETE** — remote host optional |
| Stage 24 — Production | **DOCS + CONFIG** — not live-deployed |

---

## Current Position

| Field | Value |
|-------|--------|
| **Branch** | `dev` |
| **Focus** | Stages 22–24 production readiness |
| **Infrastructure** | Redis cache/queue, health + readiness, env safety validator |

---

## Stage 22–24 Highlights

- `PlatformHealthService` — DB, cache, queue probes
- `/api/v1/readiness` + `X-Request-Id` correlation middleware
- `EnvironmentSafetyValidator` + `php artisan diyar:validate-environment`
- Staging: `docker-compose.staging.yml`, `.env.staging.example`, `staging-deploy.yml`, smoke script
- Production: Nginx example, worker docs, runbooks updated

---

## Last Validation (2026-08-23, local)

| Check | Result |
|-------|--------|
| `php artisan test` | **545/545 PASS** |
| `vendor/bin/pint --test` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm test` | **101/101 PASS** |
| `npm run build` | **PASS** (main chunk ~2.6MB) |
| k6 25K | **NOT VERIFIED** |

---

## CI/CD

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | lint, test, build, Playwright E2E |
| `staging-deploy.yml` | staging env validation + smoke |
| `performance.yml` | k6 load profiles (manual) |

---

## Known Limitations

- 25K load capacity requires staging infrastructure — not measured locally
- Live `staging.diyar.sa` / `api.diyar.com` hosts not configured in repo
- Some React Query keys outside `admin`/`marketplace` roots (legacy)

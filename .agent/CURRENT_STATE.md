# CURRENT_STATE.md

> **Last updated:** 2026-08-22  
> **Maintained by:** AI development agents after each phase completion  
> **Canonical plans:** [conception/MASTER_DEVELOPMENT_PLAN.md](../conception/MASTER_DEVELOPMENT_PLAN.md) · [conception/Stages/Stage 18/README.md](../conception/Stages/Stage%2018/README.md)

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor commerce + service marketplace + affiliate commerce + **admin operations** — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stages 0–12.5 | **COMPLETE** |
| Stage 13 — Service Marketplace (Provider) | **COMPLETE** |
| Stage 14 — Reviews audit | **COMPLETE** |
| Stage 15 — Vendor percentage coupons | **COMPLETE** |
| Stage 16 — Notifications | **COMPLETE** |
| Stage 17 — Realtime chat | **COMPLETE** |
| Stage 17.6 — Affiliate commerce | **COMPLETE** |
| **Stage 18 — Admin / Operations** | **COMPLETE / VERIFIED (automated)** |

---

## Current Position

| Field | Value |
|-------|--------|
| **Current stage** | **Stage 18 — Admin / Operations** |
| **Branch** | `dev` |
| **Last commit** | `0a16d23` — Stage 17.6: Affiliate Changes, UI design polish |
| **Working tree** | Stage 18 admin SPA, auth isolation, system settings, CI fixes (**uncommitted**) |

---

## Domain Split

| Portal | API prefix | UI route |
|--------|------------|----------|
| **Marketplace** (customer) | `/api/v1/*` | `/`, `/store/*`, `/provider/*`, etc. |
| **Vendor** (commerce) | `/api/v1/dashboard/vendor/*` | `/dashboard/vendor/*` |
| **Provider** (services) | `/api/v1/dashboard/provider/*` | `/dashboard/service/*` |
| **Marketer** (affiliate) | `/api/v1/dashboard/affiliate/*` | `/dashboard/affiliate/*` |
| **Admin** (operations) | `/api/v1/admin/*` | `/admin/*` |

**Auth guards:** marketplace `web` (Sanctum) · admin `admin` (separate session context)

---

## Stage 18 — Implemented (working tree)

### Admin foundation (18.1)
- Dual-guard auth (`web` + `admin`), `AdminPermission` RBAC, audit logging
- Admin login/session API, `EnsureAdminPermission` middleware
- React `AdminAuthProvider` hoisted in `main.tsx` with path-gated bootstrap

### Admin resources (18.2)
- Dashboard, users, vendors, providers, categories, orders, products
- Payments, refunds, coupons, reviews, finance hub, affiliate config, audit log, settings
- Detail workspaces with permission-gated mutations

### Runtime configuration (18.3)
- `SystemSetting` model + `EffectiveConfigService` + cache invalidation
- Admin settings UI + platform theme endpoint

### Production hardening (18.4)
- Flat admin nav with DIYAR branding, localized audit labels, RTL/LTR
- Auth context isolation tests (`AdminIsolationTest` — 15+ cases)
- Filament removed; ESLint/Prettier scope includes `src/admin/**`

---

## Key Backend Modules

```
backend/app/Http/Controllers/Api/V1/Admin/*     — admin REST API
backend/app/Services/Admin/*                    — admin domain services
backend/app/Services/Settings/*                 — runtime system settings
backend/app/Enums/AdminPermission.php           — granular RBAC
backend/app/Support/Identity/MarketplaceAccess.php — cross-context gate
```

## Key Frontend Areas

```
frontend/src/admin/           — React admin SPA (layouts, pages, auth, nav)
frontend/src/api/adminAuth.ts — admin session client
frontend/src/lib/auth/        — application context, query key namespaces
```

---

## Last Validation (2026-08-22, local)

| Check | Result |
|-------|--------|
| `vendor/bin/pint --test` | **PASS** |
| `php artisan test` | **504/504 PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run format:check` | **PASS** |
| `npm test` | **101/101 PASS** |
| `npm run build` | **PASS** |

---

## CI/CD

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml):
- **Frontend:** typecheck, eslint (`src/admin/**` included), prettier, vitest, build
- **Backend:** composer install, pint, phpunit

---

## Next Actions

1. Commit Stage 18 working tree (see [DAY_18_SUMMARY.md](../conception/Stages/Stage%2018/DAY_18_SUMMARY.md) for suggested message)
2. Manual browser QA: marketplace ↔ admin auth isolation matrix ([AUTH_CONTEXT_ISOLATION.md](../conception/Stages/Stage%2018/AUTH_CONTEXT_ISOLATION.md) §28)
3. Authorize V1 production deploy / hardening when explicitly requested

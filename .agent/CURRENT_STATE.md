# CURRENT_STATE.md

> **Last updated:** 2026-08-16 (Final reconciliation audit)  
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor marketplace (**Saudi Arabia**)

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stage 0 — Discovery & Architecture | **COMPLETE** |
| Stage 1 — Engineering Foundation | **COMPLETE / FINALIZED** |
| Stage 2 — Identity & Access | **COMPLETE / FINALIZED** *(committed `c46630e`)* |
| Stage 3 — User Profile & Media | **COMPLETE / FINALIZED** *(committed `255c069`)* |
| Stage 4 — Catalog & Products | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** *(uncommitted)* |
| Stage 5 — Inventory | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** *(uncommitted)* |
| **Stage 5.5 — Storefront Integration** | **IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW** *(uncommitted)* |
| Stage 6+ — Cart, Checkout, etc. | **NOT AUTHORIZED** |

---

## Current Position

| Field | Value |
|-------|--------|
| **Current Stage** | Stage 5.5 — Storefront & Vendor Data Integration |
| **Current Phase** | Reconciliation complete — await PO commit authorization |
| **Branch** | `dev` (HEAD `095c343`) |
| **Git risk** | Stage 4/5/5.5 exists on disk but is **not committed** |

---

## Last Validation (2026-08-16 — executed)

| Check | Result |
|-------|--------|
| `php artisan test` | **143 / 143 PASS** |
| `vendor/bin/pint --test` | **PASS** |
| `npm test -- --run` | **65 / 65 PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | **PASS** *(scoped paths)* |
| `npm run format:check` | **PASS** *(scoped paths)* |
| `php artisan migrate:fresh --seed` | **PASS** |
| `ServiceCategorySeederTest` | **3 / 3 PASS** |

---

## Reconciliation Audits

- [Stage 2 → 5.5 reconciliation](../conception/STAGE_2_5.5_RECONCILIATION_AUDIT.md)
- [Stage 5.5 final reconciliation](../conception/Stages/Stage%205.5%20-%20Storefront%20Integration/STAGE_5.5_FINAL_RECONCILIATION_AUDIT.md)

**Verdict:** **ACCEPTED WITH MINOR FOLLOW-UP**

---

## Stage 5.5 Highlights

- Storefront catalog flows API-driven (homepage product sections, category, store, search, product detail)
- Vendor dashboard `VendorProducts` wired to dashboard API (CRUD, inventory, images)
- Server-side filters: price, vendor, availability, sort, pagination
- `GET /api/v1/vendors` directory + search
- Profile wishlist: `GET/DELETE /profile/wishlist` + product save toggle
- Product engagement: likes, reviews on product detail
- `CatalogSeeder`: 6 vendors, scenario products (stock/preorder/discount/pagination)
- Service categories from API (10 slugs verified by test)
- **`sort=popular`** uses **likes count** (not sales analytics)

**Run after pull:**

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

---

## SMS / OTP (Production Note)

| Mode | Behavior |
|------|----------|
| **Development** | OTP logged via log SMS provider — **not real SMS** |
| **Production** | Requires MSEGAT credentials in `.env` (`MSEGAT_USERNAME`, `MSEGAT_API_KEY`, `MSEGAT_SENDER_ID`) |
| **Secrets** | Never commit `.env` or credentials |

---

## Deferred (later increments)

| Item | Notes |
|------|-------|
| Cart / checkout / orders backend | Stage 6+ |
| HTTP reservation/checkout endpoints | Service exists; no cart API |
| Service product marketplace | Categories only; no service SKUs |
| Store reviews tab | Mock on StorePage |
| Homepage marketing blocks | Testimonials, blog, style/room, brands — static UI |
| Affiliate/service dashboards | Mock state retained |
| Category subcategory chips | Decorative only (labeled in UI) |
| Stage 3 deferred items | Bio UI, 2FA, etc. (unchanged) |

---

## CI Notes

- Primary gate: `.github/workflows/ci.yml`
- ESLint/Prettier cover subset of `frontend/src/` (pages/home/dashboard excluded from lint scope; tsc/build cover all)
- `deploy-pages.yml` builds without running CI first
- `npm-publish-github-packages.yml` is stale (no root package.json)

---

## Local Setup

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
# Restart Vite — /storage proxy required in dev
```

Sample vendor slug: `diyar-furniture`

---

## Next Authorized Stage

**Stage 6+** — **NOT AUTHORIZED** without explicit Product Owner approval.

**Do not commit** unless explicitly requested. Never commit `.env`, logs, caches, or uploaded media.

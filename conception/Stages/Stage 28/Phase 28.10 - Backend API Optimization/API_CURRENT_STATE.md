# API Current State — Phase 28.10

**Date:** 2026-08-27  
**Evidence:** `_api_route_inventory.json`

---

## Route inventory comparison

| Metric | Phase 28.3 | Phase 28.10 | Delta |
|--------|------------|-------------|-------|
| Total `api/v1` routes | 480 | 480 | 0 |
| Auth required | 431 | 431 | 0 |
| Public | 49 | 49 | 0 |

**Conclusion:** No route additions/removals since 28.3 baseline commit audit.

---

## Domain distribution (unchanged)

| Domain | Routes |
|--------|--------|
| Admin | 167 |
| Profile/user | ~45 |
| Dashboard (unclassified in script) | ~151 |
| Catalog | 22 |
| Auth | 11 |
| Orders | 10 |
| Other domains | See 28.3 API_INVENTORY.md |

---

## Backend structure

| Layer | Count (approx) | Location |
|-------|----------------|----------|
| Controllers | 80+ | `backend/app/Http/Controllers/Api/V1/` |
| Services | 100+ | `backend/app/Services/` |
| FormRequests | 90+ | `backend/app/Http/Requests/` |
| JsonResources | 60+ | `backend/app/Http/Resources/` |
| Feature tests | 745 | `backend/tests/Feature/` |

---

## Key configuration

| Area | File |
|------|------|
| Rate limits | `config/diyar.php` → `rate_limits` |
| Assistant | `config/diyar.php` → `assistant` |
| Auth | Sanctum + `auth:sanctum` middleware |
| Queues | Redis (production); sync (PHPUnit) |

---

## Phase 28.9 foundation (inherited)

- OPT-DB-001..007 indexes active
- Pagination acceptable to page 100 @ 10k products on MySQL 8
- 209/209 FKs indexed

Do not duplicate database optimizations in API layer.

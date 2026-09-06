# API Performance Audit — Phase 28.10

**Date:** 2026-08-27

---

## Endpoint performance matrix (priority paths)

| Endpoint | Method | Auth | Main cost | Issue | Action |
|----------|--------|------|-----------|-------|--------|
| `POST /auth/login` | POST | Public | Validation + user lookup | Rate test stale | **FIXED** OPT-API-006 |
| `GET /products` | GET | Public | Index scan + eager loads | None at 10k | 28.9 index sufficient |
| `GET /catalog/search` | GET | Public | Facets + list duplicate filters | P3 | DEFER OPT-API-007 |
| `GET /cart` | GET | Sanctum | Items + products + user_saved | N+1 saved | **FIXED** OPT-API-003 |
| `POST /checkout/preview` | POST | Sanctum | Vendor groups + shipping quotes | Bounded | Existing query-count test |
| `POST /orders` | POST | Sanctum | Transaction + inventory | 2× product/line | **FIXED** OPT-API-001 |
| `GET /orders` | GET | Sanctum | Eager vendor orders | Clean | OrderListQueryCountTest |
| `GET /admin/analytics/overview` | GET | Admin | Multiple aggregates | 6+ order clones | **FIXED** OPT-API-002 |
| `POST /assistant/chat` | POST | Public | OpenAI HTTP 45s max | Abuse/cost | **HARDENED** OPT-API-005 |

---

## Smoke baselines

| Source | Metric |
|--------|--------|
| Phase 28.9 MySQL 8 | Product list EXPLAIN 1.4ms @ 10k |
| Phase 28.9 MySQL 8 | Admin orders 1.2ms @ 10k |
| PHPUnit SQLite | 739 tests in ~78s |
| CatalogQueryPerformanceTest | 0 per-card review N+1 |

---

## Not micro-optimized (by design)

- Admin 167 routes — permission tests, not per-route profiling
- B2B/affiliate low-traffic aggregates
- Chat — already cursor-paginated with indexes (28.9)

---

## Scale reference

Inherited from Phase 28.9 `_db_closure_verify_mysql8.json` — database layer verified @ 10k products/orders.

API layer adds query-construction fixes on top of indexed SQL.

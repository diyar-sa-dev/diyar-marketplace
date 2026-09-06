# API Optimization Strategy — Phase 28.10

**Date:** 2026-08-27

---

## Scope

Backend/API layer only:

- Controllers, services, resources, middleware, rate limits
- Query construction, serialization, validation tests
- **NOT:** Redis/cache architecture (28.11), frontend (28.12), infrastructure (28.14)

## Rules

1. **Measure before changing** — query counts, timing, regression tests
2. **No API contract breaks** — response shapes preserved (additive fields OK when internal)
3. **No database schema changes** — use Phase 28.9 indexes
4. **No business rule changes** — optimization ≠ rewrite
5. **Security never weakened** — assistant remains public-with-controls unless product decides auth

## Prioritization

| Tier | Paths |
|------|-------|
| P0/P1 | Login, catalog, cart, checkout, orders, payments, assistant |
| P2 | Admin/vendor analytics, search, notifications |
| P3 | B2B, affiliate, finance reports |

## Optimization loop

```text
EXPLAIN (28.9) → API query construction → serialization → benchmark → test
```

## Out of scope (deferred)

- Cursor pagination implementation (DB-PAG-001 trigger: >50k SKUs)
- MySQL 8 full PHPUnit CI (KI-028-030)
- CSP headers (KI-028-056 → 28.11)
- Admin B2B HTML sanitize (KI-028-055 → frontend/security)

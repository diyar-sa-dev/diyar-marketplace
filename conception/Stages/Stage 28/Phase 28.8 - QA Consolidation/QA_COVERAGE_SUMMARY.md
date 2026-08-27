# QA Coverage Summary — Stage 28

**Date:** 2026-08-27

Cross-phase evidence rollup.

---

## Automated test execution

| Layer | Tool | Result | Phase |
|-------|------|--------|-------|
| Backend unit/feature | PHPUnit | **696/696 PASS** (SQLite) | 28.1/28.3 |
| Backend MySQL 8 subset | PHPUnit | **41/41 PASS** | 28.3 |
| Backend security focus | PHPUnit | **82/85 PASS** | 28.6 |
| Chat authorization | PHPUnit | **25/25 PASS** | 28.6 |
| Frontend unit | Vitest | **124/124 PASS** | 28.4 |
| Frontend static | tsc, eslint, prettier | **PASS** | 28.4 |
| Frontend build | Vite | **PASS** (~11s) | 28.4 |
| E2E CI-parity | Playwright | **67/72 PASS** | 28.5 |
| Load HTTP | k6 @ 100 VU | **178 RPS, p95 248ms, 0% err** | 28.7 |

---

## Domain coverage (behavioral)

| Domain | API tests | E2E | Security | Perf |
|--------|-----------|-----|----------|------|
| Auth / sessions | **PASS** | **PASS** | **PASS** | Partial |
| Catalog / products | **PASS** (SQLite) | Partial | Partial | Partial* |
| Cart / checkout | **PASS** (API) | **NOT VERIFIED** E2E | Partial | NOT VERIFIED |
| Orders / payments | **PASS** | Partial (journey) | **PASS** subset | NOT VERIFIED |
| Vendor / provider | **PASS** | **PASS** | **PASS** | Partial |
| Admin | **PASS** permissions | **PASS** | Partial | Partial |
| B2B | **PASS** | **PASS** (CI-parity) | Partial | NOT VERIFIED |
| Chat / messaging | **PASS** | **PASS** | **PASS** | NOT VERIFIED |
| Analytics | **PASS** | **PASS** | Partial | Measured in-process |
| Assistant / AI | **TEST GAP** | N/A | **P2 finding** | NOT VERIFIED |
| Affiliate | Partial | Partial | Partial | NOT VERIFIED |
| Notifications | Partial | N/A | TEST GAP | NOT VERIFIED |
| Uploads | Partial | **NOT VERIFIED** | Partial | N/A |
| Blog / CMS | **PASS** | **PASS** (CI-parity) | **PASS** XSS sanitize | N/A |

\* Catalog `/products` load-test blocked in Docker Octane only (PERF-028-001).

---

## Environment coverage matrix

| Environment | DB | Redis | Used for |
|-------------|-----|-------|----------|
| PHPUnit default | SQLite | array/sync | CI backend |
| Local dev | MariaDB 10.4 | Redis | Daily dev |
| MySQL 8 Docker | 8.0.46 | Redis | Migration, API subset, load |
| E2E CI-parity | SQLite seed | array | Playwright 28.5 |
| Production target | MySQL 8 Hostinger | Redis | **NOT LIVE TESTED** |

---

## Gates passed vs partial

| Phase | Verdict |
|-------|---------|
| 28.1 Strategy | APPROVED |
| 28.2 Database | COMPLETE WITH CONDITIONS |
| 28.3 API | COMPLETE WITH CONDITIONS |
| 28.4 Frontend | COMPLETE WITH CONDITIONS |
| 28.5 E2E | COMPLETE WITH CONDITIONS |
| 28.6 Security | COMPLETE WITH CONDITIONS |
| 28.7 Performance | COMPLETE WITH CONDITIONS |
| **28.8 Consolidation** | **COMPLETE** |

---

## Largest coverage holes (for backlog)

1. Full PHPUnit on MySQL 8 (696 tests)
2. Checkout/order/payment browser E2E
3. Assistant API tests + product decision
4. Upload persistence E2E
5. Accessibility automation
6. Production Hostinger config verification
7. Long soak + production-representative load on staging VPS

# Phase 28.2 — Database Baseline

**Captured:** 2026-08-27  
**Commit:** `92638a9`

---

## PHPUnit (full suite)

**Command:** `php artisan test`  
**Environment:** SQLite `:memory:` per `phpunit.xml`

| Metric | Result |
|--------|--------|
| Total tests | **732** |
| Passed | **732** |
| Failed | **0** |
| Errors | **0** |
| Assertions | **3158** |
| Duration | **~89 s** |

**Note:** Phase 28.1 recorded 731/732 with shipping test error. Phase 28.2 re-run: **732/732 PASS**. Shipping test is **flaky** (see DATABASE_ISSUES.md KI-028-021).

---

## PHPUnit (database-focused subset)

**Command:** `php artisan test --filter="ShippingRulePrecedenceTest|PaymentConcurrencyTest|CouponConcurrencyTest|RefundIdempotencyTest|OrderNumberConcurrencyTest|InventoryTransactionAuditTest"`

| Metric | Result |
|--------|--------|
| Tests | **8** |
| Passed | **8** |
| Duration | ~1.6 s |

---

## Shipping test flakiness probe

**Command:** 5× `--filter=ShippingRulePrecedenceTest`  
**Result:** **5/5 PASS** (when Product factory omits large random dimensions)

---

## Migration lifecycle (isolated SQLite)

**Command:** `php scripts/stage28-db-migration-lifecycle.php`  
**Database:** `database/stage28_migration_test.sqlite` (deleted after run)

| Step | Status | Duration |
|------|--------|----------|
| `migrate` | PASS | 25.1 s |
| `migrate` (idempotent) | PASS | 23 ms |
| `migrate:fresh` | PASS | 25.7 s |
| `migrate:fresh --seed` | PASS | 42.5 s |

| Post-condition | Value |
|----------------|-------|
| Tables | 123 |
| Migrations ran | 93 |
| Users after seed | 8 |
| Categories after seed | 20 |
| Critical domain tables | all present |

**Overall:** **PASS**

---

## MySQL 8 validation (Docker staging)

**Command:** `php scripts/stage28-db-mysql8-validate.php`  
**Engine:** MySQL **8.0.46** @ 127.0.0.1:3307

| Step | Status |
|------|--------|
| Connect | PASS |
| `migrate:fresh` | PASS (123 tables, 93 migrations) |
| `db:seed` | PASS |
| JSON roundtrip probe | FAIL (diagnostic script — UUID PK) |

---

## MariaDB dev database (live)

**Command:** `php scripts/stage28-db-environment.php` + schema inventory

| Metric | Value |
|--------|-------|
| Engine | MariaDB 10.4.32 |
| Database | `diyar` |
| Tables (scoped) | **123** |
| Foreign keys | **209** |
| Indexes | **~350+** (per statistics) |
| Migrations applied | **93 / 93** |
| `failed_jobs` | 0 |

---

## Data integrity probes (read-only)

**Command:** `php scripts/stage28-db-integrity-check.php`

| Check | Result |
|-------|--------|
| Orphan cart_items | PASS (0) |
| Negative inventory | PASS (0) |
| Negative order totals | PASS (0) |
| Duplicate order numbers | PASS (0) |
| Payment decimal precision | decimal(12,2) confirmed |
| Pending migrations | PASS (delta 0) |
| Orphan order_items | ERROR (script used wrong FK column) |

**Overall integrity:** **PARTIAL** (script defect on order_items join; no evidence of orphan data from app tests)

---

## SQL compatibility scan

**Command:** `php scripts/stage28-db-compatibility-scan.php`

| Classification | Count |
|----------------|-------|
| Unknown / requires execution | 93 |
| Portable (mostly) | 79 |
| MySQL/MariaDB-specific | 5 |
| MySQL upsert (Laravel abstracts) | 3 |
| **Total findings** | **180** |

---

## Query performance tests (existing PHPUnit)

| Test | Result | Evidence |
|------|--------|----------|
| `CatalogQueryPerformanceTest` | PASS | 0 per-card review N+1 queries on 8 products |
| `CheckoutShippingQueryCountTest` | PASS | Query count bounded when cart 1→10 items |

---

## Health endpoints (database check)

**Environment:** local dev (MariaDB + Redis)  
**Endpoint:** `GET /api/v1/health`  
**Database check:** `{ "ok": true, "driver": "mysql" }` — **PASS** (from Phase 28.1)

Database-unavailable failure simulation: **NOT TESTED** in Phase 28.2.

---

## Baseline verdict

| Area | Status |
|------|--------|
| PHPUnit (SQLite) | **PASS** |
| Migrations (SQLite + MySQL 8) | **PASS** |
| MariaDB dev schema | **PASS** |
| Data integrity (sample) | **PARTIAL** |
| MySQL 8 full app parity | **NOT VERIFIED** |
| Failure recovery | **NOT TESTED** |

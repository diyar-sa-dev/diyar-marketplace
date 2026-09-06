# Phase 28.2 — Database Test Strategy

**Date:** 2026-08-27  
**Commit:** `92638a9`

---

## Purpose

Establish whether the DIYAR database layer is **correct, isolated, consistent, compatible, and safe** under realistic application behavior — before any optimization or schema changes.

**Testing happens before optimization.**

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Schema + migration integrity | Adding indexes |
| Referential integrity verification | Query rewrites |
| CRUD via existing PHPUnit coverage | Caching changes |
| Transaction + concurrency behavior | Engine migration (PostgreSQL) |
| MariaDB ↔ MySQL 8 compatibility | Production load testing |
| Query count baseline + N+1 detection | Redis/queue architecture |
| Environment matrix + isolation | Redesigning repositories |
| Privilege review | `migrate:fresh` on shared dev DB |

---

## Database architecture decision

```text
Production target:  MySQL 8.x  (Hostinger VPS)
Local development:  MariaDB 10.4.x  (XAMPP — accepted)
CI default tests:   SQLite :memory:
CI MySQL path:      MySQL 8.0  (messaging-integration workflow)
PostgreSQL:         REJECTED FOR CURRENT STAGE
```

Compatibility must be **explicitly tested** between MariaDB 10.4.x and MySQL 8.x — not assumed equivalent.

---

## Test levels

| Level | Method | Environment |
|-------|--------|-------------|
| Migration lifecycle | Isolated SQLite file + MySQL 8 Docker | No shared DB impact |
| Schema inventory | `information_schema` read-only | MariaDB `diyar` + MySQL 8 staging |
| CRUD / domain | Existing PHPUnit Feature tests (128 files) | SQLite `:memory:` |
| Transactions | Checkout, payment, refund, loyalty tests | SQLite |
| Concurrency | Payment, coupon, order number, refund idempotency tests | SQLite |
| Compatibility | Static SQL scan + MySQL 8 migrate/seed | Code scan + Docker MySQL 8.0.46 |
| Integrity | Orphan/negative/duplicate probes | MariaDB `diyar` (read-only) |
| Query baseline | `CatalogQueryPerformanceTest`, `CheckoutShippingQueryCountTest` | SQLite |
| Failure recovery | Health endpoint behavior | **NOT TESTED** destructively |

---

## Test environments

| Environment | Engine | Used for |
|-------------|--------|----------|
| PHPUnit default | SQLite in-memory | 732 automated backend tests |
| Local XAMPP | MariaDB 10.4.32 | Dev runtime + integrity probes |
| Docker staging | MySQL 8.0.46 | Migration + seed validation |
| CI messaging-integration | MySQL 8.0 service | Outbox/messaging path (on PR) |

---

## Test data strategy

- PHPUnit uses `RefreshDatabase` — isolated per test class on SQLite.
- Integrity probes run **read-only** against local `diyar` MariaDB.
- Migration lifecycle uses **dedicated** `stage28_migration_test.sqlite` (deleted after run).
- MySQL 8 validation uses isolated `diyar_staging` in Docker (port 3307).
- **Never** run `migrate:fresh` against unknown/shared databases.

---

## Failure classification

| Class | Action in 28.2 |
|-------|------------------|
| DATABASE DEFECT | Record → Phase 28.8 |
| APPLICATION DEFECT | Record → Phase 28.3/28.8 |
| TEST DEFECT | Record → Phase 28.5 |
| FIXTURE/SEED DEFECT | Record → Phase 28.5 |
| ENVIRONMENT DEFECT | Record → Phase 28.14 |
| OPTIMIZATION CANDIDATE | Backlog only — do not implement |

---

## Production gates (database)

Before production deploy:

1. All 93 migrations succeed on **MySQL 8.x** (verified on 8.0.46).
2. No P0/P1 database defects open.
3. Application DB user has **least privilege** (not `root` with `*.*`).
4. Dev/staging DB isolated from unrelated schemas.
5. MySQL 8 PHPUnit subset green (messaging-integration path minimum).

---

## Regression strategy

- Full PHPUnit (`php artisan test`) on every Phase 28 gate.
- Re-run `stage28-db-migration-lifecycle.php` after migration changes.
- Re-run `stage28-db-mysql8-validate.php` after migration changes.
- Compare MariaDB vs MySQL 8 behavior for any new raw SQL.

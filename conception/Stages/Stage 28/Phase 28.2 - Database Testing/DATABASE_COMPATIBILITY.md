# Phase 28.2 — MariaDB ↔ MySQL 8 Compatibility

**Date:** 2026-08-27

---

## Architecture context

```text
Local dev:     MariaDB 10.4.32  (XAMPP — accepted)
Production:    MySQL 8.x         (canonical)
PostgreSQL:    REJECTED FOR CURRENT STAGE
```

Do **not** assume MariaDB ≡ MySQL 8.

---

## Execution evidence

| Test | MariaDB 10.4.32 | MySQL 8.0.46 |
|------|-----------------|--------------|
| 93 migrations apply | PASS (dev DB) | PASS (Docker fresh) |
| Seeders | PASS (dev state) | PASS (8 users, 12 products) |
| JSON columns in migrations | Applied | Applied |
| Full PHPUnit (732 tests) | **NOT RUN on MariaDB** | **NOT RUN on MySQL 8** |
| PHPUnit on SQLite | PASS | N/A |

**MySQL 8 migration compatibility:** **PASS**  
**MySQL 8 behavioral parity with MariaDB:** **PARTIAL / NOT VERIFIED**

---

## Static SQL construct scan

**Command:** `php scripts/stage28-db-compatibility-scan.php`  
**Files scanned:** 57 with findings  
**Total constructs:** 180

| Classification | Count | Risk for MySQL 8 |
|----------------|-------|------------------|
| Portable (mostly) | 79 | Low |
| Unknown / requires execution | 93 | Medium — mostly `selectRaw` aggregates |
| MySQL/MariaDB-specific | 5 | Low between MariaDB 10.4 and MySQL 8 |
| Laravel upsert | 3 | Low — Eloquent abstracts |

### MySQL/MariaDB-specific constructs (require execution on both engines)

| File | Construct | Notes |
|------|-----------|-------|
| `AdminAnalyticsService.php` | `DATE_FORMAT`, `TIMESTAMPDIFF`, `STR_TO_DATE` | Cohort analytics — **must run on MySQL 8 before prod** |
| `AffiliateDashboardService.php` | `DATE_FORMAT` | Monthly aggregates |
| `ProviderAnalyticsService.php` | `DATE_FORMAT`, status CASE | Provider dashboard |
| Migrations | `DB::raw()` backfill | Booking schedule history |

### Laravel upsert usage (portable via query builder)

| Controller/Service | Method |
|--------------------|--------|
| `VendorShippingSettingsController` | settings upsert |
| `VendorReturnPolicyController` | policy upsert |
| `ProviderWorkPolicyController` | policy upsert |

These use Eloquent `upsert()` — Laravel generates engine-appropriate SQL.

### Search engine

| Component | Notes |
|-----------|-------|
| `MysqlCatalogSearchEngine` | Name implies MySQL — **NOT PostgreSQL compatible** |
| `SearchEngineInterface` | Abstraction exists; only MySQL impl found |

---

## JSON behavior

| Aspect | MariaDB 10.4 | MySQL 8 |
|--------|--------------|---------|
| `$table->json()` in migrations | Works | Works (validated via migrate) |
| Application JSON encode/decode | Laravel casts | Same |
| JSON functions in raw SQL | Limited use | Limited use |

**Diagnostic JSON insert probe failed** on MySQL 8 because `system_settings.id` requires explicit UUID — strict SQL mode behavior. Application uses Eloquent UUID generation — **not a runtime defect**.

---

## Known MariaDB vs MySQL differences (not fully tested)

| Feature | Status |
|---------|--------|
| `ONLY_FULL_GROUP_BY` strictness | NOT VERIFIED side-by-side |
| Default authentication plugin | NOT VERIFIED (dev uses root/staging user) |
| InnoDB locking under concurrency | Tested on SQLite only |
| Full-text search (if used) | NOT VERIFIED |
| Case sensitivity (utf8mb4_unicode_ci) | Assumed same — NOT VERIFIED |

---

## CI MySQL 8 path

`messaging-integration.yml` runs subset with:

```text
mysql:8.0 service
DB_CONNECTION=mysql
migrate + messaging/outbox tests
```

**NOT re-executed in Phase 28.2 session.**

---

## Compatibility gate

| Assessment | Result |
|------------|--------|
| MariaDB dev compatibility | **PASS** (schema + runtime) |
| MySQL 8 schema migration | **PASS** |
| MySQL 8 application parity | **NOT VERIFIED** |
| PostgreSQL | **REJECTED** |

---

## Recommended pre-production checks

1. Run full PHPUnit against MySQL 8 (Docker staging or CI job).
2. Execute analytics endpoints on MySQL 8 with seed data — verify cohort queries.
3. Run `AdminAnalyticsService` cohort report on both engines with identical seed — compare output.

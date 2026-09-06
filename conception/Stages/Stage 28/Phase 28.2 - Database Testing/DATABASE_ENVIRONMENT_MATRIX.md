# Phase 28.2 — Database Environment Matrix

**Date:** 2026-08-27  
**Method:** `SELECT VERSION();` + config inspection + Docker validation

---

## Matrix

| Environment | Engine | Version | Connection | Status | Evidence |
|-------------|--------|---------|------------|--------|----------|
| **Local XAMPP (dev)** | MariaDB | **10.4.32-MariaDB** | `mysql` → `diyar` @ 127.0.0.1:3306 | **Development — measured** | `_db_environment.json` |
| **PHPUnit / CI backend** | SQLite | 3.x (in-memory) | `DB_DATABASE=:memory:` | **Testing — measured** | `phpunit.xml` |
| **CI E2E bootstrap** | SQLite | file-based seed | bootstrap script | **Testing — configured** | `scripts/e2e/bootstrap-backend.sh` |
| **CI messaging-integration** | MySQL | **8.0** (GitHub service) | `diyar_test` @ :3306 | **Testing — configured, NOT re-run in 28.2** | `messaging-integration.yml` |
| **Docker staging** | MySQL | **8.0.46** | `diyar_staging` @ 127.0.0.1:3307 | **Measured — migrate+seed PASS** | `_db_mysql8_validate.json` |
| **Docker loadtest** | MySQL | 8.0 (compose) | compose file | **Configured — NOT run in 28.2** | `docker-compose.loadtest.yml` |
| **Staging (Hostinger)** | MySQL | 8.x (intended) | per `.env.staging.example` | **NOT AVAILABLE / NOT TESTED** | template only |
| **Production (Hostinger VPS)** | MySQL | **8.x (target)** | sync:false in `render.yaml` | **NOT AVAILABLE / NOT TESTED** | deployment docs |
| **PostgreSQL** | — | — | — | **REJECTED FOR CURRENT STAGE** | architecture decision |

---

## Version queries executed

```sql
-- Local MariaDB (2026-08-27)
SELECT VERSION();
-- Result: 10.4.32-MariaDB

SELECT DATABASE();
-- Result: diyar

-- Docker MySQL 8 staging (2026-08-27)
SELECT VERSION();
-- Result: 8.0.46
```

---

## Configuration sources

| File | DB setting |
|------|------------|
| `backend/.env` (local) | `DB_CONNECTION=mysql`, `DB_DATABASE=diyar` |
| `backend/.env.example` | MySQL 8 primary; sqlite optional |
| `backend/.env.staging.example` | `DB_CONNECTION=mysql`, `diyar_staging` |
| `backend/phpunit.xml` | `DB_CONNECTION=sqlite`, `:memory:` |
| `backend/config/database.php` | `mysql`, `mariadb`, `sqlite`, `pgsql` drivers defined |
| `render.yaml` | `DB_*` sync:false (production) |
| `docker-compose.staging.yml` | `mysql:8.0`, database `diyar_staging` |

---

## Engine parity notes

| Aspect | MariaDB 10.4.32 (local) | MySQL 8.0.46 (staging Docker) |
|--------|-------------------------|----------------------------------|
| Charset | utf8mb4 | utf8mb4 (default) |
| Collation | utf8mb4_unicode_ci | utf8mb4_unicode_ci (Laravel default) |
| Strict mode | Laravel `strict=true` | Laravel `strict=true` |
| JSON columns | Supported | Supported |
| UUID PKs | Used extensively | Migrations succeed |
| Migrations (93) | Applied on dev | Applied on fresh staging |

---

## Shared server caveat (local only)

Local MariaDB instance hosts **unrelated schemas**:

```text
cyber, cybercafe_db, hospital_stock, phpmyadmin, test, transport
```

This is an **environment isolation gap**, not an application architecture choice. See [DATABASE_SECURITY.md](./DATABASE_SECURITY.md).

---

## MySQL 8 validation summary

**Command:** `php scripts/stage28-db-mysql8-validate.php`  
**Target:** `127.0.0.1:3307` / `diyar_staging`

| Step | Result | Duration |
|------|--------|----------|
| Connect | PASS (8.0.46) | 7.7 ms |
| `migrate:fresh` | PASS (123 tables, 93 migrations) | ~316 s |
| `db:seed` | PASS (8 users, 12 products, 20 categories) | ~15 s |
| JSON column probe | FAIL (script insert missing UUID `id`) | — |

**Overall MySQL 8 migration path:** **PASS** (seed + schema). JSON probe failure is a diagnostic script issue + strict UUID PK pattern — not a migration defect.

---

## NOT VERIFIED

| Item | Reason |
|------|--------|
| Production Hostinger MySQL version | No live access |
| Staging Hostinger instance | Not deployed / not accessible |
| Full PHPUnit suite on MySQL 8 | Only migrate+seed executed in 28.2 |
| MariaDB vs MySQL 8 query result parity | Requires side-by-side test data |

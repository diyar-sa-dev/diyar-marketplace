# Phase 28.3 — API Test Strategy

**Date:** 2026-08-27

---

## Purpose

Validate the DIYAR **HTTP/API application layer** — correctness, consistency, authorization, validation, idempotency, and error contracts — as exercised by real clients.

**Testing happens before optimization.**

Phase 28.2 covered database integrity. Phase 28.3 covers APIs built on top of it.

---

## Fixed context (from prior phases)

| Decision | Value |
|----------|-------|
| Production DB | MySQL 8.x (Hostinger VPS) |
| Local dev DB | MariaDB 10.4.x (XAMPP) |
| PostgreSQL | REJECTED FOR CURRENT STAGE |
| Default PHPUnit DB | SQLite `:memory:` |

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Route inventory + coverage audit | Query/index optimization |
| Auth / authZ / IDOR via existing + targeted tests | Full penetration testing (→ 28.6) |
| Validation + HTTP/error contracts | Load testing (→ 28.7) |
| Business workflow API tests (PHPUnit Feature) | Frontend UI (→ 28.4) |
| Idempotency + concurrency API tests | Rate-limit tuning |
| MySQL 8 API subset verification | API redesign |
| Rate limit behavior measurement | Caching changes |

---

## Test sources

| Layer | Count | Environment |
|-------|-------|-------------|
| Feature tests (API/HTTP) | **696** | SQLite |
| Unit tests | **36** | SQLite |
| **Total PHPUnit** | **732** | SQLite |
| MySQL 8 API subset | **41** | MySQL 8.0.46 Docker |

**Command (Feature):** `php artisan test --testsuite=Feature`  
**Command (MySQL 8 subset):** env `DB_*` → staging + filter auth/authz/idempotency

---

## Application roles (actual)

From `App\Enums\RoleName`:

```text
customer
vendor
provider
marketer
admin
```

Admin uses separate `/api/v1/admin/*` surface. Marketer maps to affiliate flows.

---

## Authentication model

- **Marketplace:** Laravel Sanctum **stateful** SPA sessions (`auth:sanctum`, cookie + CSRF pattern in tests via `postStatefulJson`)
- **Admin:** Separate `/api/v1/admin/auth/*` session
- **Webhooks:** Unauthenticated with signature/throttle middleware

---

## Verification dimensions

For each domain: **endpoint coverage · auth · authZ · validation · error contract · idempotency · edge cases**

Failure classification: see [API_ISSUES.md](./API_ISSUES.md)

---

## Environment labeling (mandatory)

Every result must distinguish:

```text
SQLite verified     → default PHPUnit
MariaDB verified    → dev runtime only (not full API suite in 28.3)
MySQL 8 verified    → subset only (41 tests in 28.3)
NOT VERIFIED        → no evidence
```

---

## Production API gates

1. Feature suite green on SQLite (baseline regression)
2. Critical auth/authZ/idempotency tests green on **MySQL 8**
3. No open P0/P1 API defects
4. IDOR matrix gaps documented with mitigation plan
5. Rate limits documented and tested on sensitive endpoints

---

## Regression policy

Add focused regression tests only when necessary to **record** a defect — do not change business behavior to make tests pass.

Carry forward from Phase 28.2:
- KI-028-021 (shipping unit test flakiness) — **not an API defect**
- KI-028-022 (SQLite default) — partially addressed by MySQL 8 subset
- KI-028-024 — updated with 41-test MySQL 8 evidence; full 732 still NOT VERIFIED on MySQL 8

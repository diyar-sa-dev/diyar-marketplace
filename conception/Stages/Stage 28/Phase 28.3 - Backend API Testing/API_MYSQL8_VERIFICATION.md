# Phase 28.3 — MySQL 8 API Verification

**Date:** 2026-08-27  
**Updates:** KI-028-024 from Phase 28.2

---

## Objective

Execute **API-focused** backend tests against MySQL 8 — not full `migrate:fresh` repetition.

---

## Environment

| Setting | Value |
|---------|-------|
| Engine | MySQL **8.0.46** |
| Host | 127.0.0.1:3307 (Docker staging) |
| Database | `diyar_staging` |
| Schema state | Migrated + seeded (Phase 28.2) |

PHPUnit overrides via environment:

```text
DB_CONNECTION=mysql
CACHE_STORE=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
```

Note: `phpunit.xml` still defaults to SQLite when env not set.

---

## Test execution

**Command:**

```powershell
$env:DB_CONNECTION='mysql'
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='3307'
$env:DB_DATABASE='diyar_staging'
# ... (see _phpunit_mysql8_api.txt)
php artisan test --filter="AuthenticationTest|OrderAuthorizationTest|OwnershipAuthorizationTest|ProductIdorTest|PaymentConcurrencyTest|RefundIdempotencyTest|RateLimitingTest|HealthEndpointTest"
```

| Metric | Result |
|--------|--------|
| Tests | **41** |
| Passed | **41** |
| Failed | **0** |
| Assertions | **147** |
| Duration | **~317 s** |

Raw: `_phpunit_mysql8_api.txt`

---

## Coverage of MySQL 8 subset

| Area | Included |
|------|----------|
| Authentication (marketplace) | YES |
| Order authorization / IDOR | YES |
| Vendor/provider ownership | YES |
| Product vendor IDOR | YES |
| Payment idempotency/concurrency | YES |
| Refund idempotency | YES |
| Rate limiting | YES |
| Health endpoint | YES |

---

## Comparison matrix

| Suite | SQLite | MySQL 8 |
|-------|--------|---------|
| Full Feature (696) | **PASS** | **NOT RUN** |
| Full PHPUnit (732) | **PASS** | **NOT RUN** |
| API critical subset (41) | PASS (same tests) | **PASS** |

---

## KI-028-024 status update

| Before (28.2) | After (28.3) |
|---------------|--------------|
| NOT VERIFIED | **PARTIAL** — 41 API tests PASS on MySQL 8.0.46 |

Full 696 Feature tests on MySQL 8: **NOT VERIFIED** (estimated >30 min due to RefreshDatabase per class).

---

## MySQL 8 API gate

```text
PARTIAL
```

Critical auth, authZ, idempotency paths verified on MySQL 8. Full suite parity **NOT VERIFIED**.

---

## Recommendation

Add CI job or nightly: run Feature suite against MySQL 8 service (extend `messaging-integration.yml` pattern).

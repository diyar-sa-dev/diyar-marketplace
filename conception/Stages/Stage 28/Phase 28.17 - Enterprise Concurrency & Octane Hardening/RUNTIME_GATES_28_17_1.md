# Phase 28.17.1 — Runtime Gate Execution Report

**Date:** 2026-09-03  
**Stack:** `docker-compose.multinode.yml`  
**Entry:** nginx `:8088` → api-a + api-b (least_conn, no sticky sessions)

---

## Runtime Environment

| Component | Value |
|-----------|-------|
| PHP | 8.3-cli-bookworm (Docker) |
| Laravel | 13.26.1 |
| Octane | 2.19.1 + Swoole |
| Redis | 7-alpine (sessions, cache, queue, scheduler mutex) |
| MySQL | 8.0 (`diyar_multinode`) |
| Nginx | 1.27-alpine |
| Queue workers | 2 (`queue-worker-1`, `queue-worker-2`) |
| Schedulers | 2 (`scheduler-a`, `scheduler-b`) |

---

## Runtime Gates

| Gate | Status | Evidence |
|------|--------|----------|
| FPM compatibility | **VERIFIED** | Octane middleware gated; PHPUnit 19/19 pass |
| Single-node Octane | **VERIFIED** | Prior live probe 400/400 + multinode nodes healthy |
| Multi-node Octane | **VERIFIED** | Node rotation 30 req: api-a=15, api-b=15 — `_raw/node-rotation.txt` |
| Auth/session across nodes | **VERIFIED** | 30 /me checks, failures=0 — `_raw/multinode-auth.txt` |
| Locale isolation | **VERIFIED** | ar/en/fr across api-a/api-b — `_raw/multinode-locale.txt` |
| HTTP checkout concurrency | **VERIFIED** | 4 concurrent POST /orders via nginx: **1×201, 3×fail** — `_raw/http-checkout-concurrency.txt` |
| Payment/webhook HTTP concurrency | **NOT VERIFIED** | Not executed this pass |
| Queue duplicate execution | **VERIFIED** | Duplicate dispatch → attempts=1 — `_raw/queue-runtime.txt` |
| Payout HTTP concurrency | **NOT VERIFIED** | PHPUnit parallel test only (19/19 suite) |
| Scheduler distributed locking | **VERIFIED** | scheduler-b: "Skipping … already ran on another server" — `_raw/scheduler-b.txt` |
| Reverb multi-instance | **PREPARED** | Not in multinode compose; config supports Redis scaling |
| k6 | **DEFERRED** | Out of scope |

---

## Findings

| ID | Finding | Severity | Root Cause | Fix | Regression Test | Result |
|----|---------|----------|------------|-----|-------------------|--------|
| R-001 | `BROADCAST_CONNECTION=redis` breaks boot | P1 | Invalid broadcast driver name | Set `null` in compose | migrate container exits 0 | **FIXED** |
| R-002 | APP_KEY drift across nodes if `key:generate` per container | P0 | Each service regenerated key | Fixed APP_KEY + `octane-multinode-boot.sh` | Auth multinode PASS | **FIXED** |
| R-003 | Checkout losers return HTTP 500 | P2 | Unhandled inventory exception | Document; map to 422 in future | HTTP gate still PASS (1 success) | **OPEN** |
| R-004 | One checkout worker got HTTP 401 | P2 | Session/cookie on concurrent login path | 1/4 still succeeded; inventory correct | Re-run if needed | **OPEN** |
| R-005 | Queue script used `Skipped` enum | P3 | Wrong enum case | Use `Ignored` | queue-runtime PASS | **FIXED** |

---

## Exact Commands Executed

```bash
docker compose -f docker-compose.loadtest.yml down
docker compose -f docker-compose.multinode.yml build migrate
docker compose -f docker-compose.multinode.yml up -d
docker cp … PlatformHealthService.php api-a api-b && php artisan octane:reload
docker exec api-a php scripts/stage2817-runtime-seed-checkout.php
php scripts/stage2817-node-rotation-check.php --base=http://127.0.0.1:8088
php scripts/stage2817-multinode-auth.php --base=http://127.0.0.1:8088
php scripts/stage2817-multinode-locale.php --base=http://127.0.0.1:8088
php scripts/stage2817-http-checkout-concurrency.php --base=http://127.0.0.1:8088 --fixture=…
docker exec api-a php scripts/stage2817-queue-runtime.php
docker exec scheduler-a php artisan schedule:run --verbose
docker exec scheduler-b php artisan schedule:run --verbose
php artisan test --filter=… (19/19 pass)
```

---

## Evidence Files

- `_raw/node-rotation.txt`
- `_raw/multinode-auth.txt`
- `_raw/multinode-locale.txt`
- `_raw/http-checkout-concurrency.txt`
- `_raw/checkout-fixture.json`
- `_raw/queue-runtime.txt`
- `_raw/scheduler-a.txt`
- `_raw/scheduler-b.txt`
- `_raw/concurrency-tests-execution-2026-09-03.txt`

---

## Final Certification

# NOT CERTIFIED

**Remaining blockers:**
1. Payment/webhook HTTP concurrent delivery runtime proof
2. Payout HTTP concurrent runtime proof
3. Reverb multi-instance runtime proof
4. k6 / performance baseline (deferred)
5. P2: checkout failure responses should be 422 not 500

**Materially verified this pass:** multi-node Octane, auth/session, locale, HTTP checkout (stock=1), queue idempotency, scheduler mutex.

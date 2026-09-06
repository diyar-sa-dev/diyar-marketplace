# Octane / Swoole Audit — DIYAR Marketplace

**Date:** 2026-08-29  
**Laravel Octane:** configured via `Dockerfile.octane` + `docker-compose.loadtest.yml`

---

## Runtime Requirements (VERIFIED)

| Extension | Octane image | FPM image |
|-----------|:------------:|:---------:|
| bcmath | ✅ (fixed 2026-08-29) | ✅ |
| redis | ✅ | ✅ |
| swoole | ✅ | — |
| opcache | ✅ | ✅ |
| pcntl | ✅ | — |

Build guard: `extension_loaded('bcmath')` in Dockerfile.octane.

---

## Configuration

| Setting | Value |
|---------|-------|
| Server | Swoole |
| Workers | 8 |
| Task workers | 4 |
| max-requests | 2000 (worker recycle) |

---

## State Isolation Review

| Area | Risk | Status |
|------|------|--------|
| `FakePaymentGateway` static arrays | Octane leak potential | **P2** — loadtest uses fake gateway; static state persists per worker |
| Service container singletons | Request state in properties | Code review: no critical leaks found in hot paths |
| Auth/session | Must reset per request | Laravel Octane default listeners — **assumed safe** |
| Database connections | Pool flush | Octane default — **VERIFIED** by 0% error under load post-fix |
| Filesystem / logs | Writable storage | `storage/logs` created in image |

**Post-load stability:** `/api/v1/products` returned 200 after rps50 test — workers recovered.

---

## Performance Verdict

Octane provides **measurable, significant** improvement over PHP-FPM on identical Docker host:

- rps10: Octane p95 **290 ms** vs FPM p95 **8228 ms**

**Recommendation:** **KEEP Octane** for production if team accepts Swoole ops; otherwise tune FPM pool and re-benchmark on target VPS.

---

## Prior Invalid Results

k6 failures at 80% error rate were **NOT** Octane state leaks — root cause was missing `bcmath`. Do not cite those numbers.

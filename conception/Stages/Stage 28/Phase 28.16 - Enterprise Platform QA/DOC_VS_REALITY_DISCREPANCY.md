# Documentation vs Reality — Discrepancy Report

**Date:** 2026-08-29  
**Rule:** Code + executable tests + runtime measurements = truth. Documentation = claims to verify.

---

## Critical Discrepancies

| Claim (documentation) | Reality (code/tests/runtime) | Classification |
|----------------------|------------------------------|----------------|
| Playwright 72/72 E2E verified | Last fresh run Phase 28.15; CI E2E uses SQLite+sync queue, not production-like | **STALE / PARTIAL** |
| Redis production-ready | 6 integration tests exist; **not in CI**; E2E bootstrap uses `array` cache | **PARTIALLY VERIFIED** |
| Queue production-ready | Jobs tested with `Queue::fake()`; no worker-process integration | **PARTIALLY VERIFIED** |
| Reverb/WebSocket ready | Broadcast events tested with `log` driver; **zero WebSocket E2E** | **NOT VERIFIED** |
| 278 RPS / 1M req/hour | Phase 28.16 mixed k6: **50 RPS safe**, saturation ~75–100 on dev Docker | **NOT VERIFIED** |
| Homepage 19 API calls optimized | `/storefront/home` added Phase 28.16; **Playwright request count not re-measured** | **IMPLEMENTED, NOT RE-MEASURED** |
| Octane/Swoole production path | Docker loadtest exists; E2E/CI still use `artisan serve` / PHP-FPM path | **MEASURED (Docker only)** |
| Full customer checkout E2E | PHPUnit checkout tests (13); **no Playwright cart→pay journey** | **API ONLY** |
| Affiliate flows certified | 18 API tests; **no E2E** | **API ONLY** |
| Returns/refunds certified | 11 API tests; **no E2E** | **API ONLY** |
| Multi-node horizontal scaling | Documented; **never tested** | **PROJECTED** |
| 15-min soak test | Script exists (`soak.js`); **not executed in CI or latest cert** | **NOT RUN** |
| `scripts/qa/` platform certification | **Did not exist** until Phase 28.16 | **GAP (now addressed)** |

---

## Environment Discrepancies

| Layer | CI / E2E default | Production target | Gap |
|-------|------------------|-------------------|-----|
| Database | SQLite in-memory | MySQL 8 | EXPLAIN tests partial in CI |
| Cache | array (PHPUnit), redis (CI E2E) | Redis 7 | PHPUnit skips Redis behavior |
| Queue | sync | Redis + workers | No async worker tests |
| Broadcast | null / log | Reverb + Redis | No live WebSocket tests |
| API server | artisan serve | Nginx + Octane | Capacity not from serve |

---

## Test Count vs Coverage

| Metric | Count | Quality note |
|--------|------:|--------------|
| PHPUnit | ~775 | Strong API/business logic; weak live infra |
| Vitest | 128 | Utils/components; not full journeys |
| Playwright | ~72 | Smoke/journey; missing commerce E2E |
| Redis integration | 6 | Good but optional |
| k6 profiles | 10+ scripts | Only analytics in CI |

**Conclusion:** High **unit/feature** coverage; low **full-stack production-like** coverage.

---

## Actions Required (Phase 28.16)

1. Wire `scripts/qa/run-platform-certification.ps1` tiers
2. Add production-like E2E bootstrap option (Docker MySQL+Redis+Octane)
3. Implement checkout commerce E2E (highest business risk gap)
4. Implement WebSocket/Reverb test layer
5. Add Redis integration to CI
6. Re-run Playwright with evidence capture to `_raw/`
7. Mark all capacity docs with MEASURED/PROJECTED/NOT VERIFIED labels

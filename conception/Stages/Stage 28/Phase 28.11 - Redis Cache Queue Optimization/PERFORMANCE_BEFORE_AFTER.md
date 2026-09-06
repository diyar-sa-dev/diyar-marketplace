# Performance Before / After — Phase 28.11

---

## Measurement context

| Item | Status |
|------|--------|
| Live Redis on dev host | **NOT AVAILABLE** (connection refused) |
| PHPUnit cache tests | **MEASURED** — 3/3 PASS |
| Catalog + rate limit regression | **MEASURED** — 28/28 PASS |
| Frontend typecheck | **MEASURED** — PASS |
| Staging Redis benchmark re-run | **NOT VERIFIED** (requires Docker Redis + staging) |

---

## Baseline (Phase 28.7 — unchanged infrastructure)

| Scenario | VUs | RPS | p95 | Errors |
|----------|-----|-----|-----|--------|
| Steady | 100 | ~178 | ~248 ms | 0% |
| Spike | — | — | ~392 ms | 0% |
| Soak | 25 / 5min | — | ~156 ms | 0% |

Redis was **not** the limiting factor at this scale.

---

## Code-level improvements (28.11)

| Change | Expected effect | Evidence type |
|--------|-----------------|---------------|
| Catalog facet stampede lock | Fewer duplicate facet queries on cache miss | Design + unit test |
| Admin permission version bump | Eliminates full Redis flush on role change | Unit test |
| Catalog version invalidation | Fresher facets after product change | Integration path |
| Payment webhook `ShouldBeUnique` | Prevents concurrent duplicate processing | Code review + existing idempotency |
| Frontend staleTime (vendor/provider/search) | Fewer redundant HTTP requests on navigation | Static analysis |

---

## Query / Redis operation impact (estimated)

| Endpoint | Before | After |
|----------|--------|-------|
| Concurrent catalog search (cache cold) | N × facet queries | 1 × facet query + waiters |
| Admin role permission update | Full cache flush | O(1) version increment |
| Vendor store page remount | API call every mount | Cached 60s client-side |

---

## Recommended staging follow-up

1. Re-run `stage28-redis-benchmark.php` with Redis up
2. Compare catalog search p95 under 50 concurrent cold-cache requests
3. Measure queue lag during notification burst test

**Performance verdict:** PARTIAL — logic improvements implemented; live Redis benchmarks NOT VERIFIED on this host.

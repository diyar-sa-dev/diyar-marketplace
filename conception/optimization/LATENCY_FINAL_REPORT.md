# Latency Final Report — DIYAR Marketplace

**Date:** 2026-08-29

---

## Measured Endpoints (Octane, 10 RPS, 10k products)

| Endpoint | p50 | p95 | SLO (public p95 < 300 ms) |
|----------|----:|----:|:---------------------------:|
| Mixed catalog workload | 164 ms | **290 ms** | **PASS** |

---

## Saturation Behavior (Octane)

| Target RPS | Actual RPS | p95 | Notes |
|----------:|----------:|----:|-------|
| 25 | 17.3 | 5096 ms | Queue buildup, 0% errors |
| 50 | 24.0 | 8510 ms | Hard saturation on dev host |

---

## FPM Comparison (rps10 target)

| Server | p50 | p95 |
|--------|----:|----:|
| PHP-FPM | 3249 ms | 8228 ms |
| Octane | 164 ms | 290 ms |

**Dominant cost under FPM:** PHP bootstrap + worker pool contention per request.

---

## Prior Dev Server (superseded)

Sequential `artisan serve` measurements (p50 35–98 ms) remain valid for **relative** endpoint ranking but **NOT** for production capacity.

---

## Recommendations

1. Keep **Redis cache** hot for catalog (94% hit ratio measured).
2. Deploy **Octane** on VPS for read-heavy traffic.
3. Re-measure on production hardware before setting customer-facing SLOs above 10 RPS.

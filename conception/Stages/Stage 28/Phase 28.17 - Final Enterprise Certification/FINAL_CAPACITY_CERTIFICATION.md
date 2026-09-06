# Final Capacity Certification — Phase 28.17

**Classification key:** MEASURED | VERIFIED | PROJECTED | NOT VERIFIED | NOT TESTABLE

---

## Test Environment (MEASURED)

| Component | Version / config |
|-----------|------------------|
| API | Laravel Octane + Swoole, 4 workers |
| MySQL | 8.0 (compose) |
| Redis | 7-alpine |
| Host | Windows Docker Desktop |
| Dataset | `migrate:fresh --seed` base seeder |
| Tool | k6 `mixed-workload.js` via compose network |

---

## k6 Mixed Workload Results (MEASURED)

| Profile | Target RPS | Actual RPS | p95 (ms) | Errors | Threshold p95<500 |
|---------|----------:|----------:|---------:|-------:|:-----------------:|
| rps10 | 10 | 10.0 | 91 | 0% | PASS |
| rps25 | 25 | 25.0 | 118 | 0% | PASS |
| rps50 | 50 | 49.7 | 825 | 0% | **FAIL** |
| rps75 | 75 | 50.1 | 4329 | 0% | **FAIL** (saturated) |
| rps100 | 100 | 51.2 | 5281 | 0% | **FAIL** (saturated) |

Raw JSON: `_raw/2026-08-29/k6-capacity-summary.json`

---

## Operating Envelope (MEASURED — this host)

| Tier | RPS | p95 budget | Status |
|------|----:|------------|--------|
| **Safe sustained** | **≤ 25** | < 300 ms | **MEASURED PASS** |
| **Warning** | 25–50 | 300–1000 ms | Functional, elevated latency |
| **Saturation** | ~50+ | > 800 ms | Throughput plateaus ~50 RPS |
| **Failure** | N/A | — | 0% HTTP errors even at saturation |

---

## 1M Request Capacity Claims

| Claim | RPS equivalent | Status |
|-------|---------------:|--------|
| 1M / day | ~12 | **MEASURED PASS** (well within safe tier) |
| 1M / hour | **278** | **NOT VERIFIED** — host saturates ~50 RPS |
| 1M / 10 min | **1667** | **NOT VERIFIED** — not attempted (would fail) |

Previous optimization docs citing 278 RPS must be relabeled **PROJECTED** until measured on production VPS.

---

## 100k User Model (PROJECTED — requires workload assumptions)

| Assumption | Value |
|------------|-------|
| Registered users | 100,000 |
| DAU | 5% → 5,000 |
| Peak concurrent | 500 |
| Requests / user / min (peak) | 6 |
| Peak RPS (rough) | 50 |

**Conclusion:** Current **measured ~50 RPS saturation** on dev Docker aligns with a **modest peak** for 100k registered users **only if** CDN + horizontal API scaling added. Single-node dev Docker is **not** the production deployment target.

---

## Recommendations Before Production Sign-off

1. Re-run k6 on **production VPS** (8 vCPU, 16 GB+) with 8 Octane workers
2. Run rps50/rps75/rps100 after CDN static offload
3. Execute 15-min soak at safe RPS (10–25)
4. Seed 10k products and re-measure catalog p95 (28.16 optimizations)

---

## Verdict

**Capacity certification: NOT COMPLETE** for enterprise 278 RPS / 1M·hour claim.  
**Safe for:** ≤ 25 RPS sustained mixed storefront workload on measured dev stack.

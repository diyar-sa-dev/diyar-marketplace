# Final Performance Certification — Phase 28.17

## Homepage Architecture

| Item | Status |
|------|--------|
| `/storefront/home` aggregate endpoint | **IMPLEMENTED** (28.16) |
| Playwright request-count re-measure | **NOT RUN** (28.17) |
| Lighthouse LCP/INP/CLS | **NOT RUN** |

**Before (documented):** ~19 parallel API calls  
**After (code):** aggregate + client hydration — **NOT RE-MEASURED** in browser this pass

---

## API Latency (MEASURED — k6 mixed workload)

| Endpoint mix | @ 10 RPS p95 | @ 25 RPS p95 | @ 50 RPS p95 |
|--------------|-------------:|-------------:|-------------:|
| Mixed storefront | 91 ms | 118 ms | 825 ms |

Dominant contributors at saturation (inferred from Octane logs + profile):
- `GET /products` — 130–280 ms at moderate load
- Catalog search — Arabic query path
- Homepage aggregate — lower than fan-out (included in mix)

---

## Latency Budget vs Target

| Metric | Target | Measured @ 25 RPS | Pass |
|--------|-------:|------------------:|:----:|
| API p95 | < 300 ms | 118 ms | ✓ |
| API p95 @ 50 RPS | < 300 ms | 825 ms | ✗ |
| LCP | < 2.5 s | NOT RUN | — |
| INP | < 200 ms | NOT RUN | — |

---

## Frontend Build (VERIFIED)

| Asset | Size (gzip) |
|-------|------------|
| Main index | 37 kB |
| vendor-react | 61 kB |
| ar locale | 58 kB |
| Build time | 21.8 s |

---

## Before / After (28.16 → 28.17)

| Item | Before | After | Delta |
|------|--------|-------|-------|
| Docker API health | unhealthy (false negative) | **healthy** | Fixed probe |
| k6 @ 25 RPS p95 | ~86 ms (28.16 note) | **118 ms** | Within variance |
| PHPUnit count | ~775 | **784** | +9 tests |

---

## Verdict

**Performance: NOT COMPLETE** for 50+ RPS p95 target on measured stack.  
**Performance: PASS** for ≤ 25 RPS enterprise smoke tier.

See [LATENCY_FINAL_BUDGET.md](./LATENCY_FINAL_BUDGET.md).

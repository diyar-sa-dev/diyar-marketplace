# Platform Performance Certification

**Phase:** 28.16 | **Status:** Measured (partial)

## Measured (Docker Octane, 4 workers, mixed workload)

| RPS | p95 | Errors | Label |
|----:|----:|-------:|-------|
| 10 | 102ms | 0% | MEASURED |
| 25 | 86ms | 0% | MEASURED |
| 50 | 442ms | 0% | MEASURED |
| 100 | 10200ms | 0% | SATURATED |

**Safe sustained:** ~50 RPS  
**1M/day:** VERIFIED | **1M/hour:** NOT VERIFIED

## Not run

- 15/60 min soak
- 10k+ product scale re-benchmark
- Homepage LCP/INP trace
- Checkout/payment k6 profile

**Detail:** [PERFORMANCE_TEST_MATRIX.md](./PERFORMANCE_TEST_MATRIX.md)

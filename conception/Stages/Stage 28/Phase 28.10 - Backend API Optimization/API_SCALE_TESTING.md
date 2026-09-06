# API Scale Testing — Phase 28.10

**Database scale:** Inherited from Phase 28.9 MySQL 8 verification @ 10k products/orders, 150k analytics.

**API layer:** Query-construction fixes verified via PHPUnit (functional correctness).

| Layer | Evidence |
|-------|----------|
| SQL/index | `_db_closure_verify_mysql8.json` (28.9) |
| API regression | 739 PHPUnit PASS |
| Order create | OrderCreationTest @ SQLite |
| Rate limits | RateLimitingTest 4/4 |

Full HTTP load testing (RPS/p95) remains Phase 28.7/28.11 scope. No fabricated RPS numbers in this phase.

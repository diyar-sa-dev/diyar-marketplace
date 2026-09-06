# Final Test Coverage Matrix — Phase 28.17

Legend: **PASS** | **FAIL** | **N/A** | **NOT TESTABLE** | **NOT RUN**

| Feature / Layer | Unit | Integration | DB | Redis | Queue | API | Frontend | E2E | Security | Perf | Failure |
|-----------------|:----:|:-----------:|:--:|:-----:|:-----:|:---:|:--------:|:---:|:--------:|:----:|:-------:|
| Auth / Sanctum | PASS | PASS | PASS | N/A | N/A | PASS | PASS | NOT RUN | PASS | N/A | N/A |
| Catalog / Search | PASS | PASS | PASS | PASS | N/A | PASS | PASS | NOT RUN | PASS | MEASURED | N/A |
| Storefront home aggregate | PASS | PASS | PASS | PASS | N/A | PASS | PASS | NOT RUN | N/A | MEASURED | N/A |
| Cart / Checkout | PASS | PASS | PASS | N/A | N/A | PASS | PARTIAL | NOT RUN | PASS | N/A | N/A |
| Payments (fake GW) | PASS | PASS | PASS | N/A | PASS | PASS | N/A | NOT RUN | PARTIAL | N/A | N/A |
| Orders | PASS | PASS | PASS | N/A | N/A | PASS | N/A | NOT RUN | PASS | N/A | N/A |
| Vendor portal | PASS | PASS | PASS | N/A | N/A | PASS | PASS | NOT RUN | PASS | N/A | N/A |
| Provider / B2B / Affiliate | PASS | PASS | PASS | N/A | N/A | PASS | PARTIAL | NOT RUN | PASS | N/A | N/A |
| Admin | PASS | PASS | PASS | N/A | N/A | PASS | PARTIAL | NOT RUN | PASS | N/A | N/A |
| Assistant | PASS | N/A | PASS | N/A | N/A | PASS | N/A | NOT RUN | PARTIAL | N/A | N/A |
| Broadcast / Reverb | PASS | PASS | N/A | N/A | N/A | PASS | N/A | **NOT TESTABLE** | PASS | N/A | N/A |
| Notifications / FCM | PASS | PARTIAL | PASS | N/A | PASS | PASS | N/A | NOT RUN | N/A | N/A | N/A |
| Rate limits | PASS | N/A | N/A | PASS | N/A | PASS | N/A | NOT RUN | PASS | N/A | N/A |
| Octane worker isolation | PASS | PARTIAL | N/A | N/A | N/A | N/A | N/A | N/A | N/A | MEASURED | N/A |

**Totals this pass:**
- PHPUnit: **784 PASS**
- Vitest: **128 PASS**
- Playwright: **NOT RUN**
- k6: **PASS @10/25 RPS**; threshold fail @50+

**NOT TESTED is not PASS** — any blank E2E/WS cell blocks 28.17 completion.

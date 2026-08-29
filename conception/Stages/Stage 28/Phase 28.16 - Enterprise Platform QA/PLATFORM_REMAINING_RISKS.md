# Platform Remaining Risks

**Phase:** 28.16 | **Updated:** 2026-08-29

## P0 — Production blockers for full enterprise cert

| Risk | Impact | Mitigation |
|------|--------|------------|
| No checkout E2E | Revenue path UI bugs undetected | Playwright + DB assertions |
| No Reverb tests | Realtime chat/notifications fail silently | WS test harness |
| No queue worker tests | Async jobs fail in production | Docker worker integration |
| Stale E2E evidence | Regressions undetected | Certification tier re-run |
| Permission matrix gap | Auth bugs slip through | Route-derived test generator |

## P1 — High

| Risk | Mitigation |
|------|------------|
| 278 RPS claimed in old docs | Update all docs; cap at measured ~50 RPS |
| E2E SQLite vs MySQL | Docker E2E bootstrap option |
| No soak test | k6 soak15 |
| Affiliate no E2E | Marketer journey spec |

## P2 — Medium

- Multi-node Reverb
- 100k scale datasets
- Failure injection automation
- CDN cache verification

**Full register:** [KNOWN_TEST_GAPS.md](./KNOWN_TEST_GAPS.md) | [DOC_VS_REALITY_DISCREPANCY.md](./DOC_VS_REALITY_DISCREPANCY.md)

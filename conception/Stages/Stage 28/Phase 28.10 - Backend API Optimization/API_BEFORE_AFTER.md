# API Before/After — Phase 28.10

**Date:** 2026-08-27

---

## OPT-API-001 — Order creation product queries

| Metric | Before | After |
|--------|--------|-------|
| Product queries per line item | 2 (slug + findOrFail) | 0 (reuse cart map) |
| 3-item order | ~6 extra queries | 0 extra |
| Behavior | unchanged | unchanged |
| Test | OrderCreationTest | PASS |

---

## OPT-API-002 — Admin analytics overview

| Metric | Before | After |
|--------|--------|-------|
| Order aggregate queries | 4–6 clones (count, sum×2, avg) | 1 selectRaw |
| Previous period | 2 queries | 1 selectRaw |
| Behavior | unchanged KPI values | unchanged |
| Risk | Low | Low |

---

## OPT-API-003 — Cart wishlist status

| Metric | Before | After |
|--------|--------|-------|
| user_saved per cart line | 1 exists() each | 1 subquery batch |
| 10-item cart | ~10 queries | 1 subquery |
| Behavior | unchanged | unchanged |

---

## OPT-API-004 — Product image attach

| Metric | Before | After |
|--------|-------|
| Bound check queries | count() + max() | 1 selectRaw |
| Behavior | unchanged | unchanged |

---

## OPT-API-005/006 — Assistant + rate limits

| Metric | Before | After |
|--------|--------|-------|
| Assistant throttle | inline `30,1` | named `assistant-chat` |
| Assistant tests | 0 | 5 Feature tests |
| RateLimitingTest | 3 (fragile) | 4 (robust) |
| KI-028-054 | OPEN | RESOLVED |

---

## OPT-API-007 — Admin funnel event counts

| Metric | Before | After |
|--------|--------|-------|
| analytics_events SELECTs (uncached build) | 3 (one per event type) | 1 GROUP BY |
| Test | — | AdminAnalyticsFunnelQueryCountTest PASS |
| Behavior | unchanged funnel stages | unchanged |

---

## Regression

**740/747 PHPUnit PASS** (6 MySQL EXPLAIN skips, 1 unrelated AdvancedShippingTest flake)

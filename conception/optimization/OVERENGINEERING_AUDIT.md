# Over-Engineering Audit

**Date:** 2026-08-29 (enterprise re-audit)

## Classification key

| Verdict | Action |
|---------|--------|
| **KEEP** | Complexity justified |
| **SIMPLIFY** | Reduce when touched |
| **MERGE** | Combine duplicate paths |
| **REMOVE** | Delete if no measurable value |
| **DEFER** | Not worth churn now |

## Findings

| Area | Verdict | Rationale |
|------|---------|-----------|
| Repository pattern | **KEEP** (absent) | Services used directly — appropriate |
| Event chains (PaymentSucceeded) | **KEEP** | Correct fan-out for domain events |
| VersionedCache + StampedeSafeCache | **KEEP** | Prevents catalog stampede |
| Dual config (env + system_settings) | **SIMPLIFY** | Document matrix; migrate hot keys only |
| Entity-level settings (vendor/provider) | **KEEP** | Multi-tenant commerce requirement |
| Frontend lazyWithRetry | **KEEP** | CDN chunk failure recovery |
| Excessive React memo | **KEEP** (none found) | No blanket memoization |
| CustomerReviewHistoryService 717 lines | **DEFER** split | Works; split when maintenance hurts |
| Homepage section import boilerplate | **DEFER** merge | Bundle-only; not runtime |
| Payment idempotency (3 layers) | **KEEP** | Financial correctness |
| BCMath money paths | **KEEP** | Precision requirement |
| Admin permission caching | **KEEP** | UUID-scoped; avoids N+1 |
| PostgreSQL abstractions | **KEEP** (none) | MySQL-native acceptable |

## Safe simplifications completed

| Change | Why |
|--------|-----|
| Auth `/me` dedup | Removed redundant HTTP without losing correctness |
| Assistant EffectiveConfig | One read path for runtime toggle |

## Do NOT simplify

- Payment webhook hash + ShouldBeUnique + finalize guard
- Inventory reservation locks
- Chat archive batch infrastructure
- Rate limiter per-endpoint granularity


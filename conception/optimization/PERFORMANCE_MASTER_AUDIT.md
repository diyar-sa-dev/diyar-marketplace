# Performance Master Audit

**Date:** 2026-08-29  
**Re-audit of:** Phase 28.10, 28.12, 28.13 + enterprise pass

---

## Executive summary

DIYAR is **performance-ready for MVP production** on a medium VPS. Hot paths use composite indexes, versioned Redis cache, route-split frontend, and query-count regression tests. Remaining risk is **scale-shaped** (homepage fan-out, deep OFFSET at high catalog volume), not correctness-shaped.

---

## Backend latency sources (ranked)

| Rank | Source | Impact | Status |
|------|--------|--------|--------|
| 1 | Homepage 10+ parallel API calls | High TTFB on home | MONITOR |
| 2 | OpenAI assistant (45s max) | User-blocking | Bounded timeout ✓ |
| 3 | Uncached catalog search | DB CPU | Indexed + throttled |
| 4 | Admin analytics range queries | Admin slowness | OPT-API-002 fixed |
| 5 | Payment provider (checkout) | Checkout latency | Async webhook path |
| 6 | FCM push (queue) | Not user-blocking | Timeouts added ✓ |
| 7 | Deep OFFSET pagination abuse | DB CPU | Page cap added ✓ |

---

## Frontend latency sources

| Source | Status |
|--------|--------|
| Main bundle 37.19 KB gzip | PASS |
| Lazy route chunks | PASS |
| Auth `/me` dedup | FIXED |
| recharts admin-only chunk | PASS |
| Vite `/app` proxy static steal | FIXED |
| TanStack Query refetch defaults | PASS |

---

## Database performance

| Path | Index | EXPLAIN | Query count test |
|------|-------|---------|------------------|
| Product public list | status+created_at, category composite | VALIDATED (MySQL CI) | CatalogQueryPerformanceTest |
| Catalog search | Same + LIKE | VALIDATED | CatalogSearchQueryCountTest |
| Orders by user | user+created_at | VALIDATED | — |
| Admin analytics | Consolidated | FIXED 28.10 | AdminAnalyticsFunnelQueryCountTest |
| B2B public list | — | — | AdminB2bCompanyTest N+1 |

---

## Cache performance

| Cache | TTL | Invalidation | Verdict |
|-------|-----|--------------|---------|
| Catalog versioned | 300s facets | Domain version bump | KEEP |
| Search suggestions | 45s | Versioned | KEEP |
| EffectiveConfig | 3600s | SettingsChanged | KEEP |
| Admin permissions | Short | Per-admin | KEEP |
| No Cache::flush prod | — | Per-domain command | PROVEN |

---

## Queue performance

| Job type | Idempotency | Timeout | Verdict |
|----------|-------------|---------|---------|
| Payment webhook | hash + ShouldBeUnique | Yes | PROVEN |
| Notifications | State machine + lease | Yes | PROVEN |
| Chat archive | Batch | Yes | KEEP |

---

## Load test inventory

| Script | Profile | Status |
|--------|---------|--------|
| `scripts/performance/smoke.js` | 10→100 VU | CI weekly (performance.yml) |
| `scripts/performance/analytics.js` | 5→20 VU admin | CI |
| `scripts/performance/soak.js` | Long run | Manual |
| `scripts/performance/spike.js` | Burst | Manual |
| Local 500+ VU | — | NOT YET TESTED |

---

## Fixes this pass

| ID | Change | Before | After |
|----|--------|--------|-------|
| ENT-PAG-001 | `PaginationBounds` on public catalog | Unbounded page=9999 OFFSET | Capped at page 200 |
| ENT-HTTP-001 | FCM HTTP timeouts | No timeout | connect 5s, request 15s |
| ENT-HTTP-002 | OpenAI connect timeout | 45s total only | connect 10s + 45s |
| ENT-002 | Vite Reverb proxy | `/app-mockup.png` proxied | Static bypass |
| OPT-002 | Auth `/me` | Every nav | Once per session |

---

## Remaining performance work

| ID | Item | Priority |
|----|------|----------|
| OPT-004 | Homepage aggregate API | P2 at scale |
| DB-PAG-001 | Cursor pagination | P2 at 50k+ SKUs |
| PERF-RUM | Web Vitals | P3 |
| LOAD-500 | 500 VU staging benchmark | P2 before major launch |

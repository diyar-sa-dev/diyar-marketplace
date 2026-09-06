# API Issues — Phase 28.10 Register

**Date:** 2026-08-27

---

## Optimizations implemented

| ID | Domain | Finding | Change | Status |
|----|--------|---------|--------|--------|
| OPT-API-001 | Orders | 2× product query per order line | Reuse cart product map + preview slug | **DONE** |
| OPT-API-002 | Analytics | 6+ cloned order aggregates in overview | Single `selectRaw` aggregate | **DONE** |
| OPT-API-007 | Analytics | 3 funnel event count queries | Single GROUP BY on analytics_events | **DONE** |
| OPT-API-003 | Cart | N+1 `user_saved` per cart line | `withUserSaved` on cart load | **DONE** |
| OPT-API-004 | Catalog | 2 queries for image attach bounds | Single aggregate query | **DONE** |
| OPT-API-005 | Assistant | Inline throttle not configurable | Named `assistant-chat` limiter | **DONE** |
| OPT-API-006 | Security/CI | RateLimitingTest stale payloads | Fixed + loadtest env pinned | **DONE** |

---

## Carried issues — final classification

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| KI-028-030 | P2 | DEFERRED | MySQL 8 full CI — infra phase |
| KI-028-037 | P2 | **RESOLVED** | AssistantChatTest |
| KI-028-038 | P2 | RECLASSIFIED | 480 routes stable; script improvement non-blocking |
| KI-028-053 | P2 | **VERIFIED** | Public-with-safe-controls |
| KI-028-054 | P3 | **RESOLVED** | RateLimitingTest fixed |
| KI-028-057 | P3 | **RESOLVED** | AssistantChatTest |
| KI-028-055 | P3 | DEFERRED | Frontend sanitize — not 28.10 |
| KI-028-056 | P3 | DEFERRED | CSP → 28.11 |
| DB-PAG-001 | P2 | ACCEPTED | 28.9 scale trigger documented |

---

## Deferred (P3/P4)

| ID | Item | Trigger | Owner |
|----|------|---------|-------|
| OPT-API-007 | Catalog search facet query dedup | p95 search >200ms | 28.11 |
| OPT-API-008 | Admin funnel 7-count → aggregate | Admin dashboard p95 >500ms | Future |
| OPT-API-009 | ProductCard is_own_store batch | Vendor list p95 regression | Future |
| OPT-API-010 | Cursor pagination | Catalog >50k SKUs | 28.11+ |

---

## Severity summary

| Level | Blocking |
|-------|----------|
| P0 | 0 |
| P1 | 0 |
| P2 blocking | 0 |

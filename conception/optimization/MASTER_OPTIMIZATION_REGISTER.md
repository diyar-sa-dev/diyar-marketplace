# Master Optimization Register — Single Source of Truth

**Date:** 2026-08-29  
**Audit:** Enterprise scalability / performance / security deep re-audit  
**Baseline:** `dev` @ `badbb6e` + uncommitted Stage 28 + optimization fixes  
**Evidence:** `conception/optimization/_raw/enterprise-audit-2026-08-29.txt`

---

## Status legend

| Status | Meaning |
|--------|---------|
| **FIXED** | Implemented and regression-tested |
| **PASS** | Verified correct; no action |
| **MONITOR** | Acceptable now; trigger defined |
| **ACCEPTED** | Known limitation; documented trade-off |
| **DEFER** | Justified future work |
| **OPEN** | Not yet addressed |
| **PARTIAL** | Started; incomplete |

---

## P0 — Catastrophic / security / data-loss

| ID | Finding | Status | Evidence |
|----|---------|--------|----------|
| — | No open P0 at audit time | **PASS** | PHPUnit 774/774, E2E 72/72, payment idempotency verified |

---

## P1 — Major scalability / reliability / security blockers

| ID | Domain | Finding | Status | Remediation |
|----|--------|---------|--------|-------------|
| ENT-001 | TEST | VendorOrderQueryFilterTest brittle SQL quote assertion | **FIXED** | Assert backtick SQL + binding `accepted` |
| ENT-002 | FRONTEND | Vite `/app` proxy steals `/app-mockup.png` | **FIXED** | `reverbProxyOptions` bypass |
| ENT-PAG-001 | SECURITY/PERF | Deep page OFFSET abuse on catalog | **FIXED** | PaginationBounds max page 200 |
| ENT-HTTP-001 | RELIABILITY | FCM HTTP no timeout | **FIXED** | connect 5s, timeout 15s |
| ENT-HTTP-002 | RELIABILITY | OpenAI no connect timeout | **FIXED** | connectTimeout 10s |
| ENT-CI-001 | INFRA | MySQL EXPLAIN not in CI | **FIXED** | backend-mysql CI job |
| KI-028-061 | TEST | Loyalty EffectiveConfig cache in PHPUnit | **FIXED** | TestCase `forceTestingEnvironment` (28.15) |
| KI-028-055 | SECURITY | B2B about XSS in admin preview | **FIXED** | `sanitizeHtml()` (28.15) |

---

## P2 — Important production optimization

| ID | Domain | Finding | Status | Remediation |
|----|--------|---------|--------|-------------|
| OPT-002 | LATENCY | Auth `/me` on every navigation | **FIXED** | Bootstrap once in AuthContext |
| OPT-003 | ARCHITECTURE | Assistant admin toggle ignored | **FIXED** | EffectiveConfig in AssistantChatService |
| OPT-004 | LATENCY | Homepage 10+ parallel catalog API calls | **MONITOR** | Aggregate endpoint when >10k SKUs or p95 >200ms |
| OPT-006 | DATABASE | DB-PAG-001 deep OFFSET catalog | **ACCEPTED** | Cursor pagination at >50k SKUs |
| OPT-009 | SECURITY | Public `/assistant/chat` 30/min per IP | **CONDITIONAL** | Rate limit + payload caps + admin toggle; auth optional |
| OPT-013 | INFRA | PHPUnit default SQLite | **PARTIAL** | `scripts/test-phpunit-mysql.ps1`; wire CI |
| KI-028-053 | SECURITY | Assistant cost abuse surface | **CONDITIONAL** | 30/min, max 20 msgs × 4k chars, 45s timeout, disable toggle |

---

## P3 — Useful improvement / technical debt

| ID | Domain | Finding | Status |
|----|--------|---------|--------|
| OPT-001 | ARCHITECTURE | CustomerReviewHistoryService 717 lines | **DEFER** |
| OPT-005 | LATENCY | ServicesSection category waterfall | **DEFER** |
| OPT-007 | DATABASE | Category tree unbounded read | **MONITOR** |
| OPT-008 | CACHE | ~100+ `config('diyar.*')` bypass EffectiveConfig | **OPEN** |
| OPT-012 | FRONTEND | Home section import boilerplate | **DEFER** |
| OPT-014 | INFRA | Redis integration not in default CI | **PARTIAL** |
| OPT-017 | OVERENGINEERING | Dual config paths | **OPEN** (documented) |
| OPT-018 | SECURITY | No CSP header | **DEFER** (nginx deploy) |
| OPT-019 | OBSERVABILITY | No Web Vitals / RUM | **DEFER** |
| KI-028-056 | SECURITY | CSP at nginx | **DEFER** |
| REAUD-015-003 | TEST | Redis live integration | **NOT YET TESTED** (Docker offline) |

---

## Completed optimizations (Phase 28 + this audit)

| Phase | Item | Verification |
|-------|------|--------------|
| 28.9 | Catalog/order composite indexes | MySQL EXPLAIN 6/6 |
| 28.10 | Admin analytics query consolidation | Code + tests |
| 28.11 | Versioned cache + stampede protection | Unit tests |
| 28.12 | Route splitting, main JS 37.15 KB gzip | Build |
| 28.13 | HTTP cache policy, CDN-ready assets | HttpCachePolicyTest |
| 28.14 | FPM/OPcache/Supervisor templates | Deploy examples |
| 28.15 | Loyalty test env, B2B XSS, E2E re-audit | 72/72 Playwright |
| ENT | Auth dedup, assistant EffectiveConfig, vite proxy, test fix | This audit |

---

## Rejected optimizations (do not implement without evidence)

| Proposal | Reason |
|----------|--------|
| Microservices / Kafka / K8s | Monolith scales to 100k with vertical + horizontal app nodes |
| Database sharding | No table >1M rows projected at 100k users |
| PostgreSQL migration | MySQL 8 sufficient; no blocking feature gap |
| Remove VersionedCache | Prevents catalog stampede; measured value |
| Remove payment idempotency layers | Financial correctness requirement |
| Blanket repository pattern | Would add complexity without benefit |

---

## Cross-reference

| Document | Purpose |
|----------|---------|
| [SCALABILITY_MODEL.md](./SCALABILITY_MODEL.md) | 100k-user capacity math |
| [CAPACITY_PLAN.md](./CAPACITY_PLAN.md) | 10k→100k stage gates |
| [PERFORMANCE_ARCHITECTURE.md](./PERFORMANCE_ARCHITECTURE.md) | Latency budgets |
| [SECURITY_HARDENING_AUDIT.md](./SECURITY_HARDENING_AUDIT.md) | OWASP findings |
| [PRODUCTION_FAILURE_MODES.md](./PRODUCTION_FAILURE_MODES.md) | Failure scenarios |
| [OVERENGINEERING_AUDIT.md](./OVERENGINEERING_AUDIT.md) | Simplify/keep matrix |
| [TECHNICAL_DEBT_REGISTER.md](./TECHNICAL_DEBT_REGISTER.md) | Remaining debt |

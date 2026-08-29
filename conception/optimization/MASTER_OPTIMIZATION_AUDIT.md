# Master Optimization Audit — DIYAR Marketplace

**Date:** 2026-08-29  
**Baseline:** `dev` @ `badbb6e` (+ uncommitted Stage 28 hardening)  
**Stack:** Laravel 13 / PHP 8.3+ / MySQL 8 / Redis 7 / React 19 / Vite

---

## Executive verdict

DIYAR is a **well-hardened modular monolith** suitable for initial production on a medium VPS. Phase 28 work addressed security, delivery, infra, and test gaps. **Remaining risk is scale-shaped, not correctness-shaped** for current catalog/order volumes.

**Architecture grade:** B+ (simple monolith, some god services, config dual-path)  
**Production readiness:** **YES** (repository level) with documented scale triggers

---

## Master optimization table

| ID | Domain | Finding | Evidence | Current cost | Future cost | Sev | Rec | Status |
|----|--------|---------|----------|--------------|-------------|-----|-----|--------|
| OPT-001 | ARCHITECTURE | `CustomerReviewHistoryService` 717 lines — god service | Line count audit | Maintainability | Hard to test/extend | P3 | Split by review type at 100k+ reviews | OPEN |
| OPT-002 | LATENCY | Auth `/me` on every route change | AuthContext L170–178 (fixed) | 1 HTTP/nav | Multiplied at scale | P2 | Bootstrap once + admin transition | **FIXED** |
| OPT-003 | ARCHITECTURE | Assistant admin toggle ignored runtime | AssistantChatService used `config()` only | Admin disable ineffective | Cost/abuse if misconfigured | P2 | Wire EffectiveConfig | **FIXED** |
| OPT-004 | LATENCY | Homepage 10+ parallel product queries | Section components | OK now | DB/API at 100k SKUs | P2 | Homepage aggregate API at scale | MONITOR |
| OPT-005 | LATENCY | ServicesSection category→services waterfall | ServicesSection.tsx | +1 RTT/section | Worse on 3G | P3 | Batch services-by-category API | DEFER |
| OPT-006 | DATABASE | DB-PAG-001 deep OFFSET catalog | 28.9 EXPLAIN | OK <50k SKUs | Slow page 50+ | P2 | Cursor pagination trigger | ACCEPTED |
| OPT-007 | DATABASE | Category tree unbounded public read | CategoryService | Low row count | Medium if 1000+ cats | P3 | Cache tree + TTL | MONITOR |
| OPT-008 | CACHE | ~100+ direct `config('diyar.*')` bypass EffectiveConfig | Grep audit | Admin overrides ignored | Ops confusion | P3 | Migrate hot keys only | OPEN |
| OPT-009 | SECURITY | Public `/assistant/chat` 30/min | KI-028-053 | Product decision | OpenAI cost abuse | P2 | Auth OR accept + monitor | CONDITIONAL |
| OPT-010 | FRONTEND | Main JS 37.15 KB gzip | 28.12/13 build | **Met target** | — | — | None | PASS |
| OPT-011 | FRONTEND | recharts 377 KB chunk | dist vendor-recharts | Admin-only load | Slow admin first paint | P3 | Already route-split; verify lazy | PASS |
| OPT-012 | FRONTEND | Home section import boilerplate bloat | ~17 sections duplicate imports | +50KB chunk | Bundle waste | P3 | Shared section shell | DEFER |
| OPT-013 | INFRA | PHPUnit default SQLite | phpunit.xml | Fast CI | Engine parity gap | P2 | MySQL CI script added | **PARTIAL** |
| OPT-014 | INFRA | Redis integration not in default CI | KI-028-002 | Tests skip | Prod Redis untested in CI | P3 | `scripts/test-redis-integration.ps1` | **PARTIAL** |
| OPT-015 | QUEUE | Payment webhook idempotency | PaymentWebhookProcessor + ShouldBeUnique | Correct | — | — | None | PASS |
| OPT-016 | CACHE | No production Cache::flush | InvalidateDiyarCacheCommand | Safe invalidation | — | — | None | PASS |
| OPT-017 | OVERENGINEERING | Dual config: env + system_settings + entity settings | Multiple services | Complexity | Ops errors | P3 | Document ownership matrix | OPEN |
| OPT-018 | UNDERENGINEERING | No CSP header | KI-028-056 | XSS depth | Medium | P3 | Nginx CSP at deploy | DEFER |
| OPT-019 | OBSERVABILITY | No Web Vitals / RUM | PERF-028-007 | Blind to LCP/INP | UX regressions | P3 | Lighthouse CI optional | DEFER |
| OPT-020 | TEST | Vitest act() warnings | AuthContext tests | Noise only | — | P4 | Hygiene | OPEN |

---

## Contradictions: documentation vs code

| Doc claim | Code reality | Resolution |
|-----------|--------------|------------|
| KI-028-037 "No assistant Feature test" | `AssistantChatTest.php` exists (6 tests) | **Update register — RESOLVED** |
| KI-028-061 loyalty config fails | Fixed in 28.15 TestCase guard | **RESOLVED** |
| KI-028-055 B2B XSS open | sanitizeHtml applied | **RESOLVED** |
| KI-028-050 ad z-300 blocks sidebar | Ad now z-40; E2E fixed | **Largely resolved** |
| OPT-API-002 fixed in 28.10 | AdminAnalyticsService selectRaw | **Verified in code** |
| Assistant admin toggle works | Was env-only until OPT-003 fix | **FIXED this audit** |

---

## Fixes implemented (this audit)

1. **OPT-002** — `AuthContext.tsx`: bootstrap `/me` once per marketplace session, re-fetch only after leaving admin
2. **OPT-003** — `AssistantChatService`: `platform.assistant_enabled` via EffectiveConfigService + test
3. **OPT-013/014** — `scripts/test-phpunit-mysql.ps1`, `scripts/test-redis-integration.ps1`

---

## Performance budgets (practical targets)

| Layer | Target | Current (evidence) |
|-------|--------|-------------------|
| Main entry JS gzip | <40 KB | **37.15 KB** ✓ |
| API catalog p95 (warm) | <200 ms | Not measured live; indexes verified |
| API checkout p95 | <500 ms | BCMath + transactions; E2E pass |
| Admin analytics p95 | <800 ms | OPT-API-002 consolidated |
| MySQL list query | index range scan | EXPLAIN PASS on products |
| Playwright E2E | 72/72 | Fresh run 2026-08-29 |

---

## Recommended roadmap

```text
NOW (done/partial)
  ✓ Auth refresh dedup
  ✓ Assistant EffectiveConfig
  ✓ MySQL/Redis test scripts

BEFORE PRODUCTION
  □ Run scripts/test-phpunit-mysql.ps1 in CI
  □ Run scripts/test-redis-integration.ps1 on staging
  □ KI-028-053 product decision (public assistant vs auth)
  □ Hostinger bcmath + OPcache verify

AFTER LAUNCH (monitor)
  □ Homepage API fan-out if catalog >10k SKUs
  □ DB-PAG-001 cursor if page-50 latency >100ms p95

AT 100K USERS
  □ Read replicas or analytics DB split
  □ Queue worker scaling (Supervisor count)
  □ CDN mandatory for static assets

AT 1M+ RECORDS
  □ Cursor pagination on orders/messages/notifications
  □ Analytics aggregation tables / rollups
  □ Consider PostgreSQL evaluation (not required now)
```

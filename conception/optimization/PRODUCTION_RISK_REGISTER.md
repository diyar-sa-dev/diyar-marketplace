# Production Risk Register

**Date:** 2026-08-29  
**Single gap/risk/debt inventory for production scale pass**

---

## Classification key

Types: CURRENT BUG | PERFORMANCE | SECURITY | SCALABILITY | RELIABILITY | CONFIG GAP | FUTURE SCALE | TECH DEBT | OVER-ENGINEERING | UNDER-ENGINEERING | DOS EXPOSURE | DEPLOYMENT

Timing: NOW | BEFORE PRODUCTION | AT 10K USERS | AT 100K USERS | AT 1M REQUESTS | HIGHER SCALE

---

## P0 — None open

| ID | Type | Finding | Timing | Status |
|----|------|---------|--------|--------|
| — | — | No open P0 at audit | — | PASS |

---

## P1 — None open

| ID | Type | Finding | Timing | Status |
|----|------|---------|--------|--------|
| — | — | No open P1 at audit | — | PASS |

---

## P2 — Important (open or conditional)

| ID | Type | Finding | Timing | Status | Action |
|----|------|---------|--------|--------|--------|
| PR-001 | DOS EXPOSURE | Public assistant OpenAI cost | NOW | CONDITIONAL | 30/min + caps + toggle; auth if abused |
| PR-002 | PERFORMANCE | Homepage API fan-out | AT 10K | MONITOR | Aggregate endpoint |
| PR-003 | SCALABILITY | Deep OFFSET at high catalog | AT 100K | PARTIAL | Page cap ✓; cursor at 50k SKUs |
| PR-004 | CONFIG GAP | CSP/HSTS at nginx | BEFORE PROD | OPEN | Deploy nginx template |
| PR-005 | RELIABILITY | Redis not live-tested locally | BEFORE PROD | OPEN | Docker + integration script |
| PR-006 | DEPLOYMENT | No WAF/DDoS upstream | AT 1M REQUESTS | ACCEPTED | Cloudflare documented |
| PR-007 | OBSERVABILITY | No live P95/RUM | BEFORE PROD | OPEN | k6 staging + optional RUM |

---

## P2 — Fixed this pass

| ID | Type | Finding | Fix |
|----|------|---------|-----|
| PR-F01 | PERFORMANCE | Deep page OFFSET abuse | PaginationBounds max page 200 |
| PR-F02 | RELIABILITY | FCM HTTP hang risk | connectTimeout + timeout |
| PR-F03 | RELIABILITY | OpenAI connect hang | connectTimeout 10s |
| PR-F04 | CONFIG GAP | MySQL index tests not in CI | backend-mysql CI job |
| PR-F05 | FRONTEND | Vite proxy static steal | reverbProxyOptions bypass |
| PR-F06 | PERFORMANCE | Auth /me spam | AuthContext dedup |

---

## P3 — Future / debt

| ID | Type | Finding | Timing |
|----|------|---------|--------|
| PR-101 | TECH DEBT | CustomerReviewHistoryService 717 lines | HIGHER SCALE |
| PR-102 | OVER-ENGINEERING | Dual config paths | NOW |
| PR-103 | PERFORMANCE | ServicesSection waterfall | AT 10K |
| PR-104 | UNDER-ENGINEERING | No Web Vitals | BEFORE PROD |
| PR-105 | TECH DEBT | Vitest act() warnings | NOW |

---

## P4 — Optional

| ID | Type | Finding |
|----|------|---------|
| PR-201 | TECH DEBT | Home section import boilerplate |
| PR-202 | PERFORMANCE | Category tree cache at 1000+ cats |

---

## Over-engineering register

| Item | Verdict |
|------|---------|
| VersionedCache + StampedeSafe | KEEP |
| Payment 3-layer idempotency | KEEP |
| Repository pattern | NOT PRESENT (good) |
| Microservices | REJECTED |
| Sharding | REJECTED premature |

---

## Under-engineering register

| Item | Verdict | Status |
|------|---------|--------|
| Rate limits on hot endpoints | Required | PROVEN |
| Pagination bounds | Required | FIXED |
| HTTP timeouts on external APIs | Required | FIXED |
| Health/ready endpoints | Required | PROVEN |
| Request correlation ID | Required | PROVEN |
| MySQL composite indexes | Required | VALIDATED |

---

## Duplicate consolidation

Merged from MASTER_OPTIMIZATION_REGISTER, MASTER_OPTIMIZATION_AUDIT, TECHNICAL_DEBT_REGISTER, and Stage 28 issue registers. Canonical tracker: **this file** for risks; **MASTER_OPTIMIZATION_REGISTER.md** for optimization IDs.

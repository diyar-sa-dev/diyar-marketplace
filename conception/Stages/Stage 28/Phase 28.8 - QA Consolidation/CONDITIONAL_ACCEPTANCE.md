# Conditional Acceptance — Stage 28

**Date:** 2026-08-27

Findings **accepted as known risk** for release if blockers in [PRODUCTION_BLOCKERS.md](./PRODUCTION_BLOCKERS.md) are addressed.

---

## Accepted test & environment gaps

| Finding | Why acceptable | Risk | Mitigation | Revisit |
|---------|----------------|------|------------|---------|
| **KI-028-030** Full suite not on MySQL 8 | 696/696 SQLite PASS; 41 critical MySQL 8 PASS; migrate+seed PASS | Engine-specific edge case | MySQL 8 CI job post-launch | Before next major release |
| **KI-028-002/022** PHPUnit no Redis | Redis verified separately (28.1 REDIS_VERIFICATION) | Redis regression in default CI | Dedicated Redis job optional | 28.11 |
| **KI-028-020/023/005** Local XAMPP superuser | Local dev only | Dev machine compromise | Scoped dev user 28.14 | Dev hygiene |
| **PERF-028-001** Docker Octane bcmath | Production = PHP-FPM, not this image | Load-test invalid for `/products` | OPT-INFRA-002 for Docker; verify prod PHP | 28.9 |
| **PERF-028-002** MySQL volume cred drift | Documented workaround | Load-test friction | OPT-INFRA-001 | 28.9 |
| **PERF-028-006** 5 min soak not 60 min | Time budget | Unknown long-run drift | Staging 60 min soak | Pre-scale |
| **KI-028-007** 25K VU not verified | Staging infra required | Unknown upper capacity | 100 VU measured | Before marketing scale claims |
| **KI-028-047** A11y not verified | No WCAG requirement documented | Accessibility gaps | Lighthouse/axe post-launch | 28.14 |
| **KI-028-045** Partial responsive | 29/29 public smoke pass | Dashboard/checkout untested widths | Expand matrix | 28.10 |
| **KI-028-046/052** Upload E2E partial | API upload security partially tested 28.6 | UI persistence unproven | Upload E2E hardening | 28.9 |
| **KI-028-054** Rate limit CI gap | No bypass evidence | Limits may regress undetected | Fix RateLimitingTest | 28.9 |
| **KI-028-056** No CSP | Defense-in-depth gap | XSS impact amplified | CSP at nginx | 28.11 |
| **KI-028-042** No admin 404 | Redirect to dashboard | Confusing invalid URLs | Product backlog | Low |
| **KI-028-044** No French | Product scope ar/en | N/A for current launch | Product decision | If i18n expands |

---

## Accepted product / UX limitations

| Finding | Why acceptable | Risk | Mitigation | Revisit |
|---------|----------------|------|------------|---------|
| **KI-028-050** Ad popup blocks sidebar | Timing-dependent; CI E2E mostly passes | Users wait or dismiss ad | Fix z-index 28.9+ | UX sprint |
| **KI-028-018/OPT-FE-001** 499 KB JS | No SLA; app functional | Slower cold load on mobile | OPT-FE-001 | 28.10+ |
| **OPT-DB-001** Products scan @ 500 rows | p95 still low at medium tier | Latency at 10k+ products | Index in 28.9 after large seed | Scale testing |

---

## Accepted security partial coverage

| Finding | Why acceptable | Risk | Mitigation | Revisit |
|---------|----------------|------|------------|---------|
| **KI-028-031/058** Notification IDOR incomplete | Existing tests pass; no exploit found | Unknown cross-user read | Extend matrix | 28.9 |
| **KI-028-034** Admin per-route gaps | Permission model tested | Unusual route gap | Spot audit | 28.6 follow-up |
| **KI-028-059** Local .env secrets | Not in git | Local machine risk | Prod secrets separate | Deploy |
| Production Hostinger DEBUG/CSP/cookies | **NOT VERIFIED** in Stage 28 | Misconfiguration | Pre-deploy checklist | Deploy gate |

---

## Accepted performance limitations

| Finding | Why acceptable | Risk | Mitigation | Revisit |
|---------|----------------|------|------------|---------|
| Local Docker load only | Documented | Not Hostinger capacity | Staging benchmark | Pre-launch marketing |
| No checkout/cart load test | bcmath + scope | Unknown checkout peak | After OPT-INFRA-002 + auth k6 | 28.10 |
| Admin analytics 438 ms @ 500 products | Acceptable admin UX | Slower at scale | OPT-API-002 | 28.10 |

---

## Sign-off template

```text
Conditional acceptance requires:
[ ] BLOCK-001 assistant decision documented
[ ] BLOCK-002 bcmath verified on Hostinger
[ ] BLOCK-003 MySQL 8 parity decision documented
[ ] Production env checklist (DEBUG=false, HTTPS cookies, secrets)
```

---

## Certification

Nothing in this list was silently ignored. Each item has explicit risk and revisit phase.

# Production Blockers — Stage 28

**Date:** 2026-08-27

Items that **must be resolved, verified, or explicitly signed off** before Hostinger production deployment.

---

## Confirmed P0/P1 application defects

**None.** No reproducible P0/P1 defect blocks commerce, auth, or payments on tested paths.

---

## Release blockers & mandatory decisions

### BLOCK-001 — KI-028-053 Public assistant endpoint

| Field | Value |
|-------|-------|
| **ID** | KI-028-053 |
| **Severity** | P2 |
| **Problem** | `POST /api/v1/assistant/chat` is public; 30 req/min throttle only; OpenAI cost/abuse surface |
| **Evidence** | `routes/api.php`; `AssistantChatRequest::authorize() === true`; Phase 28.6 |
| **Environment** | All (API) |
| **Production impact** | Cost abuse, unattributed usage, prompt injection |
| **Required action** | **Product decision:** (A) require auth, (B) stricter limits + CAPTCHA, or (C) explicit accept with monitoring/budget caps |
| **Owner** | Product + Backend |
| **Can accept?** | Yes, with written risk acceptance + OpenAI budget alerts |

---

### BLOCK-002 — Pre-deploy PHP extension verification (bcmath)

| Field | Value |
|-------|-------|
| **ID** | PERF-028-001 / OPT-INFRA-002 |
| **Severity** | P2 (conditional P1 if missing on prod) |
| **Problem** | `LoyaltyRuleService` uses `bcadd()`; missing in **Docker Octane** load-test image |
| **Evidence** | Docker logs HTTP 500 on `/products`; `Dockerfile.octane` lacks bcmath |
| **Production architecture** | **PHP-FPM + Nginx** on Hostinger — **not** Octane Docker |
| **Production impact** | **If Hostinger PHP lacks bcmath:** catalog listing breaks (same as Docker) |
| **Required action** | **Verify `php -m \| grep bcmath` on Hostinger before deploy** — enable if missing |
| **Owner** | DevOps / Release |
| **Can accept?** | N/A — verification step, not optional if extension absent |

**28.8 classification:** **Deployment verification blocker**, not confirmed production defect. Load-test Docker gap alone is **not** a production blocker.

---

### BLOCK-003 — KI-028-030 MySQL 8 engine parity confidence

| Field | Value |
|-------|-------|
| **ID** | KI-028-030 |
| **Severity** | P2 |
| **Problem** | Full 696 Feature tests run on SQLite only; 41 critical tests PASS on MySQL 8 |
| **Evidence** | `_phpunit_api_feature.txt`; `_phpunit_mysql8_api.txt` |
| **Production impact** | Unknown engine-specific SQL/constraint failures |
| **Required action** | Add MySQL 8 CI job **OR** explicit sign-off accepting SQLite parity risk |
| **Owner** | QA / Backend |
| **Can accept?** | **Yes, conditionally** — migration+seed PASS; critical subset PASS; MariaDB dev accepted |

---

## Strong recommendations (not automatic blockers)

### REC-001 — KI-028-055 Admin B2B stored XSS surface

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Problem** | `dangerouslySetInnerHTML` without `sanitizeHtml` on admin B2B preview |
| **Impact** | Stored XSS against admin viewing malicious B2B HTML |
| **Required action** | Sanitize before 28.9+ or accept if B2B content is admin-only trusted |
| **Release stance** | **Recommend fix before production** if external partners submit HTML |

---

### REC-002 — KI-028-050 Ad popup vs sidebar

| Field | Value |
|-------|-------|
| **Severity** | P2 UX |
| **Problem** | Ad dialog can block Projects navigation after 5s |
| **Impact** | UX friction; E2E flakiness — **not** CI failure when fast |
| **Required action** | Fix z-index/dismiss-on-sidebar (28.9+) or accept known UX limitation |

---

### REC-003 — KI-028-054 Rate limit CI verification

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Problem** | RateLimitingTest reported failing in 28.6; no bypass proven |
| **Required action** | Fix tests + confirm limits in CI before claiming rate-limit regression protection |

---

## Summary

| Category | Count |
|----------|------:|
| P0/P1 confirmed app defects | 0 |
| Mandatory decisions / verifications | 3 |
| Strong recommendations | 3 |

---

## Answer: What must be resolved before production?

1. **Decide** on public assistant endpoint (KI-028-053)
2. **Verify** bcmath (and standard extensions) on Hostinger PHP
3. **Decide** on MySQL 8 full test suite vs conditional acceptance (KI-028-030)
4. **Strongly recommend:** sanitize admin B2B preview (KI-028-055)

Everything else enters conditional acceptance or optimization backlog.

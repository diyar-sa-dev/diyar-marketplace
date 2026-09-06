# Security Consolidation — Stage 28

**Source:** Phase 28.6  
**Verdict:** **PARTIAL** — strong on tested authorization; gaps in coverage and hardening

---

## Proven controls

| Control | Evidence |
|---------|----------|
| Authentication flows | AuthenticationTest PASS |
| Chat authorization | 25/25 PASS |
| Order/payment ownership | OrderAuthorizationTest, ProductIdorTest PASS |
| Admin role isolation | Permission tests PASS |
| Mass assignment (profile) | status prohibited |
| Blog public XSS | sanitizeHtml used |
| Webhook/payment idempotency subset | PASS |
| No passwords in localStorage | Frontend inspection PASS |

---

## Open findings (canonical)

| ID | Sev | Issue | 28.8 disposition |
|----|-----|-------|------------------|
| KI-028-053 | P2 | Public assistant endpoint | **BLOCKER decision** |
| KI-028-054 | P3 | RateLimit PHPUnit stale | TEST GAP — fix tests |
| KI-028-055 | P3 | Admin B2B unsanitized HTML | **Recommend fix** |
| KI-028-056 | P3 | No CSP | Hardening — defer |
| KI-028-057 | P3 | Assistant test gap | TEST GAP |
| KI-028-058 | P3 | Notification IDOR gap | TEST GAP |
| KI-028-059 | P3 | Local .env secrets | ENV — prod separate |

---

## KI-028-053 assessment

| Question | Answer |
|----------|--------|
| Exploitable today? | Yes — cost/abuse at 30 req/min/IP |
| Auth bypass? | N/A — intentionally public |
| Production blocker? | **Product decision** — not automatic code defect |
| Recommended default | Require auth OR strict budget + monitoring |

---

## KI-028-055 assessment

| Question | Answer |
|----------|--------|
| Exploitability | Low — needs malicious B2B HTML + admin preview |
| Admin-only? | Yes — but admins are high-value targets |
| Production blocker? | **Conditional** — fix recommended if untrusted B2B content |

---

## KI-028-054 assessment

| Question | Answer |
|----------|--------|
| Bypass proven? | **NO** |
| CI protects limits? | **NO** — tests failing/stale |
| Classification | TEST GAP, not confirmed vulnerability |

---

## Production security certification

```text
SECURITY READY: PARTIAL
PRODUCTION SECURITY CERTIFIED: NO
```

Reasons: assistant decision pending; partial IDOR/upload/header coverage; production Hostinger config unverified.

---

## Deferred to optimization/hardening

OPT-SECURITY-001 (new): CSP implementation — Phase 28.11  
OPT-SECURITY-002 (new): Assistant auth/rate hardening — Phase 28.9

No silent fixes in 28.8.

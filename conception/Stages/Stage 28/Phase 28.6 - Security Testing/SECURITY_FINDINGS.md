# Phase 28.6 — Security Findings

**New IDs:** KI-028-053 through KI-028-059

---

## Summary

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| P2 | 1 |
| P3 | 6 |
| P4 | 2 |

---

## P2

### KI-028-053 — Public unauthenticated assistant chat endpoint

| Field | Value |
|-------|-------|
| **Route** | `POST /api/v1/assistant/chat` |
| **Auth** | None — `throttle:30,1` only |
| **Impact** | OpenAI cost abuse, prompt injection surface, no user attribution |
| **CWE** | CWE-306 (missing authentication for critical function) — contextual |
| **Evidence** | `routes/api.php`, `AssistantChatRequest::authorize() === true` |
| **Exploitability** | Medium — rate limit mitigates volume |
| **Remediation** | Require auth or stricter rate limit + CAPTCHA; add Feature tests |
| **Phase** | 28.9+ hardening |

---

## P3

### KI-028-054 — Rate limit PHPUnit tests stale / not triggering

| Field | Value |
|-------|-------|
| **Tests** | `RateLimitingTest` — 3/3 fail |
| **Cause** | Login payload uses deprecated `{phone,password}`; catalog/OTP limits not hit in test config |
| **Classification** | **TEST DEFECT / TEST GAP** |
| **Security impact** | Unknown — limits may work in production but **unverified by CI** |

### KI-028-055 — Admin B2B preview renders unsanitized HTML

| Field | Value |
|-------|-------|
| **Component** | `AdminB2bCompaniesPage.tsx` — `dangerouslySetInnerHTML` without `sanitizeHtml` |
| **Impact** | Stored XSS against admin viewing malicious B2B HTML content |
| **Exploitability** | Low — requires admin to preview attacker-controlled company HTML |

### KI-028-056 — Content-Security-Policy header absent

| Field | Value |
|-------|-------|
| **Impact** | Reduced defense-in-depth against XSS |
| **Remediation** | Add CSP at nginx or middleware after policy design |

### KI-028-057 — Assistant API lacks security Feature tests

| Field | Value |
|-------|-------|
| **Extends** | KI-028-037 |
| **Impact** | Regression risk on auth/throttle/validation |

### KI-028-058 — Notification IDOR matrix incomplete

| Field | Value |
|-------|-------|
| **Extends** | KI-028-031 |
| **Impact** | Unknown cross-user notification access |

### KI-028-059 — Local `.env` plaintext third-party credentials

| Field | Value |
|-------|-------|
| **Impact** | Local machine compromise exposes mail credentials |
| **Note** | Not in git; production must use separate secrets |

---

## P4

### KI-028-060 — RateLimitingTest maintenance debt

Test payload drift from auth API contract.

### KI-028-061 — Loyalty commerce PHPUnit failures in extended run

4 failures in config tests — **TEST DEFECT**, not classified as security vulnerability.

---

## Reclassified / not security

| ID | Disposition |
|----|-------------|
| KI-028-021 | Test flakiness — not security |
| KI-028-041/050 | UX/flakiness — not auth bypass |
| KI-028-048 | Environment — resolved |

---

## False positives

None confirmed in executed tests.

---

## Release blockers (P0/P1)

**None identified** in Phase 28.6 scope.

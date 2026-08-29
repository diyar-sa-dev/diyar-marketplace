# Security Hardening Audit

**Date:** 2026-08-29  
**Scope:** OWASP-style application security re-audit (non-destructive)

---

## Summary

| Severity | Open | Fixed this audit | Accepted/deferred |
|----------|------|------------------|-------------------|
| Critical (P0) | 0 | 0 | — |
| High (P1) | 0 | 1 (test assertion) | — |
| Medium (P2) | 1 | 2 | 3 |
| Low (P3) | 4 | 0 | — |

**Verdict:** No known exploitable P0/P1 vulnerabilities in repository code. Production deploy must add nginx CSP/HSTS.

---

## Access control

| Check | Status | Evidence |
|-------|--------|----------|
| Admin route isolation | **PROVEN** | `admin.permission` middleware |
| Vendor order scoping | **PROVEN** | Policy + vendor_id filters |
| B2B tenant isolation | **PROVEN** | Company-scoped queries |
| IDOR on orders/payments | **PROVEN** | Feature tests OrderAuthorizationTest |
| Customer data isolation | **PROVEN** | Sanctum user scope |

---

## Authentication & session

| Check | Status | Evidence |
|-------|--------|----------|
| Sanctum token auth | **PROVEN** | API guard |
| Rate limit auth endpoints | **PROVEN** | `throttle:auth`, `throttle:otp` |
| Password reset throttling | **PROVEN** | OTP rate limits |
| Session fixation | N/A | Token-based API |
| Brute force login | **PROVEN** | RateLimitingTest |

---

## Injection & XSS

| Check | Status | Evidence |
|-------|--------|----------|
| SQL injection | **PROVEN** | Eloquent parameter binding |
| Search injection | **PROVEN** | CatalogSearchSecurityTest |
| Stored XSS (B2B about) | **FIXED** | sanitizeHtml in admin preview |
| Reflected XSS | **PROVEN** | JSON API; no raw HTML echo |
| DOM XSS | **MONITOR** | React default escaping; CMS HTML fields need review |

---

## CSRF / CORS

| Check | Status | Evidence |
|-------|--------|----------|
| CSRF on state-changing web | **PROVEN** | Sanctum SPA cookie + CSRF |
| CORS policy | **PROVEN** | `config/cors.php` restricted origins |

---

## File upload & storage

| Check | Status | Evidence |
|-------|--------|----------|
| MIME/size validation | **PROVEN** | Form requests |
| Path traversal | **PROVEN** | Storage disk abstraction |
| Public media ACL | **PROVEN** | UUID paths under storage/app/public |

---

## Payment & webhooks

| Check | Status | Evidence |
|-------|--------|----------|
| Webhook signature verification | **PROVEN** | MyFatoorah processor |
| Idempotency | **PROVEN** | payload_hash unique + ShouldBeUnique job |
| Replay protection | **PROVEN** | Lease + state machine |
| Amount tampering | **PROVEN** | BCMath server-side totals |

---

## AI / Assistant abuse (KI-028-053)

| Control | Status |
|---------|--------|
| Rate limit 30/min per IP/user | **PROVEN** |
| Max 20 messages × 4000 chars | **PROVEN** |
| catalog_context max 12k | **PROVEN** |
| 45s upstream timeout | **PROVEN** |
| Admin disable toggle | **FIXED** (EffectiveConfig) |
| Auth required | **NOT ENFORCED** — product decision |
| Daily cost cap | **NOT IMPLEMENTED** — monitor OpenAI billing |

**Recommendation:** Keep public with controls; add auth requirement via config if abuse observed.

---

## Security headers

| Header | Status |
|--------|--------|
| SecurityHeaders middleware | **PROVEN** |
| HSTS | **DEFER** — nginx production |
| CSP | **DEFER** — KI-028-056 nginx deploy |
| X-Frame-Options | **PROVEN** |
| Cache-Control on auth | **PROVEN** — ApplyHttpCachePolicy |

---

## Secrets & configuration

| Check | Status |
|-------|--------|
| .env not in git | **PROVEN** |
| Production env validation | **PROVEN** — EnvironmentSafetyValidator |
| APP_DEBUG=false enforced | **PROVEN** |
| Default credentials blocked | **PROVEN** |

---

## DOS / abuse surfaces

| Surface | Protection | Gap |
|---------|------------|-----|
| Login/auth | throttle:auth, otp | — |
| Search | throttle:catalog-search | — |
| Assistant | throttle:assistant-chat | No auth |
| Chat | throttle:chat-* | — |
| Webhooks | throttle:webhooks | — |
| Uploads | size limits | Per-user quota **NOT IMPLEMENTED** |
| Checkout | auth + inventory locks | — |

---

## Remediation implemented (this audit)

1. **ENT-002** — Vite proxy no longer intercepts static `/app-mockup.png`
2. **OPT-003** — Assistant respects runtime admin disable
3. **KI-028-055** — B2B XSS sanitization (28.15, verified)

---

## Pre-production security checklist

- [ ] Enable CSP + HSTS in nginx (`deploy/nginx/production.conf.example`)
- [ ] Verify `APP_DEBUG=false`, `APP_ENV=production`
- [ ] Run `EnvironmentSafetyValidator` on deploy
- [ ] Wire Redis integration tests on staging
- [ ] Monitor assistant OpenAI usage / set billing alerts
- [ ] Review Hostinger TLS termination config

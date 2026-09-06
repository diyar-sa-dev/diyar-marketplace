# API Rate Limit Audit — Phase 28.10

**Date:** 2026-08-27  
**Status:** PASS

---

## Named limiters (`AppServiceProvider`)

| Limiter | Default | Scope |
|---------|---------|-------|
| `auth` | 20/min | IP |
| `otp` | 10/min | phone\|IP |
| `catalog-search` | 60/min | IP |
| `assistant-chat` | 30/min | user or IP (**NEW 28.10**) |
| `webhooks` | 120/min | IP |
| `chat-messages` | 30/min | user or IP |
| `affiliate-click` | 30/min | IP |

Assistant **not** bypassed in load-test mode (intentional abuse protection).

---

## KI-028-054 resolution

**Problem:** RateLimitingTest used legacy login payload `{ phone, password }` → always 422, never hit rate limit path meaningfully.

**Fix:**
- Payload: `{ method: 'phone', identifier, password }`
- `phpunit.xml`: `DIYAR_LOADTEST_MODE=false`
- `setUp`: clear `assistant-chat` limiter

**Result:** 4/4 RateLimitingTest PASS

---

## Test coverage

| Endpoint | Tested |
|----------|--------|
| Login | YES |
| Catalog search | YES |
| Forgot password (OTP) | YES |
| Assistant chat | YES (NEW) |
| Uploads | NO — P3 |
| Chat messages | NO — existing middleware only |

---

## Production notes

- Redis-backed rate limiting in production (via Laravel cache)
- Behind proxy: ensure `TrustProxies` configured for correct IP

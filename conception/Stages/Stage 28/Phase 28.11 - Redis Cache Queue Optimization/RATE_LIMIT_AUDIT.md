# Rate Limit Audit

**Cross-ref:** KI-028-054 (RESOLVED 28.10), Phase 28.6 security findings

---

## Named limiters (`AppServiceProvider`)

| Limiter | Limit | Scope | Route examples |
|---------|-------|-------|----------------|
| `auth` | 20/min | IP | Login, register |
| `otp` | 10/min | IP | OTP send |
| `assistant-chat` | 30/min | IP | `POST /api/v1/assistant/chat` |
| `catalog-search` | 60/min | IP | `/catalog/search` |
| `catalog-search-suggestions` | 90/min | IP | `/catalog/search/suggestions` |
| `webhooks` | 120/min | IP | Payment webhooks |
| `wishlist-toggle` | 60/min | User | Wishlist |
| `chat-messages` | 30/min | User | Chat send |
| `chat-conversations` | 10/min | User | New conversation |
| `chat-typing` | 60/min | User | Typing indicator |
| `chat-attachments` | 10/min | User | Attachments |
| `affiliate-click` | 30/min | IP | Affiliate tracking |
| `affiliate-resolve` | 30/min | IP | Link resolve |
| `affiliate-link` | 20/min | User | Link creation |
| `admin-broadcasts` | Config | Admin | Broadcasts |
| `b2b-leads` | Config | IP | B2B lead form |
| `analytics-export` | Config | User | Export |

**Load test mode:** `DIYAR_LOADTEST_MODE=false` in `phpunit.xml` ensures limits apply in tests.

---

## Additional limiters (non-middleware)

| Service | Mechanism |
|---------|-----------|
| `AuthService` | Login attempt tracking via `RateLimiter` |
| Affiliate click dedupe | `Cache::add` window (60 min) |

---

## Test evidence

| Test | Result |
|------|--------|
| `RateLimitingTest::test_assistant_chat_is_rate_limited` | PASS |
| `RateLimitingTest` (login) | PASS (28.10 fix) |
| `CatalogSearchSecurityTest` | PASS |
| Filter suite (28 tests) | PASS |

---

## Proxy / IP correctness

- Uses Laravel `Request::ip()` — ensure `TrustProxies` middleware configured on Hostinger for real client IP.
- **NOT VERIFIED** behind production Nginx in this pass.

---

## Assessment

**PASS (functional)** — Limits exist, are tested for assistant + auth, and use Redis/cache store in production.

**PARTIAL (ops)** — Production proxy trust and distributed rate limit across multiple app nodes NOT VERIFIED without staging deploy.

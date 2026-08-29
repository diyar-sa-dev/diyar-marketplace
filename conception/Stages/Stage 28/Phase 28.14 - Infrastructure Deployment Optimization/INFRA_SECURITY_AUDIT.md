# Infrastructure Security Audit — Phase 28.14

## Production bypasses

| Bypass | Guard |
|--------|-------|
| `DIYAR_LOADTEST_MODE` | Blocked in production + staging (28.14) |
| `DIYAR_PAYMENT_USE_FAKE_GATEWAY` | Blocked in production |
| `APP_DEBUG` | Blocked in production |
| `MYFATOORAH_TEST_MODE` | Must be false in production |

## Secrets

- Never in Vite bundle (`VITE_*` is public)
- `.env` in shared directory, not in git
- Nginx denies direct `.env` access

## Headers (28.13 + 28.14)

- HSTS, X-Content-Type-Options, Referrer-Policy, frame protection
- HTTP cache isolation for authenticated responses

## Upload security

- Nginx + PHP limits aligned at 12 MB
- Storage served as static files — no PHP execution in upload paths

## Ports

- MySQL/Redis: internal only in production Docker
- Public: 443 (Nginx) only

## Regression tests

- `EnvironmentSafetyValidatorTest` — 5 cases including loadtest guard
- `HttpCachePolicyTest` — 9 cases
- `RateLimitingTest` — 4 cases (with clean env)

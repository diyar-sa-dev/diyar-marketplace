# Phase 28.6 — Session / CSRF / CORS

---

## Sanctum (SPA)

| Setting | Value |
|---------|-------|
| Guards | `web`, `admin` |
| Stateful domains | env `SANCTUM_STATEFUL_DOMAINS` |
| CSRF | `ValidateCsrfToken` on stateful requests |
| Session driver | `database` |

---

## CORS (`config/cors.php`)

| Setting | Value |
|---------|-------|
| Paths | `api/*`, `sanctum/csrf-cookie` |
| Origins | `FRONTEND_URL` only (single origin) |
| Credentials | **true** |
| Methods/headers | `*` |

**Assessment:** Restricted origin list — **PASS** for SPA model. Wildcard methods/headers acceptable with origin lock.

---

## Cookies

Session cookies via Laravel defaults. Production must set:
- `SESSION_SECURE_COOKIE=true` (documented in `.env.example`)
- SameSite=Lax (framework default)

**NOT VERIFIED** cookie flags in live production deployment.

---

## CSRF testing

Stateful mutating requests require `X-XSRF-TOKEN` — enforced by Sanctum middleware stack. PHPUnit uses `withoutMiddleware` patterns in some tests — production path uses full stack.

---

## Gate

```text
PARTIAL
```

Configuration sound; production cookie flags **NOT VERIFIED** on Hostinger.

# Stage 20 — Authentication Security

## Marketplace (`web` guard)

- Stateful Sanctum for SPA (`/api/v1/auth/*`)
- `EnsureMarketplaceAccess` blocks admin-only accounts
- OTP flows: attempt limits via `throttle:otp`
- Password hashing: Laravel `bcrypt`/`hash`
- Logout invalidates marketplace session only

## Admin (`admin` guard)

- Separate login: `/api/v1/admin/auth/login`
- Session endpoint: `/api/v1/admin/session`
- Admin-only accounts cannot use marketplace login (`AdminIsolationTest`)
- Logout invalidates admin session only

## Cookie configuration (production)

Set in `.env`:

```env
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.diyar.com   # if sharing across subdomains — evaluate carefully
```

Prefer separate origins (`admin.diyar.com` vs `diyar.com`) for strongest isolation.

## Tests

`backend/tests/Feature/Admin/AdminIsolationTest.php`

- Cross-context sessions remain isolated
- Marketplace logout does not invalidate admin session
- Admin logout does not invalidate marketplace session

# Stage 20 — Rate Limiting

Configured in `backend/routes/api.php` and `RouteServiceProvider` / `bootstrap/app.php`.

| Endpoint group | Middleware | Typical limit |
|----------------|------------|---------------|
| Auth login/register | `throttle:auth` | Per `config/diyar.php` |
| OTP verify/resend | `throttle:otp` | Stricter |
| Admin auth | `throttle:auth` | Same as marketplace auth |
| Affiliate click | `throttle:affiliate-click` | Anti-fraud |
| Affiliate resolve | `throttle:affiliate-resolve` | Anti-enumeration |
| Reviews / bookings | `throttle:30,1` or `20,1` | Per-action |

## Recommendations

- Add explicit throttle on admin mutation bulk endpoints if traffic grows
- Monitor 429 rates in production logs
- Align `throttle:auth` with lockout policy in `config/diyar.php`

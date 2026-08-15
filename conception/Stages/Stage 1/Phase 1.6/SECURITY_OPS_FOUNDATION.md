# Phase 1.6 — Security / API / Operations Foundation

> **Status:** CURRENT  
> **Stage:** 1 — Engineering Foundation

---

## Security Infrastructure (Stage 1)

| Control | Implementation |
|---------|----------------|
| CORS | `config/cors.php` — `FRONTEND_URL`, credentials enabled |
| Sanctum | Installed, config published, `HasApiTokens` on User |
| Rate limiting | `RateLimiter::for('api')` — 60/min default |
| Security headers | `SecurityHeaders` middleware (global) |
| JSON errors | API exception rendering in `bootstrap/app.php` |
| API envelope | `App\Support\Api\ApiResponse` |
| Auth workflows | **Not implemented** — Stage 2 |

---

## API Response Convention

```json
{
  "success": true,
  "data": { },
  "message": "optional",
  "meta": { }
}
```

Error:

```json
{
  "success": false,
  "message": "Human-readable message",
  "errors": { }
}
```

---

## Environment Secrets

- Never commit `.env`
- Use `.env.example` as template
- Rotate `APP_KEY` per environment

---

## File Upload Security (Foundation)

- `FILESYSTEM_DISK=local` for Stage 1
- Validation and virus scanning deferred to Media domain (Stage 2+)

---

## Observability

- `LOG_CHANNEL=stack` default
- Structured logging for business events — Stage 2+

---

## Database Backup

See `conception/runbooks/DATABASE_BACKUP.md`.

# Stage 20 — Security Architecture

**Last updated:** 2026-08-23

## Layers

```text
Browser (React SPA)
    ↓ HTTPS + CORS + CSRF (stateful Sanctum)
API Gateway (Laravel routes + throttle middleware)
    ↓
Authentication (web guard | admin guard)
    ↓
Authorization (roles + policies + AdminPermission)
    ↓
Domain services (transactions, idempotency, audit)
    ↓
Database (constraints, row locks where needed)
```

## Dual control planes

| Plane | Guard | Session cookie | API prefix |
|-------|-------|----------------|------------|
| Marketplace | `web` / Sanctum | `diyar_marketplace_session` (configurable) | `/api/v1/*` |
| Admin | `admin` | `diyar_admin_session` (configurable) | `/api/v1/admin/*` |

Sessions are isolated — marketplace logout does not invalidate admin session and vice versa (`AdminIsolationTest`).

## Financial integrity

- Checkout totals computed server-side (`CheckoutPreviewTest`, order placement services)
- Idempotency keys on order creation (`OrderAuthorizationTest`)
- Payment state machine with invalid transition rejection
- Refund idempotency (`RefundIdempotencyTest`)
- Payout mutations via `AdminPayoutActionService` with audit

## Secrets

- `.env` only — never committed
- Sensitive system settings masked in admin UI (`is_sensitive`)
- No secrets in `VITE_*` frontend variables

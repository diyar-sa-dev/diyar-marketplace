# DIYAR API Documentation

> **Status:** CURRENT — Stage 2 Identity & Stage 3 Profile implemented  
> **Last updated:** 2026-08-16  
> **Base path:** `/api/v1`

---

## Purpose

This directory documents the **implemented and planned** DIYAR REST API. It complements the Stage 0 contract in [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md), which describes future business endpoints not yet built.

**Source of truth for implemented behavior:** repository code + tests in `backend/tests/Feature/Api/V1/`.

---

## Documents

| Document | Scope |
|----------|--------|
| [API_CONVENTIONS.md](./API_CONVENTIONS.md) | Versioning, envelope, errors, auth, rate limits, CORS |
| [HEALTH.md](./HEALTH.md) | `GET /api/v1/health` |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | **Implemented** Stage 2 auth + sessions |
| [POSTMAN.md](./POSTMAN.md) | Postman collection/environment |
| [providers/MSEGAT.md](./providers/MSEGAT.md) | SMS adapter — **IMPLEMENTED (Stage 2)** |
| [providers/MYFATOORAH.md](./providers/MYFATOORAH.md) | Payment provider — **DEFERRED** |
| [providers/OPENAI.md](./providers/OPENAI.md) | AI provider — **DEFERRED** |

---

## Implemented Endpoints

| Method | Path | Auth | Document |
|--------|------|------|----------|
| GET | `/api/v1/health` | None | [HEALTH.md](./HEALTH.md) |
| GET | `/sanctum/csrf-cookie` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/register` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/verify-otp` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/resend-otp` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/login` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/logout` | Yes | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| GET | `/api/v1/auth/me` | Yes | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/forgot-password` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/verify-password-reset-otp` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| POST | `/api/v1/auth/reset-password` | None | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| GET | `/api/v1/vendor/accounts/{vendorAccount}` | Yes | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| GET | `/api/v1/provider/accounts/{providerAccount}` | Yes | [AUTHENTICATION.md](./AUTHENTICATION.md) |
| GET | `/api/v1/profile` | Yes | Stage 3 — see [Stage 3 README](../Stages/Stage%203/README.md) |
| PATCH | `/api/v1/profile` | Yes | Stage 3 |
| PATCH | `/api/v1/profile/password` | Yes | Stage 3 |
| POST | `/api/v1/profile/avatar` | Yes | Stage 3 |
| DELETE | `/api/v1/profile/avatar` | Yes | Stage 3 |
| POST | `/api/v1/profile/phone/request-change` | Yes | Stage 3 |
| POST | `/api/v1/profile/phone/resend-change` | Yes | Stage 3 |
| POST | `/api/v1/profile/phone/verify-change` | Yes | Stage 3 |
| GET/POST | `/api/v1/profile/addresses` | Yes | Stage 3 |
| GET/PATCH/DELETE | `/api/v1/profile/addresses/{id}` | Yes | Stage 3 |
| POST | `/api/v1/profile/addresses/{id}/default` | Yes | Stage 3 |

Laravel framework health (non-JSON): `GET /up`

---

## Planned Endpoints

Catalog, checkout, payments, orders, and other business domains remain **planned** until their authorized stage. See [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md).

---

## Postman Assets

| Asset | Path |
|-------|------|
| Collection | [`postman/DIYAR-API-v1.postman_collection.json`](./postman/DIYAR-API-v1.postman_collection.json) |
| Environment (local example) | [`postman/DIYAR-API-Local.postman_environment.json`](./postman/DIYAR-API-Local.postman_environment.json) |

See [POSTMAN.md](./POSTMAN.md). **Do not commit production secrets** in environment files.

---

## Related

- [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md) — full V1 contract (planned business APIs)
- [`../adr/ADR-004-api.md`](../adr/ADR-004-api.md) — REST `/api/v1` decision
- [`../adr/ADR-006-external-providers.md`](../adr/ADR-006-external-providers.md) — provider abstraction
- [`../adr/ADR-007-spa-session-authentication.md`](../adr/ADR-007-spa-session-authentication.md) — SPA session auth
- `.agent/ARCHITECTURE_RULES.md` — operational constraints

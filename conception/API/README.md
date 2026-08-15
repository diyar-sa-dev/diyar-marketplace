# DIYAR API Documentation

> **Status:** CURRENT — Stage 1 foundation  
> **Last updated:** 2026-08-15  
> **Base path:** `/api/v1`

---

## Purpose

This directory documents the **implemented and planned** DIYAR REST API. It complements the Stage 0 contract in [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md), which describes future endpoints not yet built.

**Source of truth for implemented behavior:** repository code + tests in `backend/tests/Feature/Api/V1/`.

---

## Documents

| Document | Scope |
|----------|--------|
| [API_CONVENTIONS.md](./API_CONVENTIONS.md) | Versioning, envelope, errors, auth strategy, rate limits, CORS |
| [HEALTH.md](./HEALTH.md) | `GET /api/v1/health` (implemented) |
| [AUTHENTICATION.md](./AUTHENTICATION.md) | Sanctum infrastructure + **planned** Stage 2 auth endpoints |
| [POSTMAN.md](./POSTMAN.md) | Import and usage of Postman collection/environment |
| [providers/MSEGAT.md](./providers/MSEGAT.md) | OTP/SMS provider — **SELECTED / DEFERRED** |
| [providers/MYFATOORAH.md](./providers/MYFATOORAH.md) | Payment provider — **SELECTED / DEFERRED** |
| [providers/OPENAI.md](./providers/OPENAI.md) | AI provider — **SELECTED / DEFERRED** |

---

## Implemented Endpoints (Stage 1)

| Method | Path | Auth | Document |
|--------|------|------|----------|
| GET | `/api/v1/health` | None | [HEALTH.md](./HEALTH.md) |

Laravel framework health (non-JSON): `GET /up`

---

## Planned Endpoints

Authentication, catalog, checkout, payments, and all business domains are documented in [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md) as **planned contracts**. They are **not implemented** until their authorized stage.

---

## Postman Assets

| Asset | Path |
|-------|------|
| Collection | [`postman/DIYAR-API-v1.postman_collection.json`](./postman/DIYAR-API-v1.postman_collection.json) |
| Environment (local example) | [`postman/DIYAR-API-Local.postman_environment.json`](./postman/DIYAR-API-Local.postman_environment.json) |

See [POSTMAN.md](./POSTMAN.md).

---

## Related

- [`../architecture/API_SPECIFICATION.md`](../architecture/API_SPECIFICATION.md) — full V1 contract (planned)
- [`../adr/ADR-004-api.md`](../adr/ADR-004-api.md) — REST `/api/v1` decision
- [`../adr/ADR-006-external-providers.md`](../adr/ADR-006-external-providers.md) — provider abstraction rule
- `.agent/ARCHITECTURE_RULES.md` — operational constraints

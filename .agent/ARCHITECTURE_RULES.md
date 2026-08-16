# Architecture Rules

> **Status:** CURRENT — enforces Stage 0 baseline

---

## Backend

| Rule | Requirement |
|------|-------------|
| Framework | Laravel 13 — do not reinstall or recreate project |
| Style | Modular monolith — domain modules added in Stage 2+ |
| API prefix | `/api/v1` |
| Database V1 | MySQL 8 (sqlite acceptable for local dev / CI tests) |
| Cache V1 | Laravel Cache — **no Redis** |
| Queue V1 | Database queue |
| Auth infra | Sanctum installed and configured in Stage 1 |
| Auth workflows | **Implemented in Stage 2** — Sanctum stateful sessions + CSRF |
| Timezone | `Asia/Riyadh` |
| Locale | `ar` primary, `en` fallback |
| Payments | `PaymentGatewayInterface` — never couple to one provider |
| Finance | Append-only ledger — never `balance += X` as authority |
| Chat V1 | HTTP polling — no WebSockets unless authorized |

---

## Frontend

| Rule | Requirement |
|------|-------------|
| Stack | React 19, TypeScript, Vite, Tailwind |
| Data | TanStack Query + Axios |
| Structure | `api/`, `types/`, `hooks/`, `features/`, `pages/`, etc. |
| Mock data | Keep until API hooks replace it — do not delete in Stage 1 |
| RTL | Arabic RTL is primary |

---

## API Conventions

- JSON responses via standardized envelope (`success`, `data`, `message`, `errors`, `meta`)
- Version in URL: `/api/v1/...`
- Health: `GET /api/v1/health`
- Errors return appropriate HTTP status + JSON body
- **Implemented API docs:** `conception/API/`

---

## External Providers (Selected)

> External providers are **infrastructure adapters**, not business logic.

| Contract | Provider | Region | Status |
|----------|----------|--------|--------|
| `PaymentGateway` | MyFatoorah | Saudi Arabia | Deferred — Payments stage |
| `SmsProvider` | MSEGAT / مسجات | Saudi Arabia | **Implemented (Stage 2)** — LogSmsProvider in dev |
| `AIProvider` | OpenAI | — | Deferred — AI stage |
| `ImageGenerationProvider` | OpenAI | — | Deferred — AI stage |

Never call provider APIs from controllers or domain entities. See `conception/adr/ADR-006-external-providers.md`.

---

## Commission (Business — do not hard-code)

Resolution order: Product → Vendor → Category → Global. Default seed 10% is configurable, not hard-coded.

---

## ADR Triggers

New ADR required for: database change, auth mechanism change, API style change, Redis, WebSockets, payment architecture, modular boundary change, microservices, financial model change, storage architecture change.

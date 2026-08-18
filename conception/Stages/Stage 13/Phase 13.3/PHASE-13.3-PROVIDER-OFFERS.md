# Phase 13.3 — Provider Offers

> **Status:** **COMPLETE (backend + customer UI)** · **Provider Portal UI — PENDING**  
> **Scope:** Provider offer submission, inbox API, customer offer acceptance, duplicate protection.

---

## Objective

Category-matched providers submit offers on open RFQs. Customer accepts exactly one offer; other pending offers are rejected transactionally.

---

## Domain model

| Entity | Table |
|--------|-------|
| `ServiceOffer` | `service_offers` |

**Enum:** `ServiceOfferStatus` — `pending`, `accepted`, `rejected`, `withdrawn`, `expired`

---

## API

| Method | Route | Role |
|--------|-------|------|
| POST | `/api/v1/service-requests/{id}/offers` | provider (multipart optional `quotation`) |
| POST | `/api/v1/service-offers/{id}/accept` | customer |
| GET | `/api/v1/dashboard/provider/service-requests` | provider inbox (`status`: all/open/submitted) |
| GET | `/api/v1/dashboard/provider/service-requests/{id}` | provider detail |

---

## Backend service

`ServiceOfferService`:

- Category match via provider's service categories
- Duplicate offer per provider → **422** `already_submitted`
- Cannot offer on own request → **403**
- Closed request → **422** `request_closed`
- Accept: transactional — marks offer accepted, rejects siblings, creates booking (13.4)

---

## Provider inbox filters

| Tab (planned UI) | API `status` |
|------------------|--------------|
| الطلبات المتاحة | `open` — no provider offer yet |
| عروضي المقدمة | `submitted` — provider already offered |

SQL pagination via `listForProvider()` — not full-table client filter.

---

## Frontend

| Area | Status |
|------|--------|
| Customer offer list + **قبول العرض** on `ServiceRequestsPage` | ✅ Implemented |
| `ServiceClientRequests` (provider inbox) | ⏳ **Mock at HEAD** — wiring in working tree, **not sign-off** |
| `ServiceClientRequestDetails` (submit offer) | ⏳ **Mock at HEAD** |

**Planned provider client:** `frontend/src/api/providerDashboard.ts`, `hooks/provider/useProviderDashboard.ts`

---

## Security tests

| Case | Expected |
|------|----------|
| Duplicate offer | 422 |
| Non-provider roles on inbox | 403 |
| Category mismatch on detail | 403 |
| Customer accepts own/other's offer | 403 |

---

## Acceptance criteria

- [x] Provider submits offer with price + message + optional quotation
- [x] Customer views offers and accepts one
- [x] Other pending offers rejected on accept
- [x] Provider inbox/detail APIs with authorization
- [ ] Provider Portal pages wired and QA'd (**PENDING — blocks Stage 13**)

---

## Deferred

- Offer expiration automation (domain field exists; cron not required for MVP)
- Chat/WhatsApp on offers

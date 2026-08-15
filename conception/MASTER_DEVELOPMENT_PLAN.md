# DIYAR — Master Development Plan

> **Version:** 1.2  
> **Status:** CURRENT BASELINE  
> **Stage 0:** FINALIZED  
> **Stage 1:** FINALIZED  
> **Next:** Stage 2 — Identity & Authentication  
> **Last updated:** 2026-08-15

---

## 1. Vision

Transform the DIYAR frontend prototype into a production-ready, scalable full-stack marketplace: multi-vendor commerce, service marketplace, financial ledger, and admin operations — built on **Laravel 13 + MySQL + React**.

---

## 2. Documentation Index

| Document | Status | Purpose |
|----------|--------|---------|
| [REQUIREMENTS_BASELINE.md](./REQUIREMENTS_BASELINE.md) | **CURRENT BASELINE** | Authoritative business + tech rules |
| [REPOSITORY_AUDIT.md](./REPOSITORY_AUDIT.md) | COMPLETED | Repo state at Stage 0 |
| [Stages/Stage 0/STAGE_0_COMPLETION_REPORT.md](./Stages/Stage%200/STAGE_0_COMPLETION_REPORT.md) | FINALIZED | Stage 0 report |
| [Stages/Stage 1/STAGE_1_COMPLETION_REPORT.md](./Stages/Stage%201/STAGE_1_COMPLETION_REPORT.md) | FINALIZED | Stage 1 report |
| [API/](./API/) | **CURRENT** | Implemented API docs + Postman |
| [architecture/*.md](./architecture/) | **CURRENT BASELINE** | System, domain, DB, API contract (planned) |
| [adr/*.md](./adr/) | **CURRENT BASELINE** | Architecture decisions |
| [business/*.md](./business/) | BASELINE — Stage 0 | Domain business rules |
| [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) | **REFERENCE — SUPERSEDED** | Prior UI discovery |
| [PLAN.md](./PLAN.md) | **REFERENCE — SUPERSEDED** | Prior planning draft |

---

## 3. Technology Stack (V1 — CONFIRMED)

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind, React Router |
| Server state | TanStack Query + Axios |
| Backend | **Laravel 13.x**, PHP 8.3+, modular monolith |
| API | REST `/api/v1` |
| Auth infra | Laravel Sanctum (workflows Stage 2) |
| Database | MySQL 8 |
| Cache | Laravel Cache |
| Queue | Database queue |
| Storage | Laravel filesystem → S3 prod |
| Payments | `PaymentGateway` → **MyFatoorah (SA)** — **DEFERRED** |
| OTP/SMS | `SmsProvider` → **MSEGAT** — **DEFERRED** |
| AI | `AIProvider` / `ImageGenerationProvider` → **OpenAI** — **DEFERRED** |
| Finance | Append-only ledger |
| Chat V1 | HTTP polling |

**Not in V1 foundation:** PostgreSQL, Redis, microservices, WebSockets/Reverb, live payment/OTP/AI integrations.

---

## 4. Repository Structure

```
diyar-marketplace/
├── .agent/           # AI development control
├── conception/       # Knowledge base + API docs + stage reports
├── frontend/         # React SPA
└── backend/          # Laravel 13 API
```

---

## 5. Development Roadmap

| Stage | Name | Status |
|-------|------|--------|
| **0** | Discovery & Architecture | **FINALIZED** |
| **1** | Engineering Foundation | **FINALIZED** |
| **2** | Identity & Authentication | **NEXT** |
| **3** | Catalog & Products | Planned |
| **4** | Cart & Checkout | Planned |
| **5** | Payments & Finance | Planned |
| **6** | Vendor Operations | Planned |
| **7** | Services Marketplace | Planned |
| **8** | Shipping & Returns | Planned |
| **9** | Reviews / Coupons / Notifications / Chat | Planned |
| **10** | Frontend API Integration | Planned |
| **11** | Testing / Security / QA | Planned |
| **12** | Staging / Deployment | Planned |
| **13** | V1 Release | Planned |
| **V2** | AI (OpenAI), mobile, personalization | Future |

### Stage 1 — FINALIZED

Phases 1.1–1.6: backend/frontend foundation, standards, testing, CI, security infra, API docs + Postman.

Report: [Stages/Stage 1/STAGE_1_COMPLETION_REPORT.md](./Stages/Stage%201/STAGE_1_COMPLETION_REPORT.md)

### Stage 2 — Identity & Authentication (NEXT)

**Authorized when explicitly requested.**

| Area | Scope |
|------|--------|
| Authentication | Register, login, logout |
| Phone verification | OTP send/verify |
| Password reset | Forgot + reset flows |
| Roles | Role model + authorization foundation |
| Sanctum | Token/session workflows |

**OTP provider (selected, deferred integration until this stage):**

```text
OtpService → SmsProvider → MsegatSmsProvider → MSEGAT API (Saudi Arabia)
```

See [API/AUTHENTICATION.md](./API/AUTHENTICATION.md), [API/providers/MSEGAT.md](./API/providers/MSEGAT.md).

### Stage 5 — Payments & Finance (Future)

**Payment provider (selected, deferred):**

```text
PaymentGateway → MyFatoorahGateway → https://api-sa.myfatoorah.com/
```

Future requirements: payment creation/initiation/status, **Webhook V2**, signature verification, retries, idempotency, refunds, reconciliation.

See [API/providers/MYFATOORAH.md](./API/providers/MYFATOORAH.md), [adr/ADR-006-external-providers.md](./adr/ADR-006-external-providers.md).

### V2 — AI (Future)

```text
AIProvider → OpenAIProvider
ImageGenerationProvider → OpenAIImageProvider
```

See [API/providers/OPENAI.md](./API/providers/OPENAI.md).

---

## 6. Completion Report Convention

```
conception/Stages/
└── Stage N/
    ├── STAGE_N_COMPLETION_REPORT.md
    └── Phase M/
        └── PHASE_M_COMPLETION_REPORT.md
```

---

## 7. Open Decisions

See [REQUIREMENTS_BASELINE.md](./REQUIREMENTS_BASELINE.md) — OD-02 through OD-08.

**Resolved:** Laravel 13 (OD-09), MyFatoorah (OD-01), MSEGAT (OD-10), OpenAI (OD-11) — [ADR-006](./adr/ADR-006-external-providers.md).

---

## 8. Progression Rule

Project owner authorizes each stage.

**Current:** Stage 1 FINALIZED → **Stage 2 — Identity & Authentication** is next authorized stage.

---

*Maintained by development team.*

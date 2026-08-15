# DIYAR Marketplace — Current State

> **Last updated:** 2026-08-15  
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor marketplace (**Saudi Arabia**)

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stage 0 — Discovery & Architecture | **FINALIZED** |
| Stage 1 — Engineering Foundation | **FINALIZED** |
| Stage 2 — Identity & Authentication | **NOT STARTED** |

---

## Current Position

| Field | Value |
|-------|-------|
| **Current Stage** | Stage 1 — **FINALIZED** |
| **Current Phase** | — (Stage 1 complete) |
| **Current Task** | Stage 1 finalization complete (audit, API docs, Postman) |
| **Branch** | `dev` (local) |

---

## Stage 1 — Completed Phases

| Phase | Status |
|-------|--------|
| 1.1 Backend Engineering Foundation | **FINALIZED** |
| 1.2 Frontend Engineering Foundation | **FINALIZED** |
| 1.3 Development Standards | **FINALIZED** |
| 1.4 Testing Foundation | **FINALIZED** |
| 1.5 CI / Quality Gates | **FINALIZED** |
| 1.6 Security / API / Operations | **FINALIZED** |

---

## Next Authorized Stage

**Stage 2 — Identity & Authentication**

- Register, login, logout
- OTP via MSEGAT (`SmsProvider` abstraction)
- Password reset, roles foundation
- Protected API routes

**Not authorized:** products, cart, checkout, payments (MyFatoorah), orders, catalog, AI (OpenAI), media domain.

---

## External Provider Decisions (Selected — Not Integrated)

| Domain | Provider | Integration |
|--------|----------|-------------|
| Payments | **MyFatoorah** (Saudi Arabia) | DEFERRED — Payments stage |
| OTP/SMS | **MSEGAT / مسجات** (Saudi Arabia) | DEFERRED — Stage 2 |
| AI | **OpenAI** | DEFERRED — AI stage |

See `conception/adr/ADR-006-external-providers.md` and `conception/API/providers/`.

**Rule:** Providers are infrastructure adapters behind internal interfaces — not business logic.

---

## Implemented API (Stage 1)

| Endpoint | Document |
|----------|----------|
| `GET /api/v1/health` | `conception/API/HEALTH.md` |

Postman: `conception/API/postman/DIYAR-API-v1.postman_collection.json`

---

## Technical Baseline

- Laravel 13, PHP 8.3+, MySQL 8, Sanctum (infra), REST `/api/v1`
- React 19, TypeScript, Vite, TanStack Query, Axios
- CI: `.github/workflows/ci.yml`
- Node 20 LTS (`.nvmrc`)

---

## Open Decisions

OD-02 through OD-08 — see `conception/REQUIREMENTS_BASELINE.md`

**Resolved:** OD-01 MyFatoorah, OD-09 Laravel 13, OD-10 MSEGAT, OD-11 OpenAI

---

## Completion Reports

| Stage | Report |
|-------|--------|
| 0 | `conception/Stages/Stage 0/STAGE_0_COMPLETION_REPORT.md` |
| 1 | `conception/Stages/Stage 1/STAGE_1_COMPLETION_REPORT.md` |

---

## Deferred Work (Intentional)

PHPStan, auth workflows, OTP, payments, orders, catalog, media, AI, staging/production deployment, provider adapter implementations — assigned to future stages, not forgotten.



# STAGE 0 — DISCOVERY & ARCHITECTURE
--- 
**COMPLETE**

✓ Product discovery completed
✓ Business requirements validated
✓ V1 / V1.1 / V2 scope defined
✓ Multi-role marketplace model established
✓ Multi-vendor checkout architecture defined
✓ Product & inventory model defined
✓ Service marketplace workflow defined
✓ Payment gateway abstraction defined
✓ Commission system made configurable
✓ Financial ledger architecture established
✓ Order & vendor-order state machines defined
✓ Shipping & returns rules established
✓ REST API architecture defined
✓ Laravel modular-monolith architecture selected
✓ React frontend migration strategy defined
✓ Repository reorganized into frontend/backend/conception
✓ Stage 0 documentation and ADRs completed


# STAGE 1 — ENGINEERING FOUNDATION
--- 
**COMPLETE / FINALIZED**

✓ Laravel 13 backend foundation
✓ React 19 frontend foundation
✓ API v1 foundation
✓ Sanctum infrastructure
✓ Axios + TanStack Query
✓ API response/error conventions
✓ Development standards
✓ PHPUnit + Vitest foundation
✓ CI / quality gates
✓ CORS + rate limiting + security headers
✓ Health endpoint
✓ API documentation
✓ Postman collection + local environment
✓ External provider architecture
✓ MyFatoorah selected for Saudi payments
✓ MSEGAT selected for Saudi OTP/SMS
✓ OpenAI selected for AI
✓ Stage 1 audit completed
✓ Repository validation completed
✓ `.agent/` state finalized


# STAGE 2 — IDENTITY & AUTHENTICATION

--- 
**READY / AWAITING AUTHORIZATION**

Planned:
• Identity domain
• Customer/vendor/provider accounts
• Registration
• MSEGAT OTP verification
• Login/logout
• Sanctum authentication
• Roles
• Permissions
• Authorization
• Password recovery
• Identity API
• Frontend authentication integration
• Identity security testing
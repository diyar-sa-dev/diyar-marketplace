# DIYAR Marketplace — Current State

> **Last updated:** 2026-08-16 (Stage 2 documentation finalized)  
> **Maintained by:** AI development agents after each phase completion

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor marketplace (**Saudi Arabia**)

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stage 0 — Discovery & Architecture | **COMPLETE** |
| Stage 1 — Engineering Foundation | **COMPLETE / FINALIZED** |
| Stage 2 — Identity & Access | **COMPLETE / FINALIZED** |
| **Stage 3 — Catalog / Marketplace** | **NOT AUTHORIZED** |

---

## Current Position

| Field | Value |
|-------|-------|
| **Current Stage** | Stage 2 — **FINALIZED** |
| **Current Phase** | — |
| **Current Task** | Await explicit authorization for Stage 3 |
| **Branch** | `dev` (Stage 2 code present, uncommitted) |

---

## Stage 2 Architecture Highlights

| Topic | Implementation |
|-------|----------------|
| Identity PKs | UUID on users, roles, user_roles, vendor/provider accounts |
| OTP storage | **Laravel Cache** (hashed) — **no DB table** |
| SMS | `SmsProvider` → `LogSmsProvider` (dev) / `MsegatSmsProvider` (prod adapter) |
| Browser auth | Sanctum **session cookie** (HttpOnly) + CSRF — **no JWT / no localStorage tokens** |
| Registration | Pending user in TX → OTP in cache → verify assigns roles + accounts |
| Authorization | Role middleware + policies + dashboard RBAC + `/403` |
| Localization | Backend `SetLocaleFromRequest` + frontend `LocaleProvider` (ar/en, RTL/LTR) |

---

## Test Status (Verified 2026-08-16)

| Area | Result |
|------|--------|
| Backend PHPUnit | **41 / 41 passed** |
| Frontend Vitest | **36 / 36 passed** |
| TypeScript | **Pass** |
| ESLint | 4 warnings (react-refresh) — non-blocking |
| Prettier | 9 files need format — non-blocking |

---

## Implemented API

See `conception/API/AUTHENTICATION.md`, `conception/API/HEALTH.md`, and Postman collection.

---

## External Providers

| Domain | Provider | Status |
|--------|----------|--------|
| OTP/SMS | MSEGAT | Adapter implemented; **LogSmsProvider in dev**; prod credentials in `.env` only |
| Payments | MyFatoorah | Deferred |
| AI | OpenAI | Deferred |

---

## Documentation

| Document | Path |
|----------|------|
| Stage 2 index | `conception/Stages/Stage 2/README.md` |
| Stage 2 completion | `conception/Stages/Stage 2/STAGE_2_COMPLETION_REPORT.md` |
| Stage 2 audit | `conception/Stages/Stage 2/STAGE_2_FINAL_AUDIT.md` |

---

## Git Note

Changes are **not committed** unless explicitly requested by the Product Owner. Never commit `.env` files.

---

## Next Authorized Stage

**Stage 3 — Catalog / Marketplace** — **NOT AUTHORIZED**

**Do not implement:** products catalog API, cart, checkout, payments, orders, ledger, AI, media uploads, or business domains without explicit Product Owner authorization.

# Stage 2 — Identity & Access

> **Status:** COMPLETE / FINALIZED  
> **Audited:** 2026-08-16  
> **Next authorized stage:** Stage 3 — Catalog / Marketplace (**NOT AUTHORIZED**)

---

## Overview

Stage 2 delivers end-to-end identity, authentication, authorization, and frontend session integration for the DIYAR React SPA and Laravel API.

**Source of truth:** repository code + tests under `backend/tests/Feature/Api/V1/` and `frontend/src/**/*.test.ts*`.

---

## Documents

| Document | Purpose |
|----------|---------|
| [STAGE_2_IMPLEMENTATION_PLAN.md](./STAGE_2_IMPLEMENTATION_PLAN.md) | Phase map, schema, transaction design |
| [STAGE_2_COMPLETION_REPORT.md](./STAGE_2_COMPLETION_REPORT.md) | Final completion report |
| [STAGE_2_FINAL_AUDIT.md](./STAGE_2_FINAL_AUDIT.md) | Repository audit vs documentation |
| [STAGE_2_FRONTEND_INTEGRATION_REPORT.md](./STAGE_2_FRONTEND_INTEGRATION_REPORT.md) | SPA ↔ Sanctum integration details |
| [STAGE_2_AUTH_UX_LOCALIZATION_REPORT.md](./STAGE_2_AUTH_UX_LOCALIZATION_REPORT.md) | Auth UX, i18n, RBAC polish |

---

## Phase Index

| Phase | Folder | Status |
|-------|--------|--------|
| 2.1 | [Phase 2.1 — Identity Model](./Phase%202.1%20—%20Identity%20Model/README.md) | ✅ FINALIZED |
| 2.2 | [Phase 2.2 — Registration & OTP](./Phase%202.2%20—%20Registration%20&%20OTP/README.md) | ✅ FINALIZED |
| 2.3 | [Phase 2.3 — Authentication & Sessions](./Phase%202.3%20—%20Authentication%20&%20Sessions/README.md) | ✅ FINALIZED |
| 2.4 | [Phase 2.4 — Password Recovery](./Phase%202.4%20—%20Password%20Recovery/README.md) | ✅ FINALIZED |
| 2.5 | [Phase 2.5 — Roles & Authorization](./Phase%202.5%20—%20Roles%20&%20Authorization/README.md) | ✅ FINALIZED |
| 2.6 | [Phase 2.6 — Frontend Authentication](./Phase%202.6%20—%20Frontend%20Authentication/README.md) | ✅ FINALIZED |
| 2.7 | [Phase 2.7 — Security & UX Hardening](./Phase%202.7%20—%20Security%20&%20UX%20Hardening/README.md) | ✅ FINALIZED |
| 2.8 | [Phase 2.8 — Testing, Documentation & Finalization](./Phase%202.8%20—%20Testing,%20Documentation%20&%20Finalization/README.md) | ✅ FINALIZED |

---

## Related Architecture Docs

| Document | Path |
|----------|------|
| Authentication API | [`conception/API/AUTHENTICATION.md`](../../API/AUTHENTICATION.md) |
| SPA session ADR | [`conception/adr/ADR-007-spa-session-authentication.md`](../../adr/ADR-007-spa-session-authentication.md) |
| SMS provider | [`conception/API/providers/MSEGAT.md`](../../API/providers/MSEGAT.md) |
| Postman | [`conception/API/POSTMAN.md`](../../API/POSTMAN.md) |

---

## Verified Test Results (2026-08-16)

| Suite | Result |
|-------|--------|
| Backend PHPUnit | **41 / 41 passed** |
| Frontend Vitest | **36 / 36 passed** |
| TypeScript (`tsc --noEmit`) | **Pass** |
| ESLint | 4 warnings (react-refresh) — see [STAGE_2_FINAL_AUDIT.md](./STAGE_2_FINAL_AUDIT.md) |
| Prettier check | 9 files need format — non-blocking doc drift |

---

## Explicit Non-Goals (Stage 2)

- Catalog, products, cart, checkout, orders, payments, ledger
- Production MSEGAT credential deployment
- Email-based password reset links
- Role approval workflows (pending role status exists; approval UI deferred)

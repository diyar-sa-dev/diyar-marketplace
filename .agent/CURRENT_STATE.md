# CURRENT_STATE.md

> **Last updated:** 2026-08-18  
> **Maintained by:** AI development agents after each phase completion  
> **Canonical stage doc:** [conception/Stages/Stage 13/README.md](../conception/Stages/Stage%2013/README.md)

---

## Project

**DIYAR Marketplace** — Arabic RTL multi-vendor marketplace + **service marketplace (provider)** — Saudi Arabia · SAR · 15% VAT

---

## Stage Status

| Stage | Status |
|-------|--------|
| Stage 0 — Discovery & Architecture | **COMPLETE** |
| Stage 1 — Engineering Foundation | **COMPLETE** |
| Stage 2 — Identity & Access | **COMPLETE** |
| Stage 3 — User Profile & Media | **COMPLETE** |
| Stage 4 — Catalog & Products | **COMPLETE** |
| Stage 5 — Inventory | **COMPLETE** |
| Stage 5.5 — Storefront Integration | **COMPLETE** |
| Stage 6 — Cart & Checkout | **COMPLETE** |
| Stage 7 — Order Engine | **COMPLETE** |
| Stage 8 — Payments & Webhooks | **COMPLETE** |
| Stage 9 — Financial Ledger | **COMPLETE** |
| Stage 10 — Shipping | **COMPLETE** |
| Stage 11 — Returns & Refunds | **COMPLETE** |
| Stage 12 — Vendor Portal | **COMPLETE** |
| Stage 12.5 — Vendor Team & Engagement | **COMPLETE** (`6a2ceba`) |
| **Stage 13 — Service Marketplace (Provider)** | **IN PROGRESS** |

---

## Current Position

| Field | Value |
|-------|--------|
| **Current Stage** | **Stage 13 — Service Marketplace** |
| **Stage 13 status** | **IN PROGRESS** — Provider Portal integration **PENDING** (blocks sign-off) |
| **Branch** | `dev` |
| **HEAD** | `6a2ceba` — Stage 12 / 12.5 committed |
| **Working tree** | Stage 13 backend + customer UI **uncommitted** |

---

## Stage 13 — Completion Matrix

| Phase | Name | Status |
|-------|------|--------|
| 13.1 | Service Catalog | **COMPLETE** |
| 13.2 | Customer RFQ | **COMPLETE** |
| 13.3 | Provider Offers | **COMPLETE** (API + customer accept); provider UI **PENDING** |
| 13.4 | Booking | **COMPLETE** (API); provider UI **PENDING** |
| 13.5 | Service Payment | **COMPLETE** (dev simulate) |
| — | **Provider Portal** | **PENDING** — wire `ServiceClientRequests`, `ServiceClientRequestDetails`, `ServiceBookings` to `/dashboard/provider/*` |

**Do not mark Stage 13 COMPLETE until Provider Portal passes acceptance.**

---

## Stage 13 Flow (implemented in working tree)

```text
Catalog → RFQ → Provider offers → Customer accept → Payment (simulate) → Booking start/complete
```

**Docs:** `conception/Stages/Stage 13/` (phases 13.1–13.5, acceptance matrix, test results)

---

## Last Validation (2026-08-18)

| Check | Result |
|-------|--------|
| `vendor/bin/pint --test` | **PASS** |
| `php artisan test` | **345 / 345 PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run format:check` | **PASS** |
| `npm test` | **82 / 82 PASS** |
| `npm run build` | **PASS** |

**CI fix:** `DIYAR_MAIL_ENABLED=false` in `backend/phpunit.xml` for deterministic email OTP tests.

---

## Domain Split (important)

| Stage | Domain |
|-------|--------|
| **Stage 12 / 12.5** | **Vendor** — commerce, storefront, teams, preorders |
| **Stage 13** | **Provider / Service** — catalog, RFQ, offers, bookings, service payment |

---

## CI/CD

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — frontend typecheck, lint, prettier, vitest, build · backend pint, phpunit.

---

## Next Actions

1. Wire Provider Portal dashboard pages to existing `/dashboard/provider/*` APIs (preserve UI)
2. QA full provider flow end-to-end
3. Commit Stage 13 scope (see `STAGE_13_PROGRESS_REPORT.md` for recommended commit split)
4. Sign off Stage 13 → authorize Stage 14

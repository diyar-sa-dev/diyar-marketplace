# CURRENT_STATE.md

> **Last updated:** 2026-08-17 (Stage 7 final hardening)  
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
| Stage 3 — User Profile & Media | **COMPLETE / FINALIZED** |
| Stage 4 — Catalog & Products | **COMPLETE** |
| Stage 5 — Inventory | **COMPLETE** |
| Stage 5.5 — Storefront Integration | **COMPLETE** |
| Stage 6 — Cart | **COMPLETE / VERIFIED** *(uncommitted)* |
| **Stage 7 — Checkout & Order Engine** | **COMPLETE / PASS WITH BLOCKERS** *(uncommitted)* |

---

## Current Position

| Field | Value |
|-------|--------|
| **Current Stage** | Stage 7 — Checkout & Order Engine (implementation complete) |
| **Next stage** | Stage 8 — Payment Gateway |
| **Branch** | `dev` |
| **Blocker** | PO manual browser E2E smoke test recommended |

---

## Last Validation (2026-08-17 — Stage 7 final hardening)

| Check | Result |
|-------|--------|
| `php artisan test` | **178 / 178 PASS** |
| `php artisan migrate:fresh --seed` | **PASS** |
| `vendor/bin/pint --test` | **PASS** |
| `npm test -- --run` | **71 / 71 PASS** |
| `npx tsc --noEmit` | **PASS** |

---

## Stage 7 Highlights

- Server-authoritative checkout preview and order creation (BCMath VAT, no client totals)
- Per-vendor shipping: carrier flat rate + pickup; vendor settings persisted server-side
- Order hierarchy: Order → VendorOrder(s) → OrderItem(s) + Payment (pending) + Shipment stub
- Atomic order numbers via `order_number_sequences` (parallel process test added)
- Idempotency: `UNIQUE(user_id, idempotency_key)` with replay + 409 conflict
- Inventory reservation via existing `InventoryService`; cart converts to `converted` on success only
- Frontend: real API on CheckoutPage, OrdersPage, VendorOrders, VendorShippingSettingsPanel

**Checkout API:** `POST /checkout/preview`, `POST /orders`, `GET /orders`, `GET /orders/{order}`, `POST /orders/{order}/cancel`

**Vendor API:** `GET/PUT /dashboard/vendor/shipping-settings`, `GET /dashboard/vendor/orders`, accept action

---

## CI/CD

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — frontend + backend lint/test/build on push/PR.

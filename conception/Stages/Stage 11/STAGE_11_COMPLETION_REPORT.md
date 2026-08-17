# Stage 11 — Returns & Refunds Completion Report

> **Date:** 2026-08-17  
> **Stage 11.1 audit:** Hardened  
> **Decision:** STAGE 11 — APPROVED

---

## Stage 11.1 summary

Independent audit of the returns/refunds domain found and fixed several gaps without rewriting the architecture:

| Area | Issue found | Fix |
|------|-------------|-----|
| Policy snapshot | Flat snapshot from first item only | Structured `{ effective, items, frozen_at }` |
| Eligibility | Blocked after partial refund | Allow `partially_refunded` payments |
| Refund cap | No payment ceiling check | Reject when refund > remaining paid |
| Shipping | Used allocation shipping | Uses `vendor_orders.shipping_cost` snapshot |
| Rounding | Float cast in proportional calc | BCMath half-up via `roundMoney()` |
| Quantity race | No row lock | `lockForUpdate()` on order items |
| Evidence | Boolean `evidence_provided` only | File upload API + approve-time check |
| Product policy UI | Backend only | Vendor product edit section added |
| Customer UX | One-click return, no modal | Full return modal with policy summary |

---

## Verification

```text
php artisan test  → 254 passed (967 assertions)
npm run build     → success
```

New tests: `ReturnHardeningTest` (snapshot immutability, quantity exhaustion, non-returnable product, partial refund eligibility, VAT proportion), extended `EffectiveReturnPolicyServiceTest`.

---

## Current store policy (structured)

| Rule | Implementation |
|------|----------------|
| Return window | 7 days from delivery |
| Accepted reason | `manufacturing_defect` only |
| Warranty (5yr foam/wood, 1yr structure) | Separate — not return window |
| Shipping (free >3000 SAR Riyadh) | Stage 10 shipping — not return policy |

Configure via **Vendor Settings → Return Policy**.

---

## Manual order decision

| Item | Status |
|------|--------|
| Manual order UI | **REMOVED FROM V1** |
| Manual order API | **RETAINED (gated)** — 403 unless `DIYAR_MANUAL_ORDERS_API_ENABLED=true` |

---

## Acceptance matrix (Stage 11.1)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Policy hierarchy | PASS | `EffectiveReturnPolicyService`, unit tests |
| Platform baseline | PASS | `config/diyar.php` |
| Vendor policy | PASS | CRUD + settings UI |
| Product policy | PASS | DB + service + product edit UI |
| Policy snapshot | PASS | Structured snapshot + immutability test |
| Return eligibility | PASS | `ReturnEligibilityService`, feature tests |
| Return deadline | PASS | `delivered_at` + window |
| Reason validation | PASS | Enum + policy |
| Quantity validation | PASS | `ReturnedQuantityService` + lock + exhaustion test |
| Evidence | PASS | Upload API + approve gate |
| Return state machine | PASS | `ReturnStateService` |
| Customer authorization | PASS | `ReturnAuthorizationTest` |
| Vendor authorization | PASS | Policy + vendor scope |
| Full/partial/item/qty/vendor refund | PASS | `RefundCalculationService`, multi-vendor test |
| Payment integration | PASS | `PaymentGatewayInterface::refund()` |
| Ledger adjustment | PASS | `postRefund()` |
| VAT adjustment | PASS | Proportional historical test |
| Commission adjustment | PASS | Multi-vendor test |
| Vendor balance | PASS | Escrow/available bucket |
| Shipping refund | PASS | Historical VO shipping + full-return rule |
| Historical immutability | PASS | Snapshot + shipping snapshot test |
| Refund idempotency | PASS | `RefundIdempotencyTest` |
| Transaction safety | PASS | DB transaction in processing service |
| Multi-vendor isolation | PASS | `ReturnRefundMultiVendorTest` |
| Inventory | DEFERRED | Not wired to return flow |
| Customer UI | PASS | `CustomerReturnModal` |
| Vendor UI | PASS | Enhanced `VendorReturnsPage` |
| Product policy UI | PASS | `VendorProductFormModal` section |
| Evidence UI | PASS | Modal upload + vendor evidence list |
| Warranty management | DEFERRED | Fields preserved separately |
| Admin UI | DEFERRED | No admin returns shell |
| RTL/i18n | PASS | AR/EN keys |
| Database constraints | PASS | FKs, unique idempotency, restrictOnDelete |
| Backend tests | PASS | 254 tests |
| Frontend build | PASS | `npm run build` |
| Manual/E2E flow | PASS | Multi-vendor refund feature test |
| Manual order UI | PASS | Not exposed |
| Manual order API | PASS | Gated 403 default |
| MyFatoorah | DEFERRED | Stub |
| External return carriers | DEFERRED | Out of scope |

---

## Deferred (intentional)

- Inventory auto-restock on inspected returns
- MyFatoorah live refund + reconciliation outbox
- Admin returns UI
- Full warranty management platform
- Domain event notifications
- External RMA/carriers

---

## Stage 12 handoff

1. Wire inventory restoration on `inspected` when product is restockable
2. MyFatoorah refund with idempotent outbox
3. Admin returns list if admin module expands
4. Optional: refund estimate preview API for customer modal

See [STAGE_11_RETURNS_REFUNDS_ARCHITECTURE.md](./STAGE_11_RETURNS_REFUNDS_ARCHITECTURE.md).

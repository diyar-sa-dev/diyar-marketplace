# Stage 11 — Returns & Refunds Architecture

> **Status:** Hardened — Aug 2026 (Stage 11.1)

## Policy hierarchy

```text
Platform baseline (config: diyar.returns.platform_baseline)
  ↓
Vendor return policy (vendor_return_policies)
  ↓
Product override (products.return_* when return_policy_override_enabled)
```

`EffectiveReturnPolicyService` resolves field-by-field override (not blind merge).

**Example (current store policy):**

| Field | Vendor value |
|-------|----------------|
| returnable | true |
| return_window_days | 7 (from delivery) |
| accepted_reasons | manufacturing_defect only |
| warranty | separate domain — not used for return window |

## Policy snapshot (mandatory)

On `ReturnRequest` creation, the effective policy is frozen:

```json
{
  "effective": { "...policy fields used at refund time..." },
  "items": { "order_item_uuid": { "...per-item policy..." } },
  "frozen_at": "ISO8601"
}
```

Refund calculation reads `policy_snapshot.effective` — never today's vendor/product policy.

## Return eligibility

Server-side checks only:

- Order ownership
- Vendor order delivered + `delivered_at` deadline
- Payment `paid` or `partially_refunded`
- Product returnable + accepted reason
- Quantity ≤ remaining (non-rejected/non-cancelled returns)
- Row lock on `order_items` during create

## Refund calculation

`RefundCalculationService` uses historical data only:

| Component | Source |
|-----------|--------|
| Item subtotal | Frozen `ReturnItem.unit_price × qty` |
| VAT | Proportional share of `PaymentVendorAllocation.vat_amount` |
| Commission reversal | Proportional `platform_commission_amount` by gross ratio |
| Shipping | `vendor_orders.shipping_cost` snapshot — only when policy allows **and** full vendor-order return |

Rounding uses BCMath half-up to 2 decimals — no float arithmetic for money.

## Refund processing

`RefundProcessingService` (DB transaction):

1. Idempotency via `refunds.idempotency_key`
2. Cap: total refunded ≤ payment amount
3. Gateway refund (`PaymentGatewayInterface`)
4. `FinancialPostingService::postRefund()`
5. Payment + return state transitions

**Note:** External gateway refund occurs inside the transaction. Local/test gateway is safe; live MyFatoorah requires outbox/reconciliation pattern (DEFERRED).

## Evidence

- `return_evidence` table + `POST /returns/{id}/evidence`
- Reuses `MediaUploadService` validation
- Required evidence enforced at vendor **approve** (not boolean flag)

## Inventory

**DEFERRED** — no automatic restock on return. Future: `inspected → InventoryMovementType::Return`.

## Manual orders

- UI: removed from vendor orders
- API: `POST /dashboard/vendor/orders` gated by `DIYAR_MANUAL_ORDERS_API_ENABLED=false`

## API surface

**Customer:** `GET/POST /returns`, `POST /returns/{id}/evidence`, eligibility endpoint

**Vendor:** return policy CRUD, return workflow actions

## Frontend (Stage 11.1)

- Customer return modal (qty, reason, notes, evidence upload, policy summary)
- Vendor returns page with items, snapshot, evidence, refund breakdown
- Product edit: custom return policy override section

## Deferred

- MyFatoorah live refund
- Admin returns UI
- Full warranty management
- Inventory auto-restock
- External RMA/carriers
- Domain events/notifications

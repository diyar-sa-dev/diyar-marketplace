# Stage 9 — Commission Model

**Status:** IMPLEMENTED (V1)

---

## Principle

Commission is **configuration**, not a hard-coded constant. Historical commission is **snapshotted** at payment initiation and preserved in ledger entries.

---

## Commission Base

Per `COMMISSION_RULES.md` and implementation:

```text
platform_commission = sum(line_subtotal × applicable_rate) per vendor order line
vendor_payable = vendor_gross_total - platform_commission_amount
```

Where:

- `vendor_gross_total` = full vendor order total (subtotal + shipping + assembly + VAT − discount)
- Commission applies to **product subtotal (line_subtotal)**, not shipping/VAT

---

## Rule Storage

Table: `commission_rules`

| Field | Description |
|-------|-------------|
| scope | global, category, vendor, product, campaign |
| scope_id | nullable UUID for scoped rules |
| rate_percent | DECIMAL(5,2) |
| effective_from / effective_to | optional validity window |
| is_active | boolean |

---

## Precedence (per order line item)

```text
Product-specific rule
    ↓ (if none)
Category rule
    ↓ (if none)
Vendor rule
    ↓ (if none)
Global rule (required — seeded at 10%)
```

Campaign scope is reserved for future use.

---

## Snapshot Points

1. **Payment initiate:** `PaymentAllocationSnapshotService` computes commission via `CommissionResolver` and stores `platform_commission_amount` on `payment_vendor_allocations`
2. **Payment finalization:** `ensureSnapshotForPayment()` creates missing snapshots only — never overwrites existing rows. Ledger uses allocation snapshot — does not recalculate.
3. **Future rule changes:** Affect new payments only

---

## Ledger Entries

On paid payment, per allocation:

- `platform_commission` credit to `platform_commission` bucket
- Amount = frozen `platform_commission_amount` from allocation

---

## V1 Scope

| Implemented | Deferred |
|-------------|----------|
| Global rule (10% seed) | Campaign rules |
| Vendor override rules (schema ready) | Admin UI for rules |
| Category rules (schema ready) | Product rules UI |
| Product rules (schema ready) | Affiliate commission |
| Line-item resolution | Discount share split |

---

## Invariant

For each allocation:

```text
vendor_payable_amount + platform_commission_amount = vendor_gross_total
```

Enforced in `FinancialPostingService::assertAllocationIntegrity()`.

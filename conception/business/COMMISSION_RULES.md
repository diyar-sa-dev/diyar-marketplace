# Commission Rules

> **Status:** Baseline — Stage 0

## Principle

Commission rates are **configuration**, not hard-coded constants.

## Default

- Global platform commission: **10%** (initial seed value)
- Stored in `commission_rules` with `scope = global`

## Resolution Order (future-ready)

1. Product-specific rule (if exists)
2. Vendor-specific rule
3. Category-specific rule
4. Global rule

V1 may implement global + vendor overrides only.

## Calculation

```
platform_commission = vendor_subtotal * applicable_rate
vendor_net = vendor_subtotal - platform_commission - vendor_discount_share
```

Recorded as separate ledger entries on payment confirmation.

## Affiliate Commission

Deferred to V1.1 — separate transaction type `affiliate_commission`.

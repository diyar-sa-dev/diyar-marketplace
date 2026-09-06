# Phase 28.2 — Database Constraints & Referential Integrity

**Date:** 2026-08-27  
**Schema:** MariaDB `diyar`

---

## Constraint inventory

| Type | Count | Source |
|------|-------|--------|
| Foreign keys | **209** | `information_schema` via schema inventory |
| Indexes (distinct per table) | **350+** | statistics aggregation |
| Unique constraints | Embedded in migrations (e.g. `payments.order_id`, slugs) | migration files |

Full FK listing: `_db_schema_inventory.json` → `foreign_keys`

---

## Representative FK patterns

| Child | Parent | Delete rule (sample) |
|-------|--------|----------------------|
| `order_items` | `vendor_orders` | CASCADE |
| `order_items` | `products` | RESTRICT |
| `payments` | `orders` | CASCADE |
| `vendor_orders` | `orders` | CASCADE |
| `cart_items` | `carts` | CASCADE |
| `shipments` | `vendor_orders` | CASCADE |

Migration source: `2026_08_17_110000_create_order_domain_tables.php`

---

## Referential integrity testing

### Automated (PHPUnit)

Existing tests verify constraint behavior through application layer:

| Workflow | Test coverage | DB enforcement |
|----------|---------------|----------------|
| Order creation | `OrderCreationTest`, checkout tests | FK + transactions |
| Payment linkage | `PaymentFlowTest`, concurrency tests | Unique payment per order |
| Cart items | `CartTest` | FK to cart/product |
| Returns / refunds | `ReturnAuthorizationTest`, `RefundIdempotencyTest` | Multi-vendor integrity |
| Inventory | `InventoryTransactionAuditTest` | Quantity consistency |
| Bookings | `ProviderReviewAndDirectBookingTest` | Service FK chain |
| B2B | `B2bCompanyTest`, admin tests | Company isolation |

### Read-only probes (MariaDB dev)

| Probe | Result |
|-------|--------|
| Orphan `cart_items` | **0** — PASS |
| Orphan `order_items` (via `vendor_order_id`) | **NOT PROBED** (Phase 28.2 script used wrong column `order_id`) |
| Duplicate `order_number` | **0** groups — PASS |
| Negative inventory quantities | **0** — PASS |
| Negative order totals | **0** — PASS |

### Invalid parent insertion

**NOT TESTED** with raw SQL in Phase 28.2 — relies on PHPUnit + Laravel ORM. SQLite enforces FK when enabled (`DB_FOREIGN_KEYS=true` in phpunit).

---

## Cascade behavior verification

| Scenario | Expected | Tested |
|----------|----------|--------|
| Delete vendor_order → order_items | CASCADE | Via migration definition; implicit in order tests |
| Delete product with order_items | RESTRICT | **NOT explicitly probed** |
| Delete order → payment | CASCADE | Payment tests |
| Soft delete users | Application-level | Auth/account status tests |

---

## Monetary precision

| Table | Column | Type |
|-------|--------|------|
| `payments` | `amount` | decimal(12,2) |
| `orders` | `grand_total`, `subtotal` | decimal(12,2) |
| `order_items` | `unit_price`, `line_subtotal` | decimal(12,2) |
| `financial_transactions` | amount fields | decimal(12,2) |

**No floating-point columns** observed for money fields in probed tables.

---

## Unique constraints (critical)

| Constraint | Purpose |
|------------|---------|
| `payments.order_id` UNIQUE | One payment per order |
| Product/vendor slugs | Catalog uniqueness |
| Order numbers | Sequence-backed uniqueness (concurrency test) |
| Payment idempotency keys | Duplicate prevention (concurrency test) |

`OrderNumberConcurrencyTest` — verifies unique order numbers under concurrent creation.

---

## Referential integrity gate

```text
PARTIAL
```

**Evidence:** 209 FKs defined; sample integrity probes pass; full orphan/cascade matrix **NOT exhaustively tested** at SQL level.

**Gap:** Run corrected orphan probes on `order_items.vendor_order_id`, `payment_vendor_allocations`, chat/message chains before production.

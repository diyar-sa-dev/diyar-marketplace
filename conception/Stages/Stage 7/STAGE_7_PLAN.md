# Stage 7 — Checkout & Order Engine — Implementation Plan

> **Date:** 2026-08-17 (revised after PO plan review)  
> **Baseline:** Stage 6 complete (uncommitted on `dev`); Stage 4/5/5.5 at `74862a5`  
> **Inputs:** [STAGE_7_ENTRY_AUDIT.md](./STAGE_7_ENTRY_AUDIT.md), [STAGE_7_SHIPPING_DISCOVERY.md](./STAGE_7_SHIPPING_DISCOVERY.md) (**PO approved**)  
> **Scope:** Phases 7.1–7.4 + minimal vendor shipping configuration + frontend checkout/orders integration  
> **Out of scope:** Stage 8 payment gateway, coupon engine, Stage 10 carrier/rules engine, warehouse/radius delivery, service cart SKUs  
> **Status:** **PO plan review corrections applied — O1–O10 locked — awaiting final PO sign-off before implementation**

---

## PO Decisions (Locked)

| # | Decision | Choice |
|---|----------|--------|
| L1 | Financial authority | **Server-only** — never trust frontend subtotal, shipping, VAT, discount, total |
| L2 | Cart at checkout | Re-validate server cart; flush local-first cart sync before preview/order (frontend) |
| L3 | Inventory | Reuse `InventoryService::reserve/finalize/release` — **no duplicate reservation system** |
| L4 | Reservation timing | **Not at preview** — reserve only inside order-creation transaction |
| L5 | Coupons | **Disabled** — `discount_total = 0.00` always; no coupon CRUD/API |
| L6 | Assembly (Stage 7 V1) | **Extension point** — `assembly_total = 0.00` unless PO opens later |
| L7 | Payment (Stage 7) | Create payment record **`pending` only** — no gateway, no `paid` without Stage 8 |
| L8 | Order hierarchy | `Order` → `VendorOrder`(s) → `OrderItem`(s) + `Payment` + `Shipment` stub |
| L9 | Multi-vendor shipping | **Independent per `VendorOrder`** — not one global shipping fee |
| L10 | Shipping is required | **Not optional / not hardcoded zero globally** — server quotes from vendor config |
| L11 | Shipping V1 methods | **`carrier`** (flat-rate nationwide delivery) + **`pickup`** |
| L12 | Carrier APIs (SMSA, Aramex, …) | **Deferred** — flat rate represents “carrier delivery” in V1 |
| L13 | Warehouse / radius delivery | **Deferred** — not in V1 enum, schema, or checkout UI |
| L14 | Free-shipping threshold | **Supported** — vendor-level rule on carrier method |
| L15 | Vendor shipping config | **Persisted server-side** — minimal real API in Stage 7 |
| L16 | Shipping snapshots | **Snapshot method + amount on `VendorOrder`** at order creation |
| L17 | Shipping architecture | **Service/strategy boundary** — not logic inlined in checkout controller |
| L18 | Checkout auth | **`auth:sanctum` + `account.active`** — reservations require `User` |
| L19 | Idempotency | **Required** on order creation (`Idempotency-Key` header); **UNIQUE(`user_id`, `idempotency_key`)** |
| L20 | Money math | **BCMath**, scale 2, `decimal(12,2)` columns — no floats |
| L21 | Cart after order | Convert cart **inside** the order-creation transaction (final step before `COMMIT`); status → **`converted`**; on rollback cart stays **active** |
| L22 | Status changes | **Domain methods only** — no generic `PATCH { status }` from frontend |
| L23 | VAT base (O1) | **`subtotal + shipping + assembly - discount`**; Stage 7: assembly/discount = 0 → VAT on `(subtotal + shipping)` per vendor group, summed |
| L24 | Delivery selection (O2) | Customer selects **one method per vendor** represented in cart |
| L25 | Pickup model (O3) | Single **`pickup_location_label` string** — no branch table in Stage 7 |
| L26 | Missing shipping config (O4) | Checkout **fails** with `vendor_shipping_not_configured` — **no production fallback** |
| L27 | Shipping defaults (O5) | Seeder/dev defaults allowed; **production vendors must explicitly configure** valid settings before checkout |
| L28 | Order number (O6) | **`DYR-{YYYYMMDD}-{SEQUENTIAL}`** via **atomic sequence** — never `COUNT(*)` or race-prone `MAX()+1` |
| L29 | Cart status (O7) | Use **`converted`** on successful order |
| L30 | Reservation (O8) | Preserve existing **15-minute** policy; reserve **inside** order-creation workflow after InventoryService semantics verified |
| L31 | Partial checkout (O9) | **No partial checkout** — any vendor group failure fails entire order atomically |
| L32 | Assembly (O10) | **`0.00`** in Stage 7 — extension interface only |
| L33 | Pickup address | **`shipping_address_id` required for all V1 orders** (including pickup) — no separate billing/contact model in V1 |
| L34 | Payment transitions | Stage 7 may define full `PaymentStatus` guards but **only creates `pending`** — no paid/authorized endpoints or UI in Stage 7 |

---

## PO Decisions (Locked — O1–O10 Resolved)

| # | Decision | Locked choice |
|---|----------|---------------|
| O1 | VAT base | **`VAT = vat_rate × (subtotal + shipping + assembly - discount)`**; Stage 7: assembly = 0, discount = 0 → **`vat_rate × (subtotal + shipping)`** per vendor group, summed with deterministic rounding remainder |
| O2 | Per-vendor delivery method | Customer selects **one method independently for every vendor** in cart |
| O3 | Pickup branches | **Single `pickup_location_label` string** — no pickup branch table in Stage 7 |
| O4 | Missing vendor shipping config | **Fail checkout** — `vendor_shipping_not_configured`; no silent platform fallback in production |
| O5 | Default shipping settings | **Dev/demo seeder defaults only**; production vendors must **explicitly configure** valid settings before their products complete checkout |
| O6 | Order number format | **`DYR-{YYYYMMDD}-{SEQUENTIAL}`** with **concurrency-safe atomic sequence** |
| O7 | Cart status after order | **`converted`** |
| O8 | Reservation timeout | **Keep 15-minute** existing policy; reserve atomically with order creation per verified `InventoryService` semantics |
| O9 | Partial vendor checkout | **Not allowed** — entire order fails if any vendor group fails |
| O10 | Assembly | **`0.00`** — extension interface only |

---

## Domain Overview

```text
Cart (active)
    ↓ checkout preview (read-only)
CheckoutPreview
    ├── cart validation
    ├── vendor groups
    ├── per-vendor shipping quotes (ShippingQuoteService)
    ├── assembly (0), discount (0), VAT (VatCalculator)
    └── totals

    ↓ POST /orders (single DB transaction — Idempotency-Key required)
Order (+ UNIQUE(user_id, idempotency_key))
├── customer (user_id)
├── shipping_address_id + field snapshots (required — including pickup)
├── financial snapshots (subtotal, shipping_total, assembly_total, discount_total, vat_amount, grand_total)
├── status (OrderStatus)
├── Payment (pending only — Stage 7)
└── VendorOrder[]
      ├── vendor_account_id
      ├── delivery_method snapshot (enum)
      ├── shipping_cost snapshot
      ├── pickup_location_label snapshot (nullable)
      ├── item subtotals + vendor total
      ├── status (VendorOrderStatus)
      ├── OrderItem[] (product snapshots)
      └── Shipment (stub, pending — Phase 7.4)

    ↓ same transaction, final step before COMMIT
Cart.status → converted (items cleared); on rollback → cart stays active
```

---

## Shipping Subdomain (Stage 7 V1)

### Design principle

Shipping calculation lives behind an extensible boundary:

```text
ShippingQuoteService
    └── ShippingMethodStrategy (interface)
            ├── CarrierFlatRateStrategy   ← V1
            ├── PickupStrategy            ← V1
            └── (future) WarehouseRadiusStrategy, CarrierApiStrategy, …
```

**Controllers must not embed shipping math.**

---

### Shipping method enum / domain representation

**Backend enum:** `App\Enums\ShippingMethod`

| Value | Meaning | V1 |
|-------|---------|-----|
| `carrier` | Nationwide flat-rate delivery (stands in for carrier companies) | **Yes** |
| `pickup` | Customer collects from vendor pickup location | **Yes** |
| `warehouse_local` | Radius/city-based own delivery | **Deferred** — not in enum until PO authorizes |

**Rules:**

- Enum is used in: vendor settings (enabled flags), checkout request (customer selection), `vendor_orders.shipping_method` snapshot.
- Invalid enum values → validation error (Form Request).
- Requesting a method not **enabled** in vendor settings → `422` domain error `shipping_method_not_available`.

---

### Shipping settings schema

**Table:** `vendor_shipping_settings`

One row per `vendor_account` (1:1). UUID PK. **No auto-created production defaults** — see **O5**: seeder may insert dev/demo rows; production vendors configure via dashboard API before checkout eligibility.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `vendor_account_id` | uuid FK UNIQUE → `vendor_accounts` | cascade delete |
| `carrier_enabled` | boolean | default `false` |
| `carrier_flat_rate` | decimal(12,2) | required if `carrier_enabled`; min 0 |
| `carrier_free_shipping_enabled` | boolean | default `false` |
| `carrier_free_shipping_threshold` | decimal(12,2) nullable | required if free shipping enabled; min 0 |
| `pickup_enabled` | boolean | default `false` |
| `pickup_location_label` | string(255) nullable | e.g. "الفرع الرئيسي (الرياض)" — V1 single branch label |
| `timestamps` | | |

**Constraints (application + validation):**

- At least **one** of `carrier_enabled`, `pickup_enabled` must be `true` for checkout eligibility.
- If `carrier_enabled`: `carrier_flat_rate` required.
- If `carrier_free_shipping_enabled`: `carrier_free_shipping_threshold` required.
- **No warehouse columns in V1.**

**Future Stage 10 extension (not migrated now):**

- Separate `shipping_methods`, `shipping_rules`, `pickup_branches` tables.
- V1 table remains; strategies can read new tables without breaking snapshots.

---

### Vendor authorization

| Action | Rule |
|--------|------|
| Read/update own shipping settings | Vendor user owns `vendor_account` **or** admin |
| Read another vendor's settings | **Denied** (403) |
| Checkout preview/order | Customer auth only — reads settings **internally** for quote, never exposes raw vendor config of other vendors beyond enabled methods + quoted price |

**Implementation:**

- `VendorShippingSettingsPolicy` (or extend `VendorAccountPolicy`).
- Service method `assertVendorOwnership(User, VendorAccount)`.
- Dashboard routes: `middleware('role:vendor,admin')` + policy on `vendor_account_id`.

---

### Shipping settings API

**Base:** `/api/v1/dashboard/vendor/shipping-settings`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/shipping-settings` | vendor, admin | Resolve settings for authenticated vendor's account |
| PUT | `/shipping-settings` | vendor, admin | Upsert settings (full replacement of shipping fields) |

**Request body (PUT):**

```json
{
  "carrier_enabled": true,
  "carrier_flat_rate": "28.00",
  "carrier_free_shipping_enabled": true,
  "carrier_free_shipping_threshold": "300.00",
  "pickup_enabled": true,
  "pickup_location_label": "الفرع الرئيسي (الرياض)"
}
```

**Response:** `VendorShippingSettingsResource` — never expose internal IDs of other vendors.

**Frontend:** Wire `VendorSettings.tsx` shipping tab to this API (Phase 7.1 or dedicated 7.1a sub-phase).

**Validation:** `UpdateVendorShippingSettingsRequest` — cross-field rules above.

---

### Checkout shipping selection contract

**Endpoint:** `POST /api/v1/checkout/preview`  
**Auth:** required

**Request:**

```json
{
  "shipping_address_id": "uuid",
  "vendor_delivery_selections": [
    {
      "vendor_account_id": "uuid",
      "method": "carrier"
    },
    {
      "vendor_account_id": "uuid",
      "method": "pickup"
    }
  ]
}
```

| Field | Rules |
|-------|-------|
| `shipping_address_id` | Required for **all** orders including pickup (L33); must belong to authenticated user (`AddressService`) |
| `vendor_delivery_selections` | Required array; **exactly one entry per vendor** represented in cart |
| `vendor_account_id` | Must match a vendor group derived from cart |
| `method` | `carrier` \| `pickup`; must be enabled in vendor settings |

**Missing/extra vendor entries → `422 checkout_incomplete_delivery_selections`.**

**Order creation (`POST /api/v1/orders`)** uses the **same payload** plus idempotency header. Server **recalculates** preview internally — does not trust client totals.

---

### Per-vendor quote calculation

**Service:** `ShippingQuoteService::quoteVendorGroup(VendorShippingSettings, ShippingMethod, vendorSubtotal): ShippingQuote`

**Input `vendorSubtotal`:** BCMath string — sum of line subtotals for that vendor from **current server prices** (same basis as checkout preview).

#### Carrier (`carrier`)

```text
IF NOT carrier_enabled → throw ShippingMethodNotAvailable

IF carrier_free_shipping_enabled
   AND bccomp(vendorSubtotal, threshold, 2) >= 0
THEN shipping_cost = "0.00"
ELSE shipping_cost = carrier_flat_rate
```

#### Pickup (`pickup`)

```text
IF NOT pickup_enabled → throw ShippingMethodNotAvailable

shipping_cost = "0.00"
```

**Output DTO:**

```json
{
  "method": "carrier",
  "shipping_cost": "28.00",
  "free_shipping_applied": false,
  "pickup_location_label": null
}
```

(pickup includes `pickup_location_label` from settings for display)

**Multi-item / multi-vendor:** Quote is **per vendor group**, not per cart item. Free-shipping threshold compares to **vendor subtotal only**.

---

### Free-shipping threshold behavior

| Rule | Detail |
|------|--------|
| Scope | **Vendor-level** — each vendor's subtotal evaluated independently |
| Applies to | **`carrier` method only** |
| When | `carrier_free_shipping_enabled = true` and `vendorSubtotal >= threshold` |
| Result | `shipping_cost = 0.00`, flag `free_shipping_applied: true` in preview |
| Pickup | Never affected by free-shipping threshold |
| Snapshot | Store final **charged** shipping on `vendor_orders.shipping_cost` (0.00 if free shipping applied) |

---

### Pickup behavior (V1)

| Aspect | Behavior |
|--------|----------|
| Cost | Always **0.00** |
| Location | Single `pickup_location_label` from vendor settings |
| Checkout | Customer selects `pickup` per vendor if enabled |
| Snapshot | Copy `pickup_location_label` to `vendor_orders.pickup_location_label` at order time |
| Address | **`shipping_address_id` is required for all V1 orders, including pickup.** V1 has no separate billing/contact-address model; the shipping address serves as the customer contact/fulfillment reference on the order snapshot. Pickup does not validate geo radius in V1. |

**No pickup branch table in Stage 7 (O3).** Future multi-branch support adds tables in Stage 10 without mutating historical snapshots.

---

### Multi-vendor behavior

```text
Cart items → group by product.vendor_account_id
For each vendor group G:
  1. Validate products/vendors (CartValidationService rules)
  2. Require delivery selection in request
  3. Load VendorShippingSettings for G.vendor_account_id
  4. Quote shipping for selected method
  5. Accumulate vendor_subtotal, shipping, VAT slice, vendor_total

Order.shipping_total = SUM(vendor_orders.shipping_cost)
Order.subtotal = SUM(vendor line subtotals)
```

**Invariants (tests required):**

```text
order.subtotal = SUM(order_items.line_subtotal)
order.shipping_total = SUM(vendor_orders.shipping_cost)
SUM(vendor_order.vendor_total) reconciles with order.grand_total
  ± explicit rounding policy (see below)
```

**Partial checkout (O9):** If **any** vendor group fails validation, shipping quote, or inventory reservation, the **entire** checkout/order creation fails — no partial orders.

**Partial fulfillment / cancel sibling vendor orders:** deferred to Phase 7.4 rules — one vendor cancel does not auto-cancel others (`ORDER_RULES.md`).

---

### Shipping snapshots on VendorOrder

At order creation, persist on `vendor_orders`:

| Column | Type | Source |
|--------|------|--------|
| `shipping_method` | string (enum) | Customer selection (validated) |
| `shipping_cost` | decimal(12,2) | Quoted amount at commit time |
| `pickup_location_label` | string nullable | From settings if method=pickup, else null |
| `free_shipping_applied` | boolean | From quote result (carrier only) |

**Historical integrity:** Later changes to `vendor_shipping_settings` **must not** alter existing `vendor_orders`.

**Display:** Use `shipping_method` enum + i18n translation at read time — **do not** add `shipping_method_label` snapshot column in V1.

---

### Rounding / BCMath rules

| Rule | Standard |
|------|----------|
| Library | `bcadd`, `bcsub`, `bcmul`, `bccomp` — scale **2** |
| Storage | `decimal(12,2)` — always two fractional digits in API (`"28.00"`) |
| Line subtotal | `bcmul(unit_price, qty, 2)` per item |
| Vendor subtotal | `bcadd` of line subtotals |
| VAT (O1 locked) | Per vendor group: `vat = bcmul(vat_rate, bcadd(subtotal, shipping, 2), 2)` then `order.vat_amount = SUM(vendor.vat_amount)` with **deterministic remainder** assignment if needed (e.g. last vendor group absorbs ±0.01) |
| Rounding remainder | Document chosen remainder rule in code + test — must be deterministic |

**Never use PHP float arithmetic for money.**

---

### Failure behavior — invalid / missing shipping configuration

| Condition | HTTP | Code / message key |
|-----------|------|---------------------|
| No `vendor_shipping_settings` row | 422 | `vendor_shipping_not_configured` |
| Both methods disabled | 422 | `vendor_shipping_not_configured` |
| Customer selects disabled method | 422 | `shipping_method_not_available` |
| Carrier enabled but invalid rate/threshold | 422 | validation errors on settings save |
| Vendor inactive / product invalid | 422 | existing cart validation issues |
| Empty cart | 422 | `cart_empty` |

**No silent fallback to platform default in production (O4/O5).** Dev/demo environments may seed default settings for local testing only.

**Vendor dashboard:** Settings validation prevents saving invalid combinations.

---

### Stage 10 extension point

```text
ShippingQuoteService
  → resolves ShippingMethodStrategy by ShippingMethod enum
  → V1: CarrierFlatRateStrategy, PickupStrategy
  → Stage 10: add CarrierApiStrategy, WeightBasedStrategy, ZoneStrategy
         without changing VendorOrder snapshot columns or checkout contract
```

**Deferred tables:** `shipping_methods`, `shipping_rules`, `shipping_rates`, carrier credentials — Stage 10.

**V1 `vendor_shipping_settings` remains** the configuration source until PO migrates to rules engine.

---

## Phase 7.1 — Vendor Shipping Settings + Checkout Preview

### Goals

1. Persist vendor shipping settings (schema + API + policy + tests).
2. Wire vendor dashboard shipping tab to API.
3. Implement `ShippingQuoteService` + strategies (carrier, pickup).
4. Implement `CheckoutPreviewService` with full server totals including **non-zero shipping**.
5. Implement `VatCalculator` + config (`diyar.tax.vat_rate`).
6. Assembly stub (`0.00`), discount stub (`0.00`).

### Backend deliverables

| Component | Path pattern |
|-----------|--------------|
| Migration | `vendor_shipping_settings` |
| Model | `VendorShippingSettings` |
| Enum | `ShippingMethod` |
| Strategies | `Services/Shipping/Strategies/*` |
| Services | `ShippingQuoteService`, `CheckoutPreviewService`, `VatCalculator` |
| Controller | `CheckoutController@preview` |
| Controller | `Dashboard/VendorShippingSettingsController` |
| Requests | `UpdateVendorShippingSettingsRequest`, `CheckoutPreviewRequest` |
| Resources | `CheckoutPreviewResource`, `VendorShippingSettingsResource` |
| Lang | `diyar.checkout.*`, `diyar.shipping.*` |
| Config | `diyar.tax.vat_rate`, `diyar.shipping.default_carrier_flat_rate` (**dev/demo seeder only — O5**) |

### API

| Method | Path | Auth |
|--------|------|------|
| GET | `/dashboard/vendor/shipping-settings` | vendor, admin |
| PUT | `/dashboard/vendor/shipping-settings` | vendor, admin |
| POST | `/checkout/preview` | customer |

### Preview response shape

```json
{
  "valid": true,
  "cart": { "...": "..." },
  "validation": { "...": "CartValidationService" },
  "vendor_groups": [
    {
      "vendor_account_id": "uuid",
      "vendor_name": "...",
      "items": [ "..." ],
      "subtotal": "450.00",
      "available_methods": ["carrier", "pickup"],
      "selected_method": "carrier",
      "shipping": {
        "method": "carrier",
        "cost": "0.00",
        "free_shipping_applied": true
      },
      "assembly": "0.00",
      "discount": "0.00",
      "vat": "67.50",
      "vendor_total": "517.50"
    }
  ],
  "totals": {
    "subtotal": "450.00",
    "shipping": "0.00",
    "assembly": "0.00",
    "discount": "0.00",
    "vat": "67.50",
    "total": "517.50"
  }
}
```

*(VAT example uses O1 locked formula: 15% on subtotal + shipping per vendor group.)*

### Frontend deliverables

| Component | Action |
|-----------|--------|
| `api/shippingSettings.ts` | GET/PUT vendor shipping settings |
| `api/checkout.ts` | POST preview |
| `VendorSettings.tsx` shipping tab | Replace mock with controlled form + save |
| `CheckoutPage.tsx` | Replace mock cart/totals; address from `useAddresses`; per-vendor method selector; display API totals only |
| i18n | `checkout.*`, `shipping.*` keys AR/EN |

### Phase 7.1 tests (minimum)

| Area | Cases |
|------|-------|
| Settings CRUD | vendor can save/load; validation failures; non-owner denied |
| Carrier quote | flat rate applied |
| Free shipping | subtotal ≥ threshold → 0.00 |
| Pickup quote | always 0.00 |
| Multi-vendor | two vendors, independent shipping lines |
| Missing settings | checkout blocked |
| Disabled method selected | 422 |
| Preview | inactive product, price drift, insufficient stock |
| BCMath | totals reconcile |

### Phase 7.1 quality gate

```bash
php artisan test --filter=Shipping
php artisan test --filter=CheckoutPreview
vendor/bin/pint --test
npm test -- --run
npx tsc --noEmit
```

---

## Phase 7.2 — Multi-Vendor Order Model & Split

### Goals

1. Create order domain schema with vendor split and **shipping snapshot columns**.
2. Implement pure split/aggregation logic (no payment/reservation yet).
3. Align preview vendor groups with persisted model shape.

### Database schema

#### `orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `order_number` | string UNIQUE | human-readable — see **Order number generation (O6)** |
| `status` | string | `OrderStatus` enum |
| `shipping_address_id` | uuid FK | **required** — including pickup orders (O33) |
| `shipping_recipient_name` | string | **snapshot** |
| `shipping_phone` | string | snapshot |
| `shipping_city` | string | snapshot |
| `shipping_district` | string | snapshot |
| `shipping_street` | string | snapshot |
| `shipping_building` | string nullable | snapshot |
| `shipping_apartment` | string nullable | snapshot |
| `subtotal` | decimal(12,2) | |
| `shipping_total` | decimal(12,2) | |
| `assembly_total` | decimal(12,2) | default 0 |
| `discount_total` | decimal(12,2) | default 0 |
| `vat_amount` | decimal(12,2) | |
| `grand_total` | decimal(12,2) | |
| `idempotency_key` | string nullable | part of **UNIQUE(`user_id`, `idempotency_key`)** |
| `timestamps` | | |

**Index/constraint:** `UNIQUE(user_id, idempotency_key)` — same user + same key replays; different users may reuse the same key string independently.

#### Order number generation (O6)

Format: **`DYR-{YYYYMMDD}-{SEQUENTIAL}`** (e.g. `DYR-20260817-000042`).

**Requirement:** Use a **concurrency-safe atomic sequence** — e.g. dedicated `order_number_sequences` table with row lock, or database sequence/atomic counter per day.

**Forbidden:** `COUNT(orders)`, `MAX(order_number)+1`, or any read-then-write pattern without locking.

Implementation detail chosen in Phase 7.2/7.3 — must pass concurrent order creation tests.

#### `vendor_orders`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `order_id` | uuid FK | |
| `vendor_account_id` | uuid FK | |
| `status` | string | `VendorOrderStatus` |
| `subtotal` | decimal(12,2) | |
| `shipping_method` | string | enum snapshot |
| `shipping_cost` | decimal(12,2) | snapshot |
| `pickup_location_label` | string nullable | snapshot |
| `free_shipping_applied` | boolean | snapshot |
| `assembly_cost` | decimal(12,2) | default 0 |
| `discount_amount` | decimal(12,2) | default 0 |
| `vat_amount` | decimal(12,2) | |
| `vendor_total` | decimal(12,2) | |
| `timestamps` | | |

#### `order_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `vendor_order_id` | uuid FK | |
| `product_id` | uuid FK | reference only |
| `product_name` | string | snapshot |
| `product_slug` | string nullable | snapshot |
| `unit_price` | decimal(12,2) | snapshot |
| `quantity` | unsigned int | |
| `line_subtotal` | decimal(12,2) | |
| `color_name` | string nullable | snapshot |
| `color_hex` | char(7) nullable | snapshot |
| `timestamps` | | |

### Services

- `OrderSplitService` — cart → vendor groups (reuse preview grouping)
- `OrderTotalsReconciliationService` — assert financial invariants

### Phase 7.2 tests

- Split 1 vendor / N vendors
- Snapshot fields populated from product at split time
- Shipping columns nullable only before order commit (always set on create)
- Invariant tests (subtotals sum)

---

## Phase 7.3 — Atomic Order Creation

### Prerequisite: InventoryService transaction verification (required before coding)

Before implementing Phase 7.3, **verify and document** existing `InventoryService::reserve()` behavior:

| Question | Action |
|----------|--------|
| Does `reserve()` use the caller's DB connection/transaction? | Read `InventoryService.php` + `InventoryReservationTest` |
| Do nested `DB::transaction()` calls roll back reservations on outer failure? | **Do not assume** — prove with integration test |
| Are row locks (`lockForUpdate`) held for the full order transaction? | Confirm or adjust call order |
| On rollback, are `inventory_reservations` rows and `reserved_quantity` fully restored? | Required invariant |

**Outcome:** Phase 7.3 completion report must state verified semantics. If nested transactions are unsafe, **flatten to a single outer transaction** or invoke reserve only after validation with explicit compensating `release()` on failure — still **reuse `InventoryService`**, do not duplicate reservation logic.

**Reservation policy (O8):** Keep `diyar.inventory.reservation_timeout_minutes` = **15**. Reservations created during order commit use existing TTL; no separate checkout hold window in Stage 7.

### Cart finalization (L21 / O7 — locked)

**Choice: inside the atomic transaction (Option A).**

Cart conversion is the **last mutating step before `COMMIT`**, after order rows, items, reservations, and payment record are written. If anything fails, the transaction rolls back and the cart remains **`active`** with items intact.

```text
… create Payment (pending)
… convert cart: delete items OR clear lines, set cart.status = converted
COMMIT
```

**Not used in V1:** post-commit cart cleanup as a separate idempotent job (Option B) — avoids orphan orders with unconverted carts and removes dual-path complexity.

### Transaction boundary (single outer `DB::transaction`)

```text
BEGIN
  1. Resolve idempotency: UNIQUE(user_id, idempotency_key) → return existing order if replay (no duplicate reserve)
  2. Load + lock active user cart
  3. Validate address ownership (shipping_address_id required — O33)
  4. Run CheckoutPreviewService (internal — same logic as preview endpoint)
  5. Abort if !valid, any vendor group failure (O9), or shipping quote failures
  6. Allocate order_number (atomic sequence — O6)
  7. Create Order (+ address field snapshots)
  8. Create VendorOrders (+ shipping snapshots per group)
  9. Create OrderItems (price/name/color snapshots)
 10. For each in-stock line: InventoryService::reserve(product, user, qty, reference: Order)
 11. Create Payment (status: pending ONLY — amount = grand_total)
 12. Convert cart (status = converted, clear items)  ← final step before commit
COMMIT
```

**On any failure:** full rollback — **no partial order**, cart stays **active**, no `converted` status, reservations rolled back per verified InventoryService semantics.

**Post-commit:** return order resource + payment pending payload (no further cart mutation).

### Idempotency interaction

| Aspect | Behavior |
|--------|--------|
| Header | `Idempotency-Key: {uuid}` **required** on `POST /orders` |
| Storage | **`UNIQUE(user_id, idempotency_key)`** on `orders` (composite unique — not global key uniqueness) |
| Replay | Same **user** + same key → return **existing order** (`200`/`201`) without duplicate reserve or cart mutation |
| Different user, same key string | **Allowed** — keys are scoped per user |
| Same user, same key, different payload | **409** `idempotency_key_conflict` |
| TTL | Optional cleanup job for orphaned keys without orders — defer |

Shipping amounts on replay: return **original snapshots** — no recalculation.

### API

| Method | Path | Auth |
|--------|------|------|
| POST | `/orders` | customer + Idempotency-Key |

### Phase 7.3 tests

| Area | Cases |
|------|-------|
| Happy path | single + multi vendor |
| Rollback | reservation failure → no order rows; cart remains active |
| Cart | **`converted` only inside successful commit**; unchanged on failure |
| Idempotency | double POST → one order |
| Concurrency | two users competing for last stock |
| Shipping snapshot | mutating vendor settings after order does not change order |
| Payment | created **pending only** — no paid/authorized transition in Stage 7 |

---

## Phase 7.4 — State Machines & Read APIs

### Enums (controlled transitions)

**OrderStatus:** `pending` → `confirmed` | `cancelled`; `confirmed` → `processing` | `cancelled`; `processing` → `completed` | `cancelled`

**VendorOrderStatus:** `pending` → `accepted` | `cancelled`; `accepted` → `processing`; `processing` → `shipped`; `shipped` → `delivered`; cancel rules explicit

**PaymentStatus:** Full enum + transition guards may be **defined** in Phase 7.4 for future use:

`pending` → `authorized` | `failed`; `authorized` → `paid`; `paid` → `partially_refunded` | `refunded`; etc.

**Stage 7 runtime constraint (locked):**

- Order creation **only** inserts `Payment` with **`status = pending`**
- **No** API endpoint, job, or frontend action in Stage 7 may set `authorized`, `paid`, `failed`, or refund states
- Gateway-driven transitions are **Stage 8** exclusively

**ShipmentStatus:** stub record + enum; transitions `pending` → `prepared` → `shipped` → … — no carrier integration

### Services

- `OrderStateService`, `VendorOrderStateService`, `PaymentStateService`, `ShipmentStateService`
- Illegal transition → domain exception → 422

### Authorization

- `OrderPolicy` — customer owns order
- `VendorOrderPolicy` — vendor owns vendor_order via `vendor_account.user_id`

### APIs

| Method | Path | Role |
|--------|------|------|
| GET | `/orders` | customer |
| GET | `/orders/{order}` | customer |
| POST | `/orders/{order}/cancel` | customer (rules TBD) |
| GET | `/dashboard/vendor/orders` | vendor |
| GET | `/dashboard/vendor/orders/{vendorOrder}` | vendor |
| POST | `/dashboard/vendor/orders/{vendorOrder}/accept` | vendor |
| … | explicit actions only | |

### Frontend

- Replace `OrdersPage.tsx`, `VendorOrders.tsx` mocks with TanStack Query + real APIs.

---

## Assembly & Discount (Stage 7)

| Component | Stage 7 behavior |
|-----------|------------------|
| **Discount / coupons** | Always `0.00`; no inputs honored |
| **Assembly** | `AssemblyCalculator` interface; returns `0.00`; checkout UI toggles **hidden or disabled** with “Stage 7 not available” — do not fake prices |

---

## VAT Configuration (O1 locked)

**Formula:**

```text
vendor_vat_base = vendor_subtotal + vendor_shipping + vendor_assembly - vendor_discount
Stage 7: vendor_assembly = 0, vendor_discount = 0
→ vendor_vat = vat_rate × (vendor_subtotal + vendor_shipping)
order.vat_amount = SUM(vendor_vat)  (+ deterministic rounding remainder)
```

**Config (`config/diyar.php`):**

```php
'tax' => [
    'vat_rate' => env('DIYAR_VAT_RATE', '0.15'), // string for BCMath
],
```

**Service:** `VatCalculator` — reads rate from config only; computes **per vendor group** then sums.

---

## Cart Integration

| Step | Behavior |
|------|----------|
| Pre-preview | Frontend `cartSync.flush()` |
| Preview | Server loads cart by user (not guest checkout in V1) |
| Validation | Reuse `CartValidationService` |
| Post-order success | Inside order transaction: cart **`converted`**, items cleared (O7) |
| Post-order failure | Cart remains **`active`** — no partial conversion |

**CartStatus enum extension:** add **`converted`** for successfully checked-out carts.

**Guest checkout:** **Out of scope** — auth required (inventory + addresses).

---

## Frontend Architecture Summary

| Module | Files |
|--------|-------|
| Shipping settings | `api/shippingSettings.ts`, hooks, types |
| Checkout | `api/checkout.ts`, `api/orders.ts`, hooks |
| Types | `types/order.ts`, `types/shipping.ts` |
| Pages | `CheckoutPage`, `OrdersPage`, `VendorOrders`, `VendorSettings` |

**Rule:** Display totals exclusively from API responses.

---

## Test Matrix (Stage 7 Complete)

### Shipping settings

- [ ] Vendor save/load own settings
- [ ] Non-vendor denied
- [ ] Cross-vendor IDOR denied
- [ ] Validation: carrier enabled requires rate
- [ ] Validation: free shipping requires threshold
- [ ] At least one method enabled

### Shipping quotes

- [ ] Carrier flat rate
- [ ] Free shipping at threshold (equal and above)
- [ ] Below threshold — full rate
- [ ] Pickup zero cost
- [ ] Method not enabled → error
- [ ] Missing vendor settings → error

### Checkout preview

- [ ] Empty cart
- [ ] Invalid address / wrong owner
- [ ] Inactive product/vendor
- [ ] Price drift flagged
- [ ] Insufficient stock
- [ ] Multi-vendor independent shipping
- [ ] Totals reconcile (BCMath)

### Order creation

- [ ] Single vendor
- [ ] Multi vendor
- [ ] Shipping snapshots immutable
- [ ] Inventory reserved + linked to order
- [ ] Reservation failure rolls back
- [ ] Cart cleared on success only
- [ ] Idempotent replay (same user + key)
- [ ] Idempotency scoped per user (different users, same key string)
- [ ] Concurrent order_number generation (O6)
- [ ] Partial vendor failure rolls back entire order (O9)

### Authorization

- [ ] Customer cannot read others' orders
- [ ] Vendor cannot read others' vendor orders

### State machines

- [ ] Valid transitions succeed
- [ ] Invalid transitions rejected

### Frontend

- [ ] Preview loading/error/success
- [ ] API totals rendered (no local VAT math)
- [ ] Per-vendor method selection
- [ ] Vendor settings save

---

## Implementation Sequence (Recommended)

```text
Step 1 — Phase 7.1a: vendor_shipping_settings migration + API + dashboard wire-up
Step 2 — Phase 7.1b: ShippingQuoteService + CheckoutPreviewService + preview API + tests
Step 3 — Phase 7.2: order schema + order number sequence + split services + invariant tests
Step 4 — Phase 7.3 prep: verify InventoryService transaction semantics (document in report)
Step 5 — Phase 7.3: OrderCreationService + idempotency + reservation + cart converted + tests
Step 6 — Phase 7.4: state machines + list/show APIs + vendor dashboard orders
Step 7 — Frontend: checkout + orders pages
Step 8 — Full regression + docs (STAGE_7_COMPLETION_REPORT.md)
```

**Do not skip 7.1a** — preview requires persisted vendor settings per PO.

---

## Documentation Deliverables (Per Phase)

```text
conception/Stages/Stage 7/Phase 7.1/PHASE_7.1_COMPLETION_REPORT.md
conception/Stages/Stage 7/Phase 7.2/PHASE_7.2_COMPLETION_REPORT.md
conception/Stages/Stage 7/Phase 7.3/PHASE_7.3_COMPLETION_REPORT.md
conception/Stages/Stage 7/Phase 7.4/PHASE_7.4_COMPLETION_REPORT.md
conception/Stages/Stage 7/STAGE_7_COMPLETION_REPORT.md
```

Update `.agent/CURRENT_STATE.md` and `README.md` after stage verification.

---

## Intentionally Deferred

| Item | Target |
|------|--------|
| SMSA / Aramex / carrier API integration | Stage 10 |
| Weight / dimension / distance shipping | Stage 10 |
| Warehouse local delivery + radius | Post-V1 (UI mock disabled) |
| Pickup branch CRUD (multi-branch) | Stage 10 or V1.1 |
| Coupon engine | Future |
| Payment gateway + webhooks | Stage 8 |
| Commission ledger / payouts | Stage 9 |
| Returns / refunds | Stage 11 |
| Guest checkout | Out of scope |
| Service order lines | Out of scope |

---

## Stop Point

**This document is the Stage 7 plan only.**

- ✅ PO plan review corrections applied (2026-08-17)
- ✅ O1–O10 **locked**
- ❌ No application code implemented
- ❌ Phase 7.1 not started

**Awaiting final Product Owner sign-off** before implementation begins.

---

*Plan authored 2026-08-17 from approved entry audit + shipping discovery. Revised 2026-08-17 after PO plan review corrections.*

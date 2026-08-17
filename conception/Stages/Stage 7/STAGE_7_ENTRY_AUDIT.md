# Stage 7 — Checkout & Order Engine — Entry Audit (Step 1)

> **Date:** 2026-08-17  
> **Branch:** `dev`  
> **Baseline:** Stage 4/5/5.5 at `74862a5`; Stage 6 complete (uncommitted on `dev`)  
> **Authorization:** Stage 7 authorized by PO prompt  
> **Scope:** Audit only — **no application code modified**

---

## 1. Executive Summary

Stage 7 is **greenfield for orders, payments, shipments, checkout preview, and financial engines**. The repository provides **strong, verified foundations** from Stages 4–6:

| Foundation | Readiness for Stage 7 |
|------------|----------------------|
| Cart (server-authoritative + validation) | **Ready** — extend totals, wire to checkout |
| Inventory reservations (`reserve` / `finalize` / `release`) | **Ready** — morph reference hook exists |
| Addresses (CRUD + default) | **Ready** — not yet wired to checkout UI |
| Product/vendor visibility rules | **Ready** — reused by cart validation |
| Auth (Sanctum SPA + `account.active`) | **Ready** — checkout must be authenticated |
| BCMath money conventions | **Ready** — extend to full checkout totals |
| Frontend cart (TanStack Query + local-first sync) | **Ready with sync caveats** — must flush before preview/order |

**Not present:** `orders`, `vendor_orders`, `order_items`, `payments`, `shipments`, checkout routes, VAT/shipping/assembly services, order policies, checkout API client, real checkout/orders UI.

**Verdict:** **No critical architectural conflict blocks Stage 7.** Conception documents (`DATABASE_DESIGN.md`, `API_SPECIFICATION.md`) describe target shapes but **diverge from implemented conventions** (UUIDs vs integers, `vendor_accounts` vs `vendor_profile_id`, service SKUs vs products-only cart). Implementation must follow **actual code patterns**, not outdated spec literals.

**Coupons:** Explicitly **DISABLED** in Stage 7 per PO — architecture docs still mention coupons; Stage 7 must expose `discount = 0` and reject/ignore coupon inputs.

---

## 2. Current Architecture Overview

### 2.1 Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Backend | Laravel 13, PHP 8.3 | API prefix `/api/v1` in `bootstrap/app.php` |
| Frontend | React 19, TypeScript, Vite | SPA, Arabic RTL + English LTR |
| Auth | Sanctum SPA (session cookies) | CSRF via `/sanctum/csrf-cookie` |
| Data | MySQL (local), SQLite (CI tests) | UUID PKs domain-wide |
| State (FE) | TanStack Query | Cart uses local-first overlay (post–Stage 6) |
| Quality | PHPUnit, Vitest, Pint, ESLint, Prettier | CI: `.github/workflows/ci.yml` |

### 2.2 Service-layer pattern (established)

```text
Route → FormRequest → Controller (thin) → Domain Service → Model
                      ↓
                 API Resource → ApiResponse envelope
```

Examples: `CartController` → `CartService`; `AddressController` → `AddressService`; `VendorProductController` → `ProductService` + `ProductPolicy`.

### 2.3 API envelope

`App\Support\Api\ApiResponse`:

```json
{ "success": true, "data": { ... }, "message": "...", "meta": { ... } }
{ "success": false, "message": "...", "errors": { ... } }
```

### 2.4 Exception handling

`backend/bootstrap/app.php` maps:

| Exception | HTTP | Usage today |
|-----------|------|-------------|
| `NotFoundHttpException` | 404 | Missing cart item, address |
| `AuthenticationException` | 401 | Unauthenticated |
| `AuthorizationException` | 403 | Policy failures |
| `InvalidArgumentException` | 400 | Cart/inventory domain errors |
| `QueryException` | 500 | Reported, generic message |

Stage 7 should add **domain-specific exceptions** (or dedicated validation messages) for checkout/order state errors — not rely on generic 400 strings alone.

---

## 3. Current Cart Architecture (Stage 6)

### 3.1 Database

**Migration:** `backend/database/migrations/2026_08_17_080000_create_carts_table.php`

| Table | Key columns |
|-------|-------------|
| `carts` | UUID PK, `user_id` (nullable), `session_id`, `status`, `merged_at` |
| `cart_items` | UUID PK, `cart_id`, `product_id`, `quantity`, `unit_price_snapshot decimal(12,2)`, `color_name`, `color_hex`, unique `(cart_id, product_id, color_name)` |

**Cart status enum:** `active`, `merged`, `abandoned` (`App\Enums\CartStatus`).

**Note:** `2026_08_17_090000_add_color_to_cart_items_table.php` alters columns already present in `080000`. On **fresh migrate**, `090000` is redundant and may fail on duplicate columns unless reconciled before Stage 7 migrations ship.

### 3.2 Backend services

| Service | Responsibility |
|---------|----------------|
| `CartService` | Resolve guest/user cart (`lockForUpdate`), add/update/remove/clear, subtotal via `bcmul`/`bcadd`, stock checks for `InStock` |
| `CartMergeService` | Guest → user merge by `(product_id, color_name)`, cap qty, mark guest cart `merged` |
| `CartValidationService` | Per-item: active product/vendor, price drift (`bccomp`), stock/preorder; totals: **subtotal only** — shipping/tax/total `null` |

### 3.3 Cart API (`backend/routes/api.php`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/cart` | Optional (session or user) |
| DELETE | `/cart` | Optional |
| POST | `/cart/items` | Optional |
| PATCH | `/cart/items/{item}` | Optional |
| DELETE | `/cart/items/{item}` | Optional |
| POST | `/cart/validate` | Optional |
| POST | `/cart/merge` | **Required** (`auth:sanctum` + `account.active`) |

### 3.4 Cart totals (current)

```text
subtotal     → calculated (BCMath)
discount     → null
shipping     → null
tax          → null
total        → null
```

Returned by `CartResource` and `CartValidationService::pendingTotals()`.

### 3.5 Frontend cart (Stage 6 + post-completion enhancement)

| File | Role |
|------|------|
| `frontend/src/hooks/cart/cartLocal.ts` | Optimistic cart, `localStorage` key `diyar:cart:v1`, line key = `product_id::color` |
| `frontend/src/hooks/cart/cartSync.ts` | Debounced API sync (750ms qty, 200ms remove) |
| `frontend/src/hooks/cart/useCart.ts` | Local-first mutations; background reconcile |
| `frontend/src/api/cart.ts` | REST client |
| `frontend/src/components/modals/CartSidebar.tsx` | Real cart UI; calls `cartSync.flush()` before `/checkout` |

**Stage 7 implication:** Checkout preview and order placement **must not trust local cart state**. Always:

1. `cartSync.flush()` (frontend)
2. Server-side cart load + validation (backend)
3. Authoritative preview/order from DB

Local item IDs (`local:...`) must be synced before any checkout API call.

---

## 4. Current Inventory Architecture (Stage 5)

### 4.1 Tables

| Table | Purpose |
|-------|---------|
| `product_inventory` | `stock_quantity`, `reserved_quantity`, `available_quantity` (unsigned int) |
| `inventory_reservations` | Pending/finalized/released/expired; morph `reference_type`/`reference_id` |
| `inventory_movements` | Audit trail (reservation, sale, release, etc.) |

### 4.2 InventoryService (`backend/app/Services/Catalog/InventoryService.php`)

| Method | When to use |
|--------|-------------|
| `reserve(Product, User, qty, reference[])` | **Order creation** — locks stock, creates `Pending` reservation |
| `finalize(Reservation, ?User)` | After payment success — decrements stock, clears reservation |
| `release(Reservation, ?User, status)` | Cancel/timeout — restores reserved qty |
| `releaseExpiredReservations()` | Scheduled command every minute |

**Critical rules:**

- `reserve()` requires authenticated `User` — **guest checkout cannot reserve** without auth change
- Preorder: `affects_inventory = false` — reservation record only, no stock lock
- Reference morph: `['type' => Order::class, 'id' => $orderId]` — **ready for Stage 7**
- Concurrency: row locks + `lockForUpdate`; test `test_competing_reservations_cannot_over_allocate_stock` proves over-allocation prevention

**Stage 7 must NOT duplicate reservation logic.** Call `InventoryService::reserve()` inside order-creation transaction.

### 4.3 Cart vs checkout inventory boundary (locked PO decision)

| Operation | Inventory mutation |
|-----------|-------------------|
| Cart add/update | Read `available_quantity` only |
| Cart validate / checkout preview | Read only — **no reserve** |
| Order creation | **`reserve()` then link to order** |
| Payment success (Stage 8) | **`finalize()`** |
| Order cancel / payment fail | **`release()`** |

---

## 5. Product & Vendor Architecture (Stage 4/5.5)

### 5.1 Product (`App\Models\Product`)

- UUID PK, soft deletes
- `sale_price` / `compare_price`: `decimal(12,2)`
- Enums: `ProductStatus` (draft/active/archived), `AvailabilityMode` (in_stock/out_of_stock/preorder), `ProductType` (single/bundle)
- Relations: `vendorAccount`, `category`, `colors`, `images`, `inventory`
- Scope: `scopePubliclyVisible()` — active product + active vendor

### 5.2 VendorAccount (`App\Models\VendorAccount`)

- UUID PK, slug auto-generated
- Enum: `VendorAccountStatus` (pending/active/suspended)
- Relation: `products`
- **No assembly pricing, shipping rules, or coupon tables exist**

### 5.3 Product colors

- `product_colors` table: display/selection only
- Cart stores `color_name` + `color_hex` snapshot on line item
- Order items should snapshot color in relational columns (not JSON-only) for historical truth

### 5.4 Policies

| Policy | Scope |
|--------|-------|
| `ProductPolicy` | Vendor owns product or admin |
| `VendorAccountPolicy` | Vendor owns account or admin |
| `CategoryPolicy` | Admin only |

**No `OrderPolicy` / `VendorOrderPolicy`** — Stage 7 must add.

---

## 6. Address Architecture (Stage 3)

### 6.1 Model & service

- `App\Models\Address` — UUID, `AddressType` (home/work), structured Saudi-style fields, `is_default`
- `AddressService` — ownership checks, single-default enforcement with row locks

### 6.2 API (authenticated)

```text
GET/POST        /api/v1/profile/addresses
GET/PATCH/DELETE /api/v1/profile/addresses/{address}
POST            /api/v1/profile/addresses/{address}/default
```

Middleware: `auth:sanctum` + `account.active`

### 6.3 Checkout gap

- `CheckoutPage.tsx` uses `MOCK_ADDRESSES`
- Real CRUD exists at `/profile/addresses` via `useAddresses()` hooks
- **No address picker component** shared with checkout
- Checkout preview should accept `shipping_address_id` and **snapshot address fields on order** (not rely on mutable address row alone)

---

## 7. Orders / Payments / Shipments — Current State

### 7.1 Backend

**Zero implementation:**

- No models, migrations, controllers, services, routes, policies, or tests for orders/payments/shipments
- `grep Payment|VendorOrder|Shipment` in `backend/` → no matches

### 7.2 Conception target (not yet code)

From `conception/architecture/DATABASE_DESIGN.md` and `conception/PLAN.md`:

```text
Order
 ├── VendorOrder (per vendor)
 │    ├── OrderItems (with snapshots)
 │    ├── shipping_cost, assembly_cost, discount_amount
 │    └── fulfillment status
 └── Payment (1:1 with order in design doc)
```

**Naming recommendation for implementation:** Use `vendor_orders` (matches PLAN.md) and `vendor_account_id` FK (matches existing `vendor_accounts` table — **not** `vendor_profile_id` from old DATABASE_DESIGN).

### 7.3 Payment abstractions

- **No** `PaymentGatewayInterface`, providers, or webhooks
- Stage 8 in PLAN.md owns gateway integration
- Stage 7 should create **payment domain record** with status `pending` and a **mock/development adapter** interface — no live gateway

### 7.4 Frontend mock pages (must be replaced in Stage 7)

| Page | Path | Status |
|------|------|--------|
| `CheckoutPage.tsx` | `/checkout` | 100% mock — hardcoded VAT 15%, shipping, coupons, cart |
| `OrdersPage.tsx` | `/orders` | 100% mock |
| `VendorOrders.tsx` | `/dashboard/vendor/orders` | 100% mock (in-memory state) |

---

## 8. Financial Fields & Conventions

### 8.1 Database precision

- Money: `decimal(12, 2)` on products, cart items
- Dimensions: `decimal(8, 2)` on products

### 8.2 Runtime arithmetic

- **BCMath** with scale 2: `bcmul`, `bcadd`, `bccomp`
- Cast prices to `(string)` before BC functions
- Return formatted strings (`'100.00'`)
- **No Money value object** — extend existing string/decimal pattern

### 8.3 VAT (Saudi Arabia)

- README states VAT 15%
- **No** `config/tax.php` or `VatService` in codebase
- Mock checkout hardcodes `0.15`
- Stage 7: add `config/diyar.php` tax section (e.g. `vat_rate`) + `VatCalculator` service — **never scatter literal `0.15`**

### 8.4 Shipping & assembly

- PLAN.md Stage 10 describes full shipping domain — **not implemented**
- Stage 7 minimum: `ShippingQuoteService` / `ShippingCalculator` extension point with **configurable flat rate per vendor** or zero/pending
- Assembly: **no product-level assembly flag or price in DB** — mock UI toggles per item. Stage 7 should add explicit extension point; safest V1: `assembly = 0` unless product/vendor rules added in same phase

### 8.5 Discounts / coupons

- **DISABLED in Stage 7**
- `discount_total = 0.00` always
- Do not create coupon tables, CRUD, or active UI
- Reserve nullable columns / extension hooks for future vendor coupons per PO

---

## 9. UUID & Status Conventions

### 9.1 UUID pattern (all domain models)

```php
use HasUuids;
public $incrementing = false;
protected $keyType = 'string';
```

Migrations: `$table->uuid('id')->primary()`, `$table->foreignUuid(...)`.

### 9.2 Existing enums (`backend/app/Enums/`)

| Enum | Values |
|------|--------|
| `CartStatus` | active, merged, abandoned |
| `ReservationStatus` | pending, finalized, released, expired |
| `ProductStatus` | draft, active, archived |
| `AvailabilityMode` | in_stock, out_of_stock, preorder |
| `VendorAccountStatus` | pending, active, suspended |
| `UserStatus` | pending, active, suspended |

**Stage 7 must add:** `OrderStatus`, `VendorOrderStatus`, `PaymentStatus`, `ShipmentStatus` — backed enums matching PO state machines.

---

## 10. Authorization & Security Patterns

### 10.1 Middleware stack

```text
auth:sanctum → account.active → role:vendor,admin (dashboard)
```

Cart routes: mostly **unauthenticated** (session-based guest cart).

**Stage 7 recommendation:** Checkout preview + order creation under `auth:sanctum` + `account.active` (reservations require `User`; frontend already uses `ProtectedRoute` on `/checkout`).

### 10.2 IDOR prevention today

- Cart: `findItemForCart` verifies `item.cart_id === cart.id`
- Address: `AddressService::assertOwnership`
- Vendor products: `ProductPolicy`

**Stage 7 must add:**

- Customer sees own orders only
- Vendor sees own `vendor_orders` only
- No generic `PATCH /orders/{id} { status }` — domain actions only

### 10.3 Rate limiting

- Auth routes: `throttle:auth`, `throttle:otp`
- Cart/checkout: **no throttle yet** — consider on `POST /orders` for abuse prevention

---

## 11. Testing Patterns

### 11.1 Backend

- `RefreshDatabase` on feature tests
- `Tests\Concerns\InteractsWithIdentity` — roles, Sanctum stateful session, CSRF, OTP helpers
- Stateful cart tests: `postStatefulJson`, cookie persistence
- Service tests: direct `InventoryService` calls + `expectException(InvalidArgumentException)`

**Relevant existing tests:**

| File | Coverage |
|------|----------|
| `tests/Feature/Api/V1/Cart/CartTest.php` | Guest/auth cart, merge, validation, IDOR, colors |
| `tests/Feature/Api/V1/Catalog/InventoryReservationTest.php` | reserve/finalize/release/concurrency/preorder |
| `tests/Feature/Api/V1/Profile/AddressTest.php` | Address CRUD, default logic |

### 11.2 Frontend

- Vitest + Testing Library
- `useCart.test.ts`, `cartLocal.test.ts` — cart optimistic behavior
- **No checkout/order tests**

### 11.3 CI gaps

- CI uses SQLite in-memory — no `migrate:fresh --seed` job
- Local validation (2026-08-17): 156 PHPUnit, 67 Vitest — all pass

---

## 12. Frontend Data-Fetching Patterns

| Pattern | Example |
|---------|---------|
| Query keys | `cartKeys`, `profileKeys`, `productKeys` |
| API module | `frontend/src/api/{domain}.ts` |
| Hooks | `frontend/src/hooks/{domain}/use*.ts` |
| Mutations | Invalidate or setQueryData on success |
| CSRF | `ensureCsrfCookie()` before mutations |
| i18n | `frontend/src/lib/i18n/locales/{ar,en}.ts` |

**Checkout i18n today:** Only `checkout.stage7MockTitle/Description` — full checkout namespace needed.

---

## 13. Configuration (`config/diyar.php`)

Current keys:

```php
'inventory.reservation_timeout_minutes' => 15
'cart.max_quantity_per_item' => 99
```

**Missing for Stage 7:**

```php
'tax' => ['vat_rate' => 0.15]           // example — use env-backed config
'shipping' => [...]                     // flat rate / per-vendor defaults
'assembly' => [...]                     // enabled flag, default cost
'orders' => ['idempotency_ttl_minutes' => ...]
```

---

## 14. Documentation vs Repository Drift

| Topic | Conception doc | Actual code | Stage 7 action |
|-------|----------------|-------------|----------------|
| Primary keys | Integer IDs in API_SPEC | UUID everywhere | Use UUID |
| Vendor FK | `vendor_profile_id` | `vendor_account_id` | Use `vendor_accounts` |
| Cart line key | `attributes` JSON | `color_name`, `color_hex` columns | Snapshot same on order items |
| Cart item types | product + service | Products only | Keep products-only |
| Checkout path | `POST /checkout` | No route | Add `/checkout/preview` + order create (align with PLAN) |
| Coupons in preview request | `coupon_code` in API_SPEC | N/A | **Reject/ignore — disabled** |
| Payment status | pending, paid, failed... | N/A | Add `authorized`, `partially_refunded` per PO |
| Stage 6 cart unique | `(cart_id, product_id)` in completion report | `(cart_id, product_id, color_name)` | Update docs when reconciling |

**No blocking conflict** — implement using code conventions; treat conception docs as **intent**, not literal schema.

---

## 15. Reusable Components

| Component | Reuse in Stage 7 |
|-----------|------------------|
| `CartService` / `CartValidationService` | Preview input validation |
| `InventoryService::reserve/finalize/release` | Order creation / cancel |
| `AddressService` + ownership | Shipping address validation |
| `Product::scopePubliclyVisible()` | Purchasability checks |
| `ApiResponse` + Form Requests + Resources | New checkout/order endpoints |
| `InteractsWithIdentity` + stateful session tests | Checkout/order feature tests |
| BCMath subtotal logic | Extend to VAT/shipping/total |
| `cartSync.flush()` | Pre-checkout frontend gate |
| `ProtectedRoute` on `/checkout` | Matches auth requirement |
| Reservation morph reference | Link reservation → order |
| Scheduled `inventory:release-expired` | Handles abandoned checkout reservations |

---

## 16. Missing Components (Stage 7 Greenfield)

### Backend

- Migrations: `orders`, `vendor_orders`, `order_items`, `payments`, `shipments` (+ address snapshot columns)
- Enums: order/vendor-order/payment/shipment statuses
- Services: `CheckoutPreviewService`, `OrderCreationService`, `OrderSplitService`, `VatCalculator`, `ShippingQuoteService`, `AssemblyCalculator` (stub), `PaymentService` (record-only)
- Controllers: `CheckoutController`, `OrderController`, vendor order dashboard endpoints
- Policies: `OrderPolicy`, `VendorOrderPolicy`
- Idempotency mechanism (header or client key table)
- Domain exceptions + lang keys
- State transition services (no raw status PATCH)

### Frontend

- `api/checkout.ts`, `api/orders.ts`
- `types/order.ts`, hooks `useCheckoutPreview`, `usePlaceOrder`
- Replace mock `CheckoutPage`, `OrdersPage`, `VendorOrders`
- Address picker (reuse `useAddresses`)
- i18n for checkout/orders
- Gate on sync + validation before place order

---

## 17. Risk Register

### 17.1 Security & authorization

| Risk | Severity | Mitigation |
|------|----------|------------|
| Frontend price/total manipulation | **Critical** | Server-only calculations; ignore client amounts |
| IDOR on orders | **Critical** | Policies + user/vendor scoping on every query |
| Arbitrary status update API | **High** | Domain transition methods only |
| Guest order without reservation integrity | **High** | Require auth for checkout (matches inventory API) |
| Payment marked paid without gateway | **High** | Stage 7: payment stays `pending`; Stage 8 authorizes |

### 17.2 Data integrity & financial

| Risk | Severity | Mitigation |
|------|----------|------------|
| Rounding drift multi-vendor split | **High** | BCMath; explicit reconciliation tests; allocate remainder to last vendor or platform line |
| Partial order on failed transaction | **Critical** | Single DB transaction wrapping reserve + order + payment record |
| Orphan reservations | **High** | Link morph on reserve; release on rollback/cancel; reuse expiry job |
| Historical order depends on live product | **High** | Snapshot name, price, color, vendor on `order_items` |
| Duplicate orders on double-submit | **High** | Idempotency key on `POST /orders` |

### 17.3 Concurrency

| Risk | Severity | Mitigation |
|------|----------|------------|
| Two checkouts exhaust same stock | **Critical** | `InventoryService::reserve` inside transaction (proven in tests) |
| Cart changed during checkout | **Medium** | Re-validate cart at preview + order creation |
| Local cart out of sync | **Medium** | Mandatory flush; server cart is source of truth at checkout |

### 17.4 Migration & ops

| Risk | Severity | Mitigation |
|------|----------|------------|
| Duplicate cart color migration | **Medium** | Squash/remove `090000` or make idempotent before release |
| CI lacks MySQL-specific constraints | **Low** | Run local `migrate:fresh --seed` before stage sign-off |
| Reservation timeout (15 min) during slow checkout | **Medium** | Document; extend timeout config if needed; refresh reservation on order create |

### 17.5 Frontend synchronization

| Risk | Severity | Mitigation |
|------|----------|------------|
| User sees local subtotal ≠ server preview | **Medium** | Preview API overwrites display; show loading state |
| Place order with `local:` item IDs | **High** | Block submit until `cartSync.flush()` completes |
| Mock coupon UI misleads users | **Low** | Remove/disable coupon inputs in Stage 7 UI |

### 17.6 Architectural / scope

| Risk | Severity | Mitigation |
|------|----------|------------|
| Scope creep into Stage 8 payments | **High** | Payment record only; mock provider interface |
| Building full shipping platform | **High** | Flat-rate extension point only |
| Implementing coupons | **High** | PO explicit disable |
| JSON blob order storage | **Medium** | Relational financial columns per vendor order |

---

## 18. Proposed Safe Architecture (Compatible with Repository)

No redesign required. Extend established patterns:

```text
POST /checkout/preview   [auth]
  → CheckoutPreviewService
      → load user cart (active)
      → CartValidationService (reuse)
      → group items by vendor_account_id
      → ShippingQuoteService (per vendor)
      → AssemblyCalculator (stub → 0)
      → DiscountService (stub → 0)
      → VatCalculator (config rate, BCMath)
      → return preview DTO (no DB writes, no reserve)

POST /orders             [auth + idempotency key]
  → OrderCreationService (@transaction)
      → validate cart + address ownership
      → recalculate preview (authoritative)
      → create Order + VendorOrders + OrderItems (snapshots)
      → InventoryService::reserve(each line, reference Order)
      → create Payment (status pending)
      → mark cart cleared/abandoned
      → return order + payment

State changes:
  → OrderStateService::confirm|cancel|...
  → VendorOrderStateService::accept|ship|...
  → PaymentStateService (Stage 7: pending only transitions stubbed for Stage 8)
```

**Cart after success:** Mark cart non-active or delete items (prefer explicit status — align with `CartStatus::Abandoned` or new `converted` if needed).

**Idempotency:** Store `idempotency_keys` table `(user_id, key, order_id)` with TTL; return same order on replay.

---

## 19. API Conventions (Recommended)

Follow existing style:

```text
POST /api/v1/checkout/preview     auth:sanctum, account.active
POST /api/v1/orders               auth:sanctum, account.active + Idempotency-Key header
GET  /api/v1/orders               auth:sanctum, account.active
GET  /api/v1/orders/{order}       auth:sanctum, account.active + policy
POST /api/v1/orders/{order}/cancel auth:sanctum, domain method

GET  /api/v1/dashboard/vendor/orders           role:vendor
GET  /api/v1/dashboard/vendor/orders/{id}      role:vendor + ownership
POST /api/v1/dashboard/vendor/orders/{id}/accept  explicit action
```

Use Form Requests, API Resources, `__('diyar.checkout.*')` lang keys.

---

## 20. CI / Quality Tooling

| Gate | Command | Stage 7 expectation |
|------|---------|-------------------|
| Backend tests | `php artisan test` | Add checkout/order suites; keep 156+ green |
| Pint | `vendor/bin/pint --test` | New PHP must pass |
| Frontend tests | `npm test -- --run` | Add checkout hook tests |
| Typecheck | `npx tsc --noEmit` | New types for orders |
| Build | `npm run build` | Checkout page compiles |
| Lint/format | `npm run lint`, `format:check` | Pass |
| DB | `php artisan migrate:fresh --seed` | New migrations must be clean |

---

## 21. Stage 7 Phase Mapping (Implementation Plan Input)

| Phase | Deliverable | Depends on |
|-------|-------------|------------|
| **7.1** | Checkout preview API + VAT/shipping/assembly stubs + tests | Cart validation, config |
| **7.2** | Order schema + multi-vendor split logic + preview vendor groups | 7.1 calculators |
| **7.3** | Atomic order creation + inventory reserve + payment record + cart finalize + idempotency | 7.2 schema, InventoryService |
| **7.4** | State machines (order, vendor order, payment, shipment) + policies + vendor/customer APIs | 7.3 |
| **Frontend** | Replace checkout/orders mocks, wire preview/place order | 7.1–7.4 APIs |

---

## 22. Intentionally Deferred (Not Stage 7)

| Item | Stage |
|------|-------|
| Live payment gateway (Moyasar/HyperPay/Tap) | Stage 8 |
| Webhooks, redirect URLs, capture | Stage 8 |
| Coupon engine / vendor coupons | Future (disabled in 7) |
| Full shipping rules / carriers / zones | Stage 10 |
| Commission ledger / payouts | Stage 9 |
| Returns/refunds | Stage 11 |
| Service marketplace order lines | Out of scope (products-only cart) |
| Platform affiliate / auto seasonal discounts | Not authorized |

---

## 23. Audit Conclusion

| Question | Answer |
|----------|--------|
| Can Stage 7 proceed? | **Yes** |
| Critical architectural conflict? | **None** — conception doc drift is manageable |
| Blockers before coding? | Reconcile redundant cart migration; confirm PO on flat shipping/assembly V1 defaults |
| Primary integration points | Cart validation, InventoryService reserve, Address ownership, BCMath, Sanctum auth |
| Highest risk areas | Atomic transactions, idempotency, financial reconciliation, IDOR, local cart sync at checkout |

**Next step (Step 2):** Create `STAGE_7_PLAN.md` with phased migrations, API contracts, test matrix, and explicit "coupons disabled" / "payment pending only" decisions — then begin **Phase 7.1 Checkout Preview** without modifying unrelated modules.

---

## 24. Key File Index

| Area | Path |
|------|------|
| Cart services | `backend/app/Services/Cart/` |
| Inventory service | `backend/app/Services/Catalog/InventoryService.php` |
| Cart routes | `backend/routes/api.php` L42–49, L73 |
| Address service | `backend/app/Services/Profile/AddressService.php` |
| Config | `backend/config/diyar.php` |
| API envelope | `backend/app/Support/Api/ApiResponse.php` |
| Exceptions | `backend/bootstrap/app.php` |
| Cart tests | `backend/tests/Feature/Api/V1/Cart/CartTest.php` |
| Reservation tests | `backend/tests/Feature/Api/V1/Catalog/InventoryReservationTest.php` |
| Frontend cart | `frontend/src/hooks/cart/` |
| Mock checkout | `frontend/src/pages/CheckoutPage.tsx` |
| Order design (intent) | `conception/architecture/DATABASE_DESIGN.md` §3.5 |
| API design (intent) | `conception/architecture/API_SPECIFICATION.md` §6 |
| Stage 6 baseline | `conception/Stages/Stage 6/STAGE_6_COMPLETION_REPORT.md` |
| Project plan | `conception/PLAN.md` §Stage 7 |

---

*Audit performed against live repository inspection. Application code was not modified.*

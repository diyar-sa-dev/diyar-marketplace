# Stage 6 — Cart — Completion Report

> **Date:** 2026-08-17  
> **Baseline:** Stage 4/5/5.5 at `74862a5`  
> **Verdict:** **COMPLETE / VERIFIED**

---

## Summary

Stage 6 replaces the mock client-only cart with a **server-authoritative** cart system:

- Guest carts bound to Laravel session
- Authenticated carts bound to `user_id` (persist after logout)
- Guest → user merge on login / OTP verification
- Cart validation (no inventory reservation)
- Frontend wired via TanStack Query + cart API

**Stage 7 (checkout/orders/payment) was not implemented.**

---

## Phases

| Phase | Scope | Status |
|-------|--------|--------|
| 6.1 | Guest cart | **DONE** |
| 6.2 | Authenticated cart | **DONE** |
| 6.3 | Cart merge | **DONE** |
| 6.4 | Cart validation | **DONE** |
| Frontend | Mock replacement | **DONE** |

---

## Database

### `carts`

- `id` UUID PK
- `user_id` nullable FK → users
- `session_id` nullable string (guest)
- `status` (`active`, `merged`, `abandoned`)
- `merged_at` nullable timestamp
- Indexes: `(user_id, status)`, `(session_id, status)`

### `cart_items`

- `id` UUID PK
- `cart_id` FK → carts
- `product_id` FK → products
- `quantity` unsigned int
- `unit_price_snapshot` decimal(12,2)
- Unique: `(cart_id, product_id)`

---

## API (`/api/v1/cart`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/cart` | Session | Resolve guest or user cart |
| DELETE | `/cart` | Session | Clear cart |
| POST | `/cart/items` | Session | `{ product_id, quantity? }` |
| PATCH | `/cart/items/{item}` | Session | `{ quantity }` |
| DELETE | `/cart/items/{item}` | Session | Remove line |
| POST | `/cart/validate` | Session | Validation snapshot |
| POST | `/cart/merge` | Sanctum | Merge guest → user |

Totals return **subtotal only**; `discount`, `shipping`, `tax`, `total` are `null`.

---

## Security

- Server-side price from `sale_price`; client price ignored
- IDOR: cart items resolved via authenticated/session context only
- Quantity bounds via config `diyar.cart.max_quantity_per_item`
- Transactions + `lockForUpdate` on cart mutations
- Unique `(cart_id, product_id)` prevents duplicate lines
- Merge is idempotent (guest cart marked `merged`)
- No inventory `reserve()` during cart operations

---

## Frontend

| Removed | Replaced with |
|---------|----------------|
| `CartContext` SEED / client prices | `useCart` + `/api/v1/cart` |
| Client VAT (15%) in sidebar | Subtotal + “pending at checkout” |
| ProductCard `{ name, price, img }` payload | `{ product_id, quantity }` |
| Service add-to-cart | Info toast (products-only) |

Merge triggered from `AuthContext` after `login` and `verifyOtp`. Merge warnings shown via **toast** and a **dismissible banner** in the cart sidebar.

`CheckoutPage` carries a **Stage 7 mock banner** and source comment — not connected to cart/checkout APIs.

---

## Tests

| Suite | Result |
|-------|--------|
| Backend PHPUnit | **156 / 156 PASS** (+13 cart) |
| Frontend Vitest | **67 / 67 PASS** (+2 cart hook) |
| Pint | **PASS** |
| typecheck / build / lint / format:check | **PASS** |
| `php artisan migrate:fresh --seed` | **PASS** (2026-08-17) |
| `php artisan db:seed` (repeat) | **PASS** (idempotent) |

---

## Intentionally Deferred

- Checkout, orders, payment (Stage 7)
- Coupon / shipping subsystems (extension points only)
- Inventory reservation at cart time
- Service cart SKUs
- `CheckoutPage` — **UI mock only** (explicitly labeled Stage 7)

---

## Stage Boundary

| Stage | Status |
|-------|--------|
| **Stage 6 — Cart** | **COMPLETE / VERIFIED** |
| **Stage 7 — Checkout/Orders/Payment** | **NOT IMPLEMENTED** |

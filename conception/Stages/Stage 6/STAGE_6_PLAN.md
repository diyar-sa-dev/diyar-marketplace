# Stage 6 — Cart — Implementation Plan

> **Date:** 2026-08-17  
> **Baseline:** `74862a5`  
> **Scope:** Phases 6.1–6.4 only  
> **Out of scope:** Checkout, orders, payment, reservation at cart time, coupons, shipping, service SKUs

---

## PO Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Cart line types | **Products only** — no service SKUs |
| Logout | **Persist authenticated cart** (user-owned) |
| VAT/tax in sidebar | **Subtotal only** — discount/shipping/tax/total = `null` (pending Stage 7) |

---

## Domain Model

```text
Cart (1) ──< CartItem (N) >── Product
  │
  ├── user_id (nullable) — authenticated owner
  └── session_id (nullable) — guest binding via Laravel session
```

**Cart line identity:** `product_id` (no variants in Stage 4 catalog).

**Cart status:** `active` | `merged` | `abandoned`

---

## Database Schema

### `carts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK nullable | indexed |
| session_id | string nullable | indexed |
| status | string | default `active` |
| merged_at | timestamp nullable | guest cart after merge |
| timestamps | | |

Indexes: `(user_id, status)`, `(session_id, status)`

Application rule: one **active** cart per user OR per guest session.

### `cart_items`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| cart_id | uuid FK | cascade delete |
| product_id | uuid FK | |
| quantity | unsigned int | 1..max |
| unit_price_snapshot | decimal(12,2) | set on add/update from server |
| timestamps | | |

Unique: `(cart_id, product_id)`

---

## Guest Identity

Use Laravel `session()->getId()` from existing Sanctum SPA session (`EnsureFrontendRequestsAreStateful`).

No localStorage cart IDs. No client fingerprinting.

---

## Authenticated Identity

`user_id` from `auth:sanctum`. Never accept `user_id` from request body.

---

## Merge Rules (`CartMergeService`)

1. Transaction + `lockForUpdate` on both carts
2. Skip if guest cart empty or already `merged`
3. For each guest item → user cart same `product_id`:
   - `new_qty = guest_qty + user_qty`
   - For `in_stock`: cap `new_qty = min(new_qty, available_quantity)`; attach validation warning if capped
   - For `preorder` / no inventory lock: allow requested qty
4. Inactive/unavailable products: keep line, flag in validation (do not silently delete)
5. Mark guest cart `status = merged`, `merged_at = now()`
6. Idempotent: repeated merge with merged guest cart is no-op

**Trigger:** `POST /api/v1/cart/merge` after login/register OTP verification (frontend `AuthContext`).

---

## Validation Rules (`CartValidationService`)

Per item:

| Check | Action |
|-------|--------|
| Product exists | `invalid` if deleted |
| Product active + publicly visible | `invalid` if not |
| Vendor active | `invalid` if not |
| Price | `price_changed` if snapshot ≠ current `sale_price` |
| In-stock inventory | `insufficient_stock` if qty > available |
| Preorder | allowed; note preorder state |
| Out of stock | `unavailable` |

Cart-level totals: **subtotal only** (server sum of snapshot × qty for valid lines).

Extension points (null): `discount`, `shipping`, `tax`, `coupon`, `total`.

**No `InventoryService::reserve()` in Stage 6.**

---

## API Contract

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | session | Get or create active cart |
| DELETE | `/cart` | session | Clear all items |
| POST | `/cart/items` | session | `{ product_id, quantity }` |
| PATCH | `/cart/items/{item}` | session | `{ quantity }` |
| DELETE | `/cart/items/{item}` | session | Remove line |
| POST | `/cart/merge` | required | Merge guest → user cart |
| POST | `/cart/validate` | session | Run validation, return states |

Response envelope: existing `ApiResponse`. Resource includes `items`, `totals`, `count`.

---

## Security

- Cart ownership via session or user — never from client cart ID alone without scope check
- Cart item routes verify `item.cart_id === resolved cart.id`
- Quantity bounds: `1..config('diyar.cart.max_quantity_per_item')`
- UUID validation on product_id / item id
- CSRF on mutating requests (existing SPA pattern)
- Row locks on merge and concurrent add to same cart

---

## Frontend Strategy

- `api/cart.ts` + `hooks/cart/*` (TanStack Query)
- Replace `CartContext` mock with API-backed hooks
- Wire `ProductCard`, `ProductDetailsPage`, `CartSidebar`
- `AuthContext`: call `mergeCart()` after login/verifyOtp
- i18n keys: `cart.*` (AR/EN)
- Service add-to-cart: disabled / deferred message (products-only)

---

## Test Strategy

- `tests/Feature/Api/V1/Cart/CartTest.php` — guest, auth, merge, validation, security
- Frontend: `hooks/cart/useCart.test.ts` or mapper tests as appropriate
- Full regression: 143+ backend, 65+ frontend tests

---

## Stage 7 Extension Points

- Checkout preview consumes `POST /cart/validate` + authoritative subtotal
- `InventoryService::reserve()` at order creation
- Coupon/shipping/tax fields on validation response
- Multi-vendor split (checkout)

---

## Non-Goals

- CheckoutPage implementation
- Orders/payments
- Service cart lines
- Client-authoritative VAT
- Fake checkout APIs

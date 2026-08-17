# Stage 6 — Cart — Entry Audit (Step 1)

> **Date:** 2026-08-17  
> **Branch:** `dev`  
> **HEAD:** `74862a5` — `feat(stage-4-5.5): implement catalog inventory and storefront integration`  
> **Authorization:** Stage 6 Cart authorized by PO  
> **Scope:** Cart only (6.1–6.4). Checkout/payment/orders **NOT** in scope.

---

## 1. Executive Summary

**No backend cart domain exists.** The frontend uses a **100% mock** `CartContext` (seeded demo items, React-only state, no `product_id`, client-side totals/VAT). Stage 4/5 inventory, catalog, and Sanctum SPA session infrastructure are **ready foundations** for a server-authoritative cart. Implementation is greenfield on the backend with targeted frontend replacement of mock cart flows.

**Recommended guest identity:** Laravel session cookie (`laravel_session`) already used by Sanctum SPA — no new device fingerprinting required.

---

## 2. What Exists vs What Is Mock

| Layer | Exists | Mock / Missing |
|-------|--------|----------------|
| Backend `Cart` model/migration | ❌ | Full domain needed |
| Backend cart routes/controllers | ❌ | None (`grep cart` → 0) |
| Backend cart tests | ❌ | None |
| `CartContext.tsx` | ✅ file | **Mock** — `SEED` array, no API, no persistence |
| `CartSidebar.tsx` | ✅ UI | Uses mock context; **client VAT 15%** |
| `ProductCard` add-to-cart | ✅ button | Passes **name/price/img only** — no `product_id` |
| `ProductDetailsPage` add-to-cart | ✅ button UI | **No `onClick`** — not wired at all |
| `CheckoutPage.tsx` | ✅ page | **MOCK_CART**, **MOCK_ADDRESSES** — Stage 7 |
| `ServiceCard` / `ChatPage` cart | ✅ | Mock service lines — **out of product cart scope?** |
| Inventory `reserve()` | ✅ service | Requires `User` — **checkout only**, not cart validation |
| Product catalog API | ✅ | Ready for cart resolution |
| Sanctum + session + CSRF | ✅ | Ready for guest + auth carts |
| Wishlist API pattern | ✅ | Reference for user-scoped persistence + merge invalidation |

---

## 3. Backend Architecture (Stages 4–5.5)

### 3.1 Catalog (consumable by cart)

- **Product** — UUID, `sale_price`/`compare_price` (decimal), `status`, `availability_mode`, `expected_available_at`, soft deletes
- **ProductColor** — display/options only; **no purchasable variant SKU** — cart line key = `product_id` for V1
- **ProductInventory** — `stock_quantity`, `reserved_quantity`, `available_quantity` with invariant enforcement
- **scopePubliclyVisible()** — active product + active vendor
- **ProductService** — public product resolution
- **Pricing** — server-side on product model; never trust client

### 3.2 Inventory (validation boundary)

- `InventoryService::reserve/finalize/release` — transactional, row locks
- Preorder: `affects_inventory = false` — no stock lock
- Reservations require authenticated `User` — **do not call `reserve()` during cart validation** (Stage 7 checkout)
- Cart validation should **read** `available_quantity` and `availability_mode` only

### 3.3 Auth / session (guest cart enabler)

```text
bootstrap/app.php
  → EnsureFrontendRequestsAreStateful (Sanctum)
  → SetLocaleFromRequest

frontend apiClient
  → withCredentials: true
  → CSRF via /sanctum/csrf-cookie

sessions table
  → exists (0001_01_01_000000_create_users_table.php)
```

Guests already receive `laravel_session` when hitting CSRF cookie endpoint. **Preferred guest cart binding:** `session_id` on `carts` table (server-controlled).

### 3.4 API conventions

- Prefix: `/api/v1`
- Envelope: `ApiResponse::success/error`
- Auth group: `auth:sanctum` + `account.active`
- Wishlist reference: `Profile/WishlistController` + service layer pattern

---

## 4. Frontend Architecture

### 4.1 Cart mock (`CartContext.tsx`)

```typescript
// Current behavior (mock)
- SEED: 2 hardcoded products with Unsplash images
- addItem: merges by name+attributes (products) or always new line (services)
- uid: client-generated random string
- subtotal/count: client-calculated from trusted price
- No localStorage/sessionStorage
- Lost on refresh
```

### 4.2 Cart consumers

| File | Usage |
|------|-------|
| `App.tsx` | Cart count badge, `CartSidebar`, mobile nav |
| `ProductCard.tsx` | `addItem({ type, name, vendor, price, img })` |
| `ServiceCard.tsx` | Service add (mock) |
| `ChatPage.tsx` | Service on first message |
| `CartSidebar.tsx` | Display, qty, remove, VAT, link `/checkout` |
| `main.tsx` | `CartProvider` wraps app |

### 4.3 Integration patterns to reuse

- `api/catalog.ts` + `hooks/catalog/useCatalog.ts` — TanStack Query
- `api/wishlist.ts` + `hooks/profile/useWishlist.ts` — auth-gated mutations
- `lib/catalogMappers.ts` — product card mapping
- `AuthContext` — login/logout; **no cart merge hook today**
- i18n: `catalog.product.addToCart` keys exist (AR/EN)

### 4.4 Gaps

- No `api/cart.ts` or `hooks/cart/*`
- No cart query keys
- `AuthContext` invalidates product/wishlist on auth change — **must add cart invalidation + merge on login**
- `ProductDetailsPage` cart button is **non-functional** (no handler)

---

## 5. Product / Variant Identity Decision

| Question | Finding | Recommendation |
|----------|---------|----------------|
| Variants? | Colors exist; no `variant_id` | Cart item = **`product_id` + quantity** |
| Color at purchase? | UI shows colors; not in cart | Optional `metadata` JSON for selected color name — **defer** unless PO requires |
| Service items? | Mock `type: 'service'` in cart | **Stage 6: products only**; keep service mock deferred or separate future domain |
| Duplicate detection | Mock merges by name | Server: **unique (cart_id, product_id)** |

---

## 6. Phase Readiness Assessment

### Phase 6.1 — Guest Cart

| Requirement | Ready? | Notes |
|-------------|--------|-------|
| Session identity | ✅ | Sanctum stateful + `sessions` table |
| Server persistence | ❌ | Need `carts` + `cart_items` |
| Public cart routes | ❌ | Must work without auth, scoped to session |
| CSRF on mutations | ✅ | Existing client pattern |

### Phase 6.2 — Authenticated Cart

| Requirement | Ready? | Notes |
|-------------|--------|-------|
| User model | ✅ | |
| User-scoped cart | ❌ | One active cart per user |
| Persistence | ❌ | DB |

### Phase 6.3 — Cart Merge

| Requirement | Ready? | Notes |
|-------------|--------|-------|
| Login flow | ✅ | `AuthContext.login` |
| Merge trigger | ❌ | Call `POST /cart/merge` after login/register/verifyOtp |
| Transactional merge | ❌ | New `CartMergeService` |
| Idempotency | ❌ | Design merge token or guest cart status flag |

### Phase 6.4 — Cart Validation

| Check | Data source | Reserve? |
|-------|-------------|----------|
| Product active/visible | `Product::publiclyVisible()` | No |
| Vendor active | vendorAccount status | No |
| Price changed | compare `sale_price` vs snapshot | No |
| Stock | `inventory.available_quantity` | No |
| Preorder | `availability_mode` | No |
| Coupon | N/A | Extension point only |
| Shipping | N/A | Return `pending` / unsupported |

---

## 7. Security Observations

| Risk | Current state | Stage 6 requirement |
|------|---------------|---------------------|
| IDOR on cart | N/A (no API) | Scope all reads/writes to session or user |
| Guest cart takeover | N/A | Never accept client cart_id without session match |
| Price manipulation | **High** — client prices in mock | Server resolves price on every add/update |
| Quantity manipulation | Client-side only | Server validates against inventory rules |
| Mass assignment | N/A | Whitelist `product_id`, `quantity` only |
| Negative/zero qty | Mock allows min 1 | Server rejects ≤0 |
| Merge race | N/A | DB transaction + unique constraints |

---

## 8. Concurrency Notes

- Follow Stage 5 pattern: `DB::transaction`, `lockForUpdate` on cart row during merge/update
- Two tabs updating same cart: optimistic locking via `updated_at` or row lock on cart
- Cart validation is read-only on inventory — no reservation until Stage 7

---

## 9. Mock Data Inventory (Cart-related)

| Location | Class | Stage 6 action |
|----------|-------|----------------|
| `CartContext.tsx` SEED | **A — Replace** | Wire to cart API |
| `CartSidebar.tsx` VAT calc | **A — Replace** | Server totals in validation response |
| `ProductCard.tsx` addItem | **A — Replace** | `POST /cart/items` with `product_id` |
| `ProductDetailsPage` button | **A — Wire** | Same API + qty |
| `CheckoutPage.tsx` | **C — Deferred** | Stage 7; keep mock |
| `ServiceCard` / `ChatPage` | **D — Future** | No service SKUs in backend |

---

## 10. Tests (Current)

| Area | Count | Cart coverage |
|------|-------|---------------|
| Backend PHPUnit | 143 | **0** |
| Frontend Vitest | 65 | **0** |

Existing contracts to preserve: all 143 + 65 must still pass after Stage 6.

---

## 11. Git / Baseline

- Stage 4/5/5.5 **committed** at `74862a5`
- Stage 6 work starts from clean catalog foundation
- Do not commit `.env`, logs, caches, storage media

---

## 12. Risks & Missing Pieces

1. **ProductDetailsPage cart button not wired** — must fix in Stage 6 frontend
2. **Mock seed items in cart** — remove on API integration
3. **Service-type cart lines** — clarify PO: products-only vs keep UI stub
4. **Checkout link in sidebar** — remains navigation to mock checkout (Stage 7); validation endpoint prepares data only
5. **Logout behavior** — define: authenticated cart **persists**; guest session cart **orphaned/expired** (document)
6. **Color selection** — not in cart key; document as V1 limitation
7. **CURRENT_STATE.md** still lists Stage 6 as unauthorized — update when implementation starts

---

## 13. Recommended Step 2 Architecture (Preview)

### Database

```text
carts
  id (uuid PK)
  user_id (nullable FK → users)
  session_id (nullable string, indexed)
  status (active|merged|abandoned)
  merged_at (nullable)
  timestamps

cart_items
  id (uuid PK)
  cart_id (FK)
  product_id (FK)
  quantity (unsigned int)
  unit_price_snapshot (decimal 12,2) — set on add/update from server
  timestamps
  UNIQUE(cart_id, product_id)
```

### Backend services

- `CartService` — resolve cart (guest by session, auth by user)
- `CartItemService` — add/update/remove with product resolution
- `CartMergeService` — guest → user merge rules
- `CartValidationService` — item-level + cart-level validation result DTO
- `CartResource` — items, totals, validation flags

### Routes (proposed)

```text
GET    /cart                         — guest + auth (session or user)
POST   /cart/items                   — { product_id, quantity }
PATCH  /cart/items/{item}            — { quantity }
DELETE /cart/items/{item}
DELETE /cart
POST   /cart/merge                     — auth only (after login)
POST   /cart/validate                  — guest + auth
```

Guest routes: **outside** `auth:sanctum` group but **inside** stateful session middleware (already global on API).

Auth merge: trigger from frontend after successful login/register/verifyOtp.

### Frontend

- `api/cart.ts`, `hooks/cart/useCart.ts`, `hooks/cart/queryKeys.ts`
- Replace `CartContext` with TanStack Query + optimistic mutations OR thin context wrapping queries
- Invalidate/merge cart in `AuthContext` on login
- Wire `ProductCard`, `ProductDetailsPage`, `CartSidebar`
- i18n keys under `cart.*`

### Merge rules (proposed)

- Same `product_id`: sum quantities, cap at `min(requested, available)` for in_stock; preorder unlimited by inventory
- Inactive/unavailable items: keep line with `validation.status = invalid`, do not delete silently
- Atomic transaction; mark guest cart `merged`
- Repeated merge: idempotent if guest cart already merged

### Totals (Stage 6)

```text
subtotal = Σ (unit_price_snapshot × quantity)  — server only
discount = null (unsupported)
shipping = null (pending)
tax = null (pending) OR display-only estimate flagged non-authoritative
total = subtotal until Stage 7
```

Remove authoritative VAT from `CartSidebar` until checkout stage; optional non-binding estimate with disclaimer.

---

## 14. Explicitly Out of Scope

- Checkout page implementation
- Orders / vendor order split
- Payment gateway
- `InventoryService::reserve()` during cart ops
- Coupon subsystem (validation extension point only)
- Shipping provider integration
- Service marketplace cart lines (unless PO expands scope)

---

## 15. Step 1 Verdict

**READY TO PROCEED** to Step 2 (architecture plan) and implementation.

**Blockers:** None technical — greenfield cart on solid Stage 5.5 foundation.

**PO decisions needed before coding:**

1. Products-only cart for Stage 6, or include service mock lines?
2. Logout: keep authenticated cart persisted (recommended: yes)?
3. Tax display in sidebar: remove until Stage 7, or show non-authoritative estimate?

---

## 16. Next Step

Proceed to **Step 2 — Stage 6 Architecture Plan** (`STAGE_6_PLAN.md`) then phased implementation 6.1 → 6.4.

No code changes made in this audit step.

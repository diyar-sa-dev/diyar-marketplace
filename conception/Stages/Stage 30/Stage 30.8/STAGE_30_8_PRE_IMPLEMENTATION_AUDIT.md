# Stage 30.8 — Pre-Implementation Audit

**Date:** 2026-09-19

## A. How products enter the cart

`CartController::storeItem` → `CartService::addItem(cart, productId, quantity, color?)` with live `ProductService::findPublic` and `sale_price` snapshot.

## B. Quantity validation

`normalizeQuantity`: 1..`max_quantity_per_item` (default 99). Duplicate `(cart, product, color)` merges quantities.

## C. Stock validation

`assertQuantityAllowedForProduct`: `OutOfStock` mode rejects; `InStock` compares `inventory.available_quantity`.

## D. Price

`unit_price_snapshot` set from `$product->sale_price` on each add/update — server authoritative.

## E. Inventory reservation

Not at cart add in `CartService` — reservation at checkout (existing architecture; unchanged).

## F. Duplicate cart lines

Same product + same color → single line, quantities summed. Room design has no color → default empty color → one line per product UUID.

## G. Unavailable products

`InvalidArgumentException` / `NotFoundHttpException` from cart layer.

## H. Transactions

Each `addItem` runs in `DB::transaction` with cart row lock.

## I. API conventions

`ApiResponse::success`, `CartResource`, Sanctum for user cart under `/api/v1/cart`.

## J. Frontend cart

`useCart` + `cartSync` optimistic local; `cartKeys.detail()` cache; `addCartItem` POST `/cart/items`.

## K. Authorization

Room design: owner-only via `findOwned` → 404. Cart: session/user resolved cart.

## L. Rate limits

Room design mutating routes: `room-design-save` 30/min/user. Cart `/items` uses default API throttle.

## M. Idempotency

Cart merge on duplicate product+color — **not** idempotent for repeated add-to-cart calls (each call adds quantities again). Frontend must disable double submit.

## Stage 30.8 contract (confirmed)

`POST /api/v1/room-designs/{id}/add-to-cart` body optional `{ item_ids: uuid[] }` — server reads persisted document, aggregates instance counts per product UUID, delegates to `CartService::addItem`, returns `CartResource` + `skipped[]`.

# Phase 5.4 — Completion Report

> **Status:** COMPLETE / FINALIZED  
> **Date:** 2026-08-16

## Implementation

- `products.expected_available_at` nullable date
- Vendor can set `availability_mode` + expected date via product update API
- `InventoryService::reserve()` rejects `out_of_stock`
- Preorder shows "طلب مسبق" label; purchase button enabled on product detail
- Out-of-stock disables add-to-cart button on product detail

## Files Changed

- `backend/database/migrations/2026_08_16_150003_add_expected_available_at_to_products_table.php`
- `backend/app/Models/Product.php`
- `backend/app/Services/Catalog/ProductService.php`
- `backend/app/Http/Requests/Dashboard/StoreProductRequest.php`
- `backend/app/Http/Requests/Dashboard/UpdateProductRequest.php`
- `backend/app/Http/Resources/ProductDetailResource.php`
- `frontend/src/types/catalog.ts`
- `frontend/src/pages/ProductDetailsPage.tsx`
- `backend/tests/Feature/Api/V1/Catalog/ProductAvailabilityTest.php`

## Tests

5 tests — preorder config, public exposure, out-of-stock, IDOR, auto sync

## Security

Vendor ownership on availability configuration (existing product policy).

## Known Limitations

Add-to-cart is UI-only (no cart backend in Stage 5). Preorder badge on listing cards unchanged.

## Deferred

Full storefront availability integration across all mock sections.

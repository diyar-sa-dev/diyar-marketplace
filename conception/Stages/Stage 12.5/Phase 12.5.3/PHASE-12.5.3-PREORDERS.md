# Phase 12.5.3 — Product Preorders

> **Status:** Implemented

## Behavior

- Customer submits preorder on out-of-stock / preorder products without cart quantity
- Vendor sees requests at `/dashboard/vendor/preorders`
- Status lifecycle: `pending` → fulfilled/cancelled (vendor cancel API)

## Backend

- Model: `ProductPreorderRequest`
- `ProductPreorderService`, `ProductPreorderController`, `VendorPreorderController`
- Dashboard overview includes preorder count

## Frontend

- Preorder CTA on product card and PDP
- `VendorPreordersPage` in vendor dashboard
- Stat card on vendor home dashboard

## Tests

- `ProductPreorderTest`

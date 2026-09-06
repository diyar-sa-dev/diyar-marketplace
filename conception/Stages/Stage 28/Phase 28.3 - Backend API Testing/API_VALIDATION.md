# Phase 28.3 — API Request Validation

**Date:** 2026-08-27  
**Evidence:** Feature tests using `assertJsonValidationErrors`, `assertUnprocessable`

---

## Validation mechanism

- **FormRequest** classes per write endpoint
- Laravel validation → **422 Unprocessable Entity**
- Envelope: `{ success: false, message, errors: { field: [messages] } }` (consistent across tested endpoints)

---

## Domains with validation tests

| Domain | Test files | Cases covered |
|--------|------------|---------------|
| Auth | `AuthenticationTest`, `RegistrationTest` | Invalid credentials, registration fields |
| Profile | `ProfileTest`, `PhoneChangeTest`, `AddressTest` | Required fields, phone format |
| Catalog | `ProductTest`, `ProductFilterTest` | Product create/update rules |
| Cart | `CartTest` | Quantity bounds, invalid product |
| Checkout | `CheckoutPreviewTest`, `SelfPurchaseTest` | Address, cart state |
| Orders | `OrderCreationTest` | Checkout payload validation |
| Coupons | `VendorCouponTest`, `AdvancedCouponTest` | Coupon rules, dates |
| B2B | `B2bCompanyTest`, `PartnerB2bLeadTest` | Company/lead fields |
| Platform | `PlatformContactApiTest` | Contact form validation |
| Uploads | `UploadSecurityTest` | MIME, size (see uploads) |
| Admin | `CategoryAdminTest`, `BlogAdminTest` | Admin write validation |

---

## Boundary / invalid input patterns tested

| Pattern | Example test | Result |
|---------|--------------|--------|
| Missing required fields | Registration, checkout | 422 + field errors |
| Invalid credentials | Login wrong password | 422 `credentials` |
| Negative / zero quantity | Cart, inventory | 422 |
| Invalid enum/status | Payment, returns | 422 or business error |
| Self-purchase violation | `SelfPurchaseTest` | 422 |
| Oversized / wrong file type | `UploadSecurityTest` | 422 |

---

## Error safety

Executed tests did **not** expose:

- SQL error text in JSON responses
- Stack traces in API JSON body (test env)
- Internal paths in validation messages

Production `APP_DEBUG=false` behavior for 500 errors: **NOT exhaustively tested** in 28.3.

---

## Validation gate

```text
PASS
```

Major write paths have automated validation tests. Not every optional field boundary tested on every endpoint.

---

## Gaps (documented, not fixed)

| Gap | ID |
|-----|-----|
| Assistant chat input validation | KI-028-033 |
| Every admin POST/PATCH boundary | KI-028-034 |

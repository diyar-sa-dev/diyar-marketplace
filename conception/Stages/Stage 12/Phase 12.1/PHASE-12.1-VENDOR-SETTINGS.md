# Phase 12.1 — Vendor Settings

> **Scope:** Store configuration, legal/tax, bank account, working hours, account tab, shipping/returns panels, media uploads.

---

## UI

**Route:** `/dashboard/vendor/settings?tab={store|appearance|business|shipping|returns|account|notifications}`

**Page:** `frontend/src/pages/dashboard/VendorSettings.tsx`

| Tab | Capability |
|-----|------------|
| Store | Business name, slug, description, location, support phone/email |
| Appearance | Logo upload/delete, cover upload/delete |
| Business | Legal entity type, CR number, tax number |
| Shipping | Embedded `VendorShippingSettingsPanel` (Stage 10) |
| Returns | Embedded `VendorReturnPolicyPanel` (Stage 11) |
| Account | Avatar, name, email (profile API); security link to `/profile/security` |
| Notifications | Locale preference; notification list is mock (deferred) |

**Account tab behavior:**

- Vendor-only users manage identity fields here; password change is **not duplicated** — links to `/profile/security`
- "Manage profile" link to `/profile/personal-info` shown only when user has **customer** role

---

## API endpoints

All require `auth:sanctum`, `account.active`, `role:vendor,admin`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/vendor/settings` | Load full settings payload |
| PATCH | `/dashboard/vendor/settings` | Update store profile fields |
| POST | `/dashboard/vendor/settings/logo` | Upload logo |
| DELETE | `/dashboard/vendor/settings/logo` | Remove logo |
| POST | `/dashboard/vendor/settings/cover` | Upload cover/banner |
| DELETE | `/dashboard/vendor/settings/cover` | Remove cover |
| PUT | `/dashboard/vendor/settings/legal` | Legal / tax profile |
| PUT | `/dashboard/vendor/settings/bank-account` | Active bank account |
| PUT | `/dashboard/vendor/settings/working-hours` | Weekly schedule (7 days) |
| GET/PUT | `/dashboard/vendor/shipping-settings` | Shipping methods (Stage 10) |
| GET/PUT | `/dashboard/vendor/return-policy` | Return policy (Stage 11) |

Profile avatar/name/email use existing `/api/v1/profile` endpoints from the account tab.

---

## Backend services

| Service | Responsibility |
|---------|----------------|
| `VendorSettingsService` | CRUD for vendor account, legal, bank, hours, media |
| `MediaUploadService` | Disk storage, MIME/size validation, SVG safety |
| `IbanValidator` | Saudi IBAN checksum + bank code alignment |
| `SvgSafetyValidator` | Strip dangerous SVG constructs on logo upload |

**Controller:** `VendorSettingsController`  
**Policy:** `VendorAccountPolicy` (view/update own vendor account)  
**Resources:** `VendorSettingsResource`, `VendorLegalProfileResource`, `VendorBankAccountResource`, `VendorWorkingHourResource`

---

## Validation

**Form requests:**

- `UpdateVendorSettingsRequest` — slug uniqueness, reserved slugs (`config('diyar.vendor.reserved_slugs')`), name/phone/email rules
- `UpdateVendorLegalProfileRequest` — entity type enum, CR/tax formats
- `UpdateVendorBankAccountRequest` — bank code enum, beneficiary name, IBAN
- `UpdateVendorWorkingHoursRequest` — weekday enum, open/close times, closed flag
- `UploadVendorLogoRequest` / `UploadVendorCoverRequest` — image MIME, max size from `config/diyar_media.php`

Client-side mirrors critical name length rules via `lib/auth/validation.ts` in the account tab.

---

## Media security

- Logo/cover uploads validated for type and size
- SVG logos pass through `SvgSafetyValidator` before persistence
- Public URLs resolved via `resolveMediaUrl()` on frontend; storage disk configurable (`diyar_media.disk`)

---

## Error handling

- Validation → **422** with field errors
- InvalidArgumentException from service (e.g. bad slug) → **422** message
- Unauthorized cross-vendor access → **403** via policy

---

## Localization & RTL

- Tab labels, field labels, save toasts: `vendor.settings.*` keys (AR/EN)
- Weekday labels: `diyar.vendor.weekdays.*` (backend) + frontend locale
- Form inputs use `dir="ltr"` where appropriate (email, IBAN, slug)

---

## Tests

`backend/tests/Feature/Api/V1/Dashboard/VendorSettingsTest.php`

- View/update store settings
- Slug uniqueness and format
- Logo/cover upload, legal profile, bank account, working hours
- SVG safety rejection on malicious logo

---

## Configuration

`config/diyar.php`:

```php
'vendor' => [
    'store_domain' => env('DIYAR_STORE_DOMAIN', 'diyar.sa'),
    'low_stock_threshold' => env('DIYAR_LOW_STOCK_THRESHOLD', 5),
    'reserved_slugs' => [...],
],
```

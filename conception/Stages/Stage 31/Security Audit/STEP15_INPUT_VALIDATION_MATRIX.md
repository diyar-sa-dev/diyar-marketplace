# DIYAR — STEP 15 INPUT VALIDATION MATRIX
# EXTERNAL INPUT BOUNDARY SCORECARD & MASS ASSIGNMENT DEFENSE

**Document Type:** Input Validation & Mass Assignment Audit Scorecard  
**Phase:** Modular Monolith Architecture — Step 15  
**Date:** 2026-10-10  
**Scope:** All externally controlled parameters across 528 API routes  
**Authority:** Application Security Architect, Laravel Security Lead  

---

## 1. Input Boundary Governance Principles

1. **The Backend Is the Sole Security Authority:** Frontend validation in React forms/schemas exists purely for user experience. Even if an attacker bypasses client-side checks completely via cURL or Postman, every request payload is validated server-side.
2. **Explicit Allowlists Only:** No state-changing endpoint uses unchecked `$request->all()` or `$request->input()` directly inside model creation or persistence methods.
3. **Strict FormRequest & DTO Architecture:** State-modifying routes consume typed FormRequest instances with validated attributes.
4. **Mass Assignment Lockdown:** Eloquent models explicitly define strict `$fillable` arrays. Sensitive fields are never mass-assignable.

---

## 2. Input Boundary Scorecard by Data Category

| Input Category | External Source | Validation Rule / Constraint | Threat Mitigated | Server-Side Enforcement Mechanism | Disposition |
|---|---|---|---|---|:---:|
| **Route Parameters (UUIDs)** | Path URI (`/orders/{id}`) | `uuid` format, route-model-binding with tenant scope | SQL injection, IDOR, path traversal | `OrFail` scoped to `$request->user()->id` | **PASS** |
| **Route Parameters (Slugs)** | Path URI (`/products/{slug}`) | `string`, `alpha_dash`, max 255 | Path traversal, SQL injection | Parameterized `where('slug', $slug)` | **PASS** |
| **Catalog Search Terms** | Query parameter (`?q=...`) | `string`, max 255, regex stripped | ReDoS, SQL boolean query injection | Full-text sanitized boolean mode with bindings | **PASS** |
| **Pagination Limits** | Query parameter (`?per_page=...`) | `integer`, `min:1`, `max:50` | Resource exhaustion, memory DoS | Enforced default cap in query service | **PASS** |
| **Sort Fields & Direction** | Query parameter (`?sort_by=...`) | Strict whitelist: `in:created_at,price,rating`, `in:asc,desc` | Arbitrary column SQL injection | Explicit `match($sort)` allowlist | **PASS** |
| **Prices & Monetary Values** | Payload body (`price`, `total`) | **REJECTED FROM CLIENT:** Recalculated server-side | Price tampering, negative cart total | Computed from database `products.sale_price` | **PASS** |
| **Quantities** | Payload body (`quantity`) | `integer`, `min:1`, `max:99` | Integer overflow, negative inventory | Strict integer validation + DB row-level locks | **PASS** |
| **Discount & Coupons** | Payload body (`coupon_code`) | `string`, `max:50`, validated against active rules | Coupon fraud, discount tampering | Server evaluates validity & calculates discount | **PASS** |
| **Passwords & Credentials** | Payload body (`password`) | `string`, `min:8`, confirmed, hashed with bcrypt | Weak passwords, credential theft | Laravel `Password::defaults()`, bcrypt cost | **PASS** |
| **Phone Numbers** | Payload body (`phone`) | Saudi format regex `^9665[0-9]{8}$` | Malformed input, SMS fraud | Strict regex validator + OTP rate limiting | **PASS** |
| **Email Addresses** | Payload body (`email`) | `email:rfc,dns`, max 255 | Header injection, invalid addresses | Normalized lowercase with parameterized lookup | **PASS** |
| **Uploaded Files (Images)** | Multipart form-data (`image`) | MIME type, extension, size, magic bytes, dimensions | Web shell upload, pixel bomb DoS | `VisualSearchImageGuard` (MIME, bytes, max px) | **PASS** |
| **Chat Attachments** | Multipart form-data (`attachment`) | `mimes:jpg,jpeg,png,webp`, `max:5120` | Executable upload, storage exhaustion | Storage disk isolated, generated file UUIDs | **PASS** |
| **AI Messages** | JSON body (`messages`) | `array`, `min:1`, `max:20`, role `in:user,assistant` | System prompt override, model tampering | Client cannot pass `system` role or privileged args | **PASS** |
| **Spatial Layout Documents** | JSON body (`document`) | Valid JSON, version `in:1`, max 512KB, max 100 items | Memory exhaustion, schema corruption | JSON schema validator + byte-length assertion | **PASS** |
| **Payment Webhook Payloads** | Raw JSON body | HMAC SHA-256 signature, SHA-256 body hash | Forged webhooks, replay attacks | Idempotency event row lock + provider verification | **PASS** |

---

## 3. Mass Assignment Audit Scorecard

The following critical models were audited for `$fillable` whitelisting and protection against privilege escalation attributes:

| Eloquent Model | Fillable Whitelist Profile | Blocked Attacker-Controlled Fields | Mass Assignment Status |
|---|---|---|:---:|
| `User` | `name`, `phone`, `email`, `bio`, `avatar_path`, `preferences`, `password`, `status` | `role`, `is_admin`, `is_super_admin`, `permissions`, `balance` | **SECURE (PASS)** |
| `VendorAccount` | `business_name`, `commercial_register`, `tax_number`, `bio`, `contact_email` | `status`, `verified`, `commission_rate`, `wallet_balance`, `user_id` | **SECURE (PASS)** |
| `Product` | `name`, `slug`, `description`, `category_id`, `sku`, `price`, `sale_price` | `vendor_id`, `rating_average`, `rating_count`, `is_approved` | **SECURE (PASS)** |
| `Order` | `shipping_address_id`, `billing_address_id`, `notes`, `payment_method` | `user_id`, `total_amount`, `tax_amount`, `status`, `payment_status` | **SECURE (PASS)** |
| `Payment` | `order_id`, `gateway`, `currency` | `status`, `amount`, `transaction_reference`, `captured_at` | **SECURE (PASS)** |
| `RoomDesign` | `title` | `id`, `user_id`, `document`, `schema_version`, `version`, `item_count` | **SECURE (PASS)** |
| `TryInRoomJob` | `source_image_id`, `product_id`, `room_design_id`, `idempotency_key` | `id`, `user_id`, `status`, `result`, `error_code`, `provider_key` | **SECURE (PASS)** |

### Fuzzing Verification:
Submitting malicious payloads such as:
```json
{
  "role": "admin",
  "is_admin": true,
  "permissions": ["*"],
  "user_id": "00000000-0000-0000-0000-000000000001",
  "balance": 9999999.99,
  "is_approved": true
}
```
Resulted in **zero privilege escalation**: unmapped attributes were completely discarded by FormRequest `$request->validated()` and blocked by Eloquent `$fillable` boundaries.

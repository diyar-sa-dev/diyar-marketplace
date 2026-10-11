# DIYAR — STEP 15 DATABASE SECURITY AUDIT
# SQL INJECTION DEFENSE, CONCURRENCY LOCKING & FINANCIAL INTEGRITY

**Document Type:** Database Security & Data Integrity Audit  
**Phase:** Modular Monolith Architecture — Step 15  
**Date:** 2026-10-10  
**Target RDBMS:** MariaDB 10.11 / MySQL 8.0 on Hostinger KVM2  
**Authority:** Database Security Engineer, Senior Laravel Architect  

---

## 1. Database Security Scorecard by Table

| Database Table | Write Paths | Read Paths | Tenant / Owner Scoping | Mass Assignment Protection | Concurrency & Integrity Locking | Sensitive Fields Shielded | Security Result |
|---|---|---|---|---|---|---|:---:|
| `users` | Registration, Profile, Password reset | User profile, Auth lookup | `id = $user->id` | `$fillable` allowlist | Unique email/phone constraints | `password`, `remember_token` hidden | **PASS** |
| `vendor_accounts` | Vendor onboarding, Profile update | Vendor store, Admin review | `user_id = $user->id` | `$fillable` allowlist | Unique commercial register | `wallet_balance`, `verified` | **PASS** |
| `products` | Vendor catalog store/update | Public catalog, Admin moderation | `vendor_account_id` | `$fillable` allowlist | Optimistic locking / stock locks | `vendor_id`, `rating` | **PASS** |
| `product_inventory` | Order checkout, Vendor stock adjustment | Product detail, Cart validation | `vendor_account_id` | Dedicated service | **`lockForUpdate()`** on reservation | `available_quantity >= 0` check | **PASS** |
| `orders` | Checkout store | Customer orders, Vendor order | `customer_id`, Vendor items | Dedicated service | Transactional checkout | `total_amount`, `payment_status` | **PASS** |
| `order_items` | Checkout creation | Order detail | Parent `order_id` | Dedicated service | Row locked with inventory | `unit_price`, `subtotal` recalculated | **PASS** |
| `payments` | Webhook callback, Checkout gateway | Order payment status | Parent `order_id` | Dedicated service | Unique transaction reference | `gateway_signature`, `status` | **PASS** |
| `payment_webhook_events` | Webhook ingestion | Async queue processor | Provider signature | Dedicated service | **`lockForUpdate()`** on payload hash | `payload_hash` unique constraint | **PASS** |
| `carts` & `cart_items` | Cart mutation endpoints | Guest/User cart view | `user_id` or session/token | Dedicated service | Quantity bounds [1..99] | `id` UUID, item ownership | **PASS** |
| `room_designs` | Autosave PUT, Create POST | User room designs | `user_id = $user->id` | `$fillable: ['title']` | Version counter increment | `document`, `user_id` guarded | **PASS** |

---

## 2. SQL Injection Parameterization Audit

Static source-code analysis audited every raw query instance (`whereRaw`, `selectRaw`, `orderByRaw`, `DB::raw`) across `backend/app/`:

### 2.1 Audit Results:
1. **`whereRaw` Invariants:**
   - Case-insensitive lookups: `whereRaw('LOWER(email) = ?', [$normalizedEmail])` — Parameter bound via `?`.
   - Empty result stubs: `whereRaw('1 = 0')` — Static literal.
   - MySQL full-text search: `whereRaw("MATCH(products.name, products.description) AGAINST (? IN BOOLEAN MODE)", [$booleanQuery])` — Sanitized and parameter bound via `?`.
2. **`orderByRaw` Invariants:**
   - Case ordering: `orderByRaw('CASE WHEN products.name LIKE ? THEN 0 ELSE 1 END', [$prefix])` — Parameter bound via `?`.
   - Admin self-priority: `orderByRaw('CASE WHEN users.id = ? THEN 0 ELSE 1 END', [$adminId])` — Parameter bound via `?`.
3. **`selectRaw` Invariants:**
   - Aggregate expressions: `COUNT(*)`, `AVG(rating)`, `MIN(sale_price)`, `MAX(sale_price)`. Zero concatenated user input.
4. **`DB::raw` Invariants:**
   - Atomic increments: `DB::raw('attempts + 1')`, `DB::raw('processing_attempts + 1')`.
   - Verified columns: Dynamic column names strictly derived from typed PHP enums (`NotificationDeliveryStatus`).

### 2.2 Fuzzing Vector Verification:
Probing query parameters across catalog search, product filters, and vendor listings with standard SQL injection payloads:
- `' OR '1'='1`
- `'; DROP TABLE users; --`
- `UNION SELECT null, username, password FROM users --`
- `1' AND (SELECT 1 FROM (SELECT SLEEP(5))a)--`
**Result:** 0 SQL syntax exceptions; 0 timing anomalies; 0 database information disclosed.

---

## 3. Financial & Inventory Transactional Integrity

1. **Server-Side Financial Authority:**
   - The application **never trusts client-supplied prices, totals, taxes, or discounts**.
   - During checkout, `OrderCreationService` fetches unit prices directly from `products.sale_price` in the database, applies 15% Saudi VAT programmatically, and calculates subtotal, shipping, and grand total in PHP.
2. **Concurrent Inventory Row-Locking:**
   - Step 13B.2 validated that 6 parallel customer checkout requests racing for a single remaining stock item resulted in **exactly 1 order created** and **5 graceful rejections (HTTP 422)**.
   - Verified database invariant: `SELECT COUNT(*) FROM product_inventory WHERE available_quantity < 0` = **0**.

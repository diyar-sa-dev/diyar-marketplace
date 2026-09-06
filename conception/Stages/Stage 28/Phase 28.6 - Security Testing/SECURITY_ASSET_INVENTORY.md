# Phase 28.6 — Security Asset Inventory

**Source:** `stage28-api-inventory.php`, route files, policies, middleware  
**Raw:** `_security_route_inventory.json`

---

## API surface

| Metric | Count |
|--------|-------|
| Total routes | **480** |
| Auth required | **431** |
| Public | **49** |

---

## Domain breakdown (sample)

| Domain | Routes | Auth pattern |
|--------|--------|--------------|
| admin | 167 | `auth:admin` + permission middleware |
| dashboard (vendor/provider) | ~151 | `auth:sanctum` + role |
| auth | 11 | Public + throttle |
| cart/checkout/orders | ~40 | Sanctum session |
| b2b | 8 public + partner/admin | Policy + tenant scope |
| chat | ~15 | Membership authorization |
| webhooks | 1 | Signature verification |
| assistant | 1 | **Public** + throttle only |

---

## Authorization mechanisms

| Mechanism | Count / usage |
|-----------|---------------|
| Laravel Policies | **17** policy classes |
| FormRequest `authorize()` | Widespread |
| Middleware | `auth`, `auth:admin`, `account.status`, permissions |
| Service-layer checks | Chat, B2B, checkout, payments |

**Policies:** Order, VendorOrder, Product, B2bCompany, B2bLead, ReturnRequest, Project, Blog*, AffiliatePayout, VendorPayout, etc.

---

## Middleware stack (global)

| Middleware | Purpose |
|------------|---------|
| `SecurityHeaders` | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS (prod) |
| Sanctum stateful | CSRF + cookie session for SPA |
| Throttle | Per-route (auth, assistant, OTP, search) |

---

## Realtime channels

| Channel | Authorization |
|---------|---------------|
| `users.{userId}` | `hash_equals` auth user ID |
| `conversations.{conversationId}` | `ChatAuthorizationService::canSubscribe` |

---

## High-risk public endpoints

| Route | Controls |
|-------|----------|
| `POST /assistant/chat` | throttle:30/min — **no auth** |
| `POST /webhooks/payments/myfatoorah` | HMAC signature |
| `POST /auth/login` | throttle + validation |
| `GET /catalog/search` | throttle (config) |

---

## Gate

```text
PASS
```

Inventory complete for API surface and primary controls.

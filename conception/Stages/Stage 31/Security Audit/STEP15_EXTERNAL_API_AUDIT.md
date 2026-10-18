# DIYAR — STEP 15 EXTERNAL API AUDIT
# EXTERNAL CLIENT ADVERSARIAL MATRIX & SEC-01 REMEDIATION EVIDENCE

**Document Type:** External Client Adversarial Security Audit  
**Phase:** Modular Monolith Architecture — Step 15  
**Date:** 2026-10-10  
**Scope:** Adversarial testing across Clients A through J (Browser, Postman, cURL, Mobile, Attacker)  
**Authority:** API Security Engineer, Application Security Architect  

---

## 1. External Client Testing Matrix (Clients A–J)

Every backend API endpoint was evaluated under the condition that the calling client is completely untrusted and not restricted to the React web application.

| Client ID | Caller Profile / Request Characteristics | Targeted Routes / Domain | Authentication / Context | Expected Safe Behavior | Actual Measured Behavior | Security Result |
|:---:|---|---|---|---|---|:---:|
| **Client A** | Normal Browser (React SPA frontend) | All domains | Valid session cookie + XSRF-TOKEN | HTTP 200 / 201 with CSRF protection | Normal authorized execution | **PASS** |
| **Client B** | Postman with Sanctum Bearer Token | Customer / Vendor / Admin | Valid API token header | HTTP 200 / 201 scoped to token user | Token verified; correct RBAC applied | **PASS** |
| **Client C** | Postman without browser `Origin`/`Referer` | Cart & Public catalog | No session or bearer token | Deterministic HTTP response (no 500) | Handled gracefully without crash | **PASS (SEC-01 Verified)** |
| **Client D** | Command-line `cURL` (Stateless script) | `/api/v1/cart`, `/api/v1/catalog/*` | Stateless, raw JSON headers | Clean HTTP 401 or public catalog 200 | No uncaught RuntimeException | **PASS (SEC-01 Verified)** |
| **Client E** | Unauthenticated External Client | Protected user, vendor, admin routes | None | Immediate `HTTP 401 Unauthorized` | 100% rejected at Sanctum guard | **PASS** |
| **Client F** | Authenticated User attempting User B's resource | `/api/v1/orders/{userB_order_id}` | Authenticated as User A | `HTTP 403 Forbidden` / `404 Not Found` | Strict object policy rejection | **PASS (IDOR Safe)** |
| **Client G** | Customer attempting Vendor / Admin routes | `/api/v1/vendor/*`, `/api/v1/admin/*` | Authenticated as Customer | `HTTP 403 Forbidden` | Blocked by `role:vendor`/`admin` | **PASS (RBAC Safe)** |
| **Client H** | Vendor attempting another Vendor's resources | `/api/v1/vendor/products/{vendorB_product}` | Authenticated as Vendor A | `HTTP 403 Forbidden` / `404 Not Found` | Scoped to `vendor_account_id` | **PASS (Tenant Safe)** |
| **Client I** | Admin attempting unauthorized module | Restricted finance/audit routes | Authenticated as Staff Admin | `HTTP 403 Forbidden` | `admin.permission` blocks action | **PASS (RBAC Safe)** |
| **Client J** | Malformed / Malicious Fuzzing Client | Search, filter, checkout, uploads | SQLi (`' OR 1=1`), Path Traversal, large JSON | `HTTP 422 Unprocessable` / `404 Not Found` | Zero 500, zero SQL leaked | **PASS (Fuzzing Safe)** |

---

## 2. SEC-01 Deep-Dive & Remediation Evidence

### 2.1 Problem Statement & Reproduction
- **Affected Route:** `GET /api/v1/cart`, `POST /api/v1/cart/items`, `DELETE /api/v1/cart`
- **Component:** `app/Domains/Cart/Controllers/CartController.php`
- **Trigger Scenario:** A non-browser client (e.g. cURL, Postman, mobile app) submits a request without `Origin` or `Referer` headers matching `SANCTUM_STATEFUL_DOMAINS`.
- **Root Cause:** In Laravel 11/13, `EnsureFrontendRequestsAreStateful` attaches session middleware only when the incoming request is considered stateful. When unattached, calling `$request->session()->getId()` throws `RuntimeException: Session store not set on request`, returning HTTP 500 Server Error to external callers.

### 2.2 Exact Remediation Implemented
In `CartController.php` lines 129–145:
```php
private function resolveCart(Request $request): Cart
{
    if ($request->user() !== null) {
        return $this->carts->resolveForUser($request->user());
    }

    if ($request->hasSession()) {
        return $this->carts->resolveForGuest((string) $request->session()->getId());
    }

    $guestToken = (string) $request->header('X-Guest-Cart-Token', '');
    if ($guestToken !== '') {
        return $this->carts->resolveForGuest($guestToken);
    }

    abort(401, __('diyar.cart.invalid_session'));
}
```

### 2.3 Verification Evidence

#### SEC-01 BEFORE:
- Stateless request: `cURL http://localhost:8080/api/v1/cart`
- Response: `HTTP 500 Internal Server Error` (`RuntimeException: Session store not set on request`)

#### SEC-01 AFTER (Hardened & Deterministic):
- Stateless request without token: `cURL http://localhost:8080/api/v1/cart`
  - Response: `HTTP 401 Unauthorized` (`{"success":false,"message":"جلسة التسوق غير صالحة"}`)
- Stateless request with guest token: `cURL -H "X-Guest-Cart-Token: guest-test-uuid-12345" http://localhost:8080/api/v1/cart`
  - Response: `HTTP 200 OK` (Resolves deterministic guest cart)
- Valid browser request with session:
  - Response: `HTTP 200 OK` (Resolves session-backed guest cart)

#### Automated Regression Test Output:
```text
PHPUnit Feature Suite:
Tests\Feature\Api\V1\Cart\CartSessionlessRequestTest
  ✓ sessionless_request_without_origin_returns_unauthorized_instead_of_server_error
  ✓ sessionless_request_with_guest_token_resolves_cart

Tests: 2 passed, 0 failed
Assertions: 10 passed
Result: PASS
```

---

## 3. CORS, Origin & Referer Boundary Audit

1. **CORS Allow-List Rigor:**
   - `config/cors.php` configures `allowed_origins` dynamically via `DiyarNetworkOrigins::corsOrigins()`.
   - Wildcard `*` origins are strictly forbidden because `supports_credentials` is set to `true`.
2. **CORS Is NOT Authentication:**
   - Non-browser clients (cURL, Postman) do not enforce CORS in the client engine. All authenticated endpoints enforce `auth:sanctum` and session checks server-side regardless of whether an `Origin` header is transmitted.
3. **Foreign Origin Rejection:**
   - Requests with `Origin: http://evil-attacker.example` are denied cross-origin access and do not receive credentialed CORS headers.

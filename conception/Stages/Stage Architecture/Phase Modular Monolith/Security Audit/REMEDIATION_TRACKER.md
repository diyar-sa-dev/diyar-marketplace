# DIYAR — SECURITY REMEDIATION TRACKER
# AUDIT FINDINGS, REMEDIATIONS & CHANGE CONTROL

**Phase:** Modular Monolith Architecture — Security Audit Workstream  
**Date:** 2026-10-08  
**Authority:** Application Security Engineer, Senior Laravel Architect  
**Change Control Protocol:** No application code changes before explicit user approval.  

---

## 1. Remediation Summary Table

| Finding ID | Severity | Category | File / Route | Description & Impact | Proposed Fix | Status | Regression Test |
|---|:---:|---|---|---|---|:---:|---|
| **SEC-01** | Low | Error Handling / API Resilience | `app/Domains/Cart/Controllers/CartController.php` (`/api/v1/cart`) | Calling `$request->session()->getId()` when `$request->hasSession()` is false (due to missing `Origin`/`Referer` headers from non-browser API clients) triggers `RuntimeException: Session store not set on request`, returning HTTP 500 instead of a clean response. | Add `$request->hasSession()` check in `resolveCart()`. If no session store is set, either check for `X-Guest-Cart-Token` or return HTTP 401 Unauthorized for unauthenticated non-browser clients. | **PENDING APPROVAL** | `tests/Feature/Api/V1/Cart/CartSessionlessRequestTest.php` |

---

## 2. Detailed Finding Profiles

### SEC-01: Session Store Missing on Non-Stateful Guest Cart Requests
- **Vulnerability / Issue:** `RuntimeException` uncaught on guest cart access from non-stateful origins.
- **Affected Route:** `GET /api/v1/cart`, `POST /api/v1/cart/items`, `DELETE /api/v1/cart`
- **Root Cause:**
  In `bootstrap/app.php`, `EnsureFrontendRequestsAreStateful` only boots the session middleware if the request is deemed stateful (matching `SANCTUM_STATEFUL_DOMAINS` and carrying `Origin` or `Referer`). When a curl request or third-party client hits `/api/v1/cart` without these headers, the session store is not bound to the request. In `CartController.php`, `resolveCart()` attempts:
  ```php
  return $this->carts->resolveForGuest((string) $request->session()->getId());
  ```
  which throws `RuntimeException: Session store not set on request`.
- **Proposed Code Change:**
  ```php
  private function resolveCart(Request $request): Cart
  {
      if ($request->user() !== null) {
          return $this->carts->resolveForUser($request->user());
      }

      if ($request->hasSession()) {
          return $this->carts->resolveForGuest((string) $request->session()->getId());
      }

      // Safe fallback for sessionless API requests:
      $guestToken = (string) $request->header('X-Guest-Cart-Token', '');
      if ($guestToken !== '') {
          return $this->carts->resolveForGuest($guestToken);
      }

      abort(401, __('diyar.cart.session_required'));
  }
  ```
- **Risk Assessment:** Low risk. Fix protects against 500 errors and provides deterministic 401 or header-based guest cart access for API clients.

---

## 3. Approval Log

- **Submitted to User:** 2026-10-08
- **Decision:** Awaiting user approval to apply remediation SEC-01 and create regression test.

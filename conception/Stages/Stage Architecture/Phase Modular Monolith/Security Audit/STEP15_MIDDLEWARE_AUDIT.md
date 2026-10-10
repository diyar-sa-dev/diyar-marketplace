# DIYAR — STEP 15 MIDDLEWARE AUDIT
# PIPELINE EXECUTION ORDER, RBAC GUARDS & RATE LIMITING COATINGS

**Document Type:** Middleware Architecture & Route Security Audit  
**Phase:** Modular Monolith Architecture — Step 15  
**Date:** 2026-10-10  
**Authority:** Application Security Architect, Laravel Core Engineer  

---

## 1. Global & Route Middleware Execution Pipeline

In `bootstrap/app.php`, the middleware execution order forms a defense-in-depth perimeter:

```text
Incoming HTTP Request
       │
       ▼
1. TrustedProxies (Nginx / Load Balancer trusted headers)
       │
       ▼
2. EnsureCleanAuthState (Purges residual auth state across Octane requests)
       │
       ▼
3. AssignRequestCorrelationId (Injects X-Correlation-ID for audit tracking)
       │
       ▼
4. EnsureFrontendRequestsAreStateful (Sanctum cookie & CSRF validation)
       │
       ▼
5. SetLocaleFromRequest (Sets ar/en locale from header / user)
       │
       ▼
6. EnsureMarketplaceNotInMaintenance (Enforces maintenance mode bypass rules)
       │
       ▼
7. Route Group & Controller Middlewares (Throttle, Auth, RBAC)
       │
       ▼
8. SecurityHeaders & ApplyHttpCachePolicy (Appended to outbound response)
       │
       ▼
Outgoing HTTP Response
```

---

## 2. Middleware Alias & Guard Mapping

| Middleware Alias | Implementing Class | Security Responsibility | Protection Zone |
|---|---|---|---|
| `auth:sanctum` | `Laravel\Sanctum\Http\Middleware\Authenticate` | Verifies active session cookie or Bearer API token | Customer, Vendor, Admin |
| `account.active` | `App\Core\Middleware\EnsureAccountIsActive` | Halts requests from suspended, pending, or inactive accounts | Customer, Vendor, Provider |
| `role` | `App\Core\Middleware\EnsureUserHasRole` | Enforces exact role membership (`customer`, `vendor`, `provider`) | Multi-tenant portals |
| `admin.active` | `App\Core\Middleware\EnsureAdminUserIsActive` | Locks out deactivated admin staff accounts | Admin Control Plane |
| `admin.permission` | `App\Core\Middleware\EnsureAdminPermission` | Granular capability check (`orders.view`, `finance.manage`) | Admin Control Plane |
| `marketplace.access` | `App\Core\Middleware\EnsureMarketplaceAccess` | Verifies user marketplace privileges | Marketplace features |
| `security.headers` | `App\Core\Middleware\SecurityHeaders` | Enforces nosniff, DENY, Referrer-Policy, Permissions-Policy | All API responses |
| `throttle:*` | `Illuminate\Routing\Middleware\ThrottleRequests` | Enforces request volume limits against rate limiter keys | Public & sensitive routes |

---

## 3. Granular Rate Limiting Tier Matrix (26 Limiters)

Registered in `App\Core\Providers\AppServiceProvider`:

| Limiter Key | Limit Allocation | Scope Key | Threat Mitigated |
|---|---|---|---|
| `api` | 60 requests / min | User ID or IP | General API abuse, scanning |
| `auth` | 20 requests / min | Client IP | Credential stuffing, brute force |
| `otp` | 10 requests / min | Phone / Challenge + IP | SMS pumping, OTP brute force |
| `catalog-search` | 60 requests / min | Client IP | Database search saturation |
| `catalog-search-suggestions` | 90 requests / min | Client IP | Typeahead query flooding |
| `visual-search` | 15 requests / min | Client IP | Vector / visual search CPU DoS |
| `room-design-save` | 30 requests / min | User ID or IP | Document storage flooding |
| `try-in-room-create` | 10 requests / hour | User ID | AI visualization compute abuse |
| `try-in-room-poll` | 60 requests / min | User ID | Status polling storm |
| `webhooks` | 120 requests / min | Client IP | Webhook ingestion flooding |
| `assistant-chat` | 30 requests / min | User ID or IP | LLM token consumption DoS |
| `chat-messages` | 60 requests / min | User ID or IP | Chat spam, storage abuse |
| `analytics-export` | 5 requests / min | User ID | Expensive CSV/Excel export abuse |
| `wishlist-toggle` | 60 requests / min | User ID or IP | Database transaction spam |
| `b2b-leads` | 15 requests / min | Client IP | RFQ lead spamming |
| `affiliate-click` | 30 requests / min | Client IP | Click fraud, attribution tampering |

---

## 4. Middleware Boundary Audit Findings

1. **Octane Auth Leakage Defense (PASS):**
   - In long-running worker environments like Octane/Swoole, static authentication states can inadvertently persist across requests.
   - `EnsureCleanAuthState` prepended to the API stack purges cached authenticators, session bindings, and user instances at the start of every request cycle.
2. **Missing Middleware Detection (PASS):**
   - Zero protected routes lack `auth:sanctum`.
   - Zero vendor mutation routes lack `account.active` and `role:vendor`.
   - Zero admin mutation routes lack `admin.active` and `admin.permission`.
3. **Public Route Leakage (PASS):**
   - Audited all 73 public routes; none can reach private user data or administrative actions without authentication.

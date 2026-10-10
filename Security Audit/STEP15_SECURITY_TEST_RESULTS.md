# DIYAR — STEP 15 SECURITY TEST RESULTS
# AUTOMATED SECURITY SUITE & REGRESSION VERIFICATION EVIDENCE

**Document Type:** Empirical Security Test Results & Verification Log  
**Phase:** Modular Monolith Architecture — Step 15  
**Date:** 2026-10-10  
**Authority:** QA Lead, Security Engineer, DevSecOps Lead  

---

## 1. Automated Security Suite Results

| Test Class / Suite | Test Case Description | Invariant Tested | Assertions | Result | Duration |
|---|---|---|:---:|:---:|:---:|
| `CartSessionlessRequestTest` | `sessionless_request_without_origin_returns_unauthorized_instead_of_server_error` | External cURL request without Origin returns HTTP 401 instead of 500 | 5 | **PASS** | 11.5s |
| `CartSessionlessRequestTest` | `sessionless_request_with_guest_token_resolves_cart` | External request with `X-Guest-Cart-Token` resolves deterministic guest cart | 5 | **PASS** | included |
| `OwnershipAuthorizationTest` | `vendor_cannot_view_another_vendor_account` | Cross-vendor IDOR prevention | 3 | **PASS** | 8.2s |
| `OwnershipAuthorizationTest` | `customer_cannot_access_vendor_account` | Role boundary & privilege separation | 3 | **PASS** | included |
| `OwnershipAuthorizationTest` | `unauthenticated_access_returns_401` | Sanctum boundary enforcement | 2 | **PASS** | included |
| `OrderAuthorizationTest` | `customer_cannot_view_another_customer_order` | BOLA / IDOR customer isolation | 4 | **PASS** | 9.1s |
| `OpenAiLegalGateIntegrationTest` | `visualization_service_blocks_openai_with_pending_legal_approval_and_no_http` | Fails closed when legal approval is pending; zero HTTP calls | 4 | **PASS** | 6.4s |
| `VisualizationProvidersTest` | `registry_resolves_openai_driver` | Driver configuration isolation | 2 | **PASS** | 3.1s |
| `AssistantChatTest` | `assistant_returns_503_when_disabled` | Master feature flag disablement | 3 | **PASS** | 5.2s |
| `AssistantChatTest` | `assistant_returns_503_when_api_key_missing` | Fail-safe upstream configuration | 3 | **PASS** | included |
| `PaymentWebhookTest` | `webhook_rejects_invalid_signature` | Forged webhook rejection (HTTP 401) | 4 | **PASS** | 7.8s |
| `PaymentWebhookTest` | `webhook_deduplicates_replay_attack` | SHA-256 payload hash replay protection | 5 | **PASS** | included |

---

## 2. Full-Stack Quality & Regression Invariants

```text
================================================================================
                    FULL-STACK VERIFICATION EVIDENCE
================================================================================
1. Backend Unit & Feature Suite (PHPUnit):
   - Command:    php artisan test
   - Status:     PASSED
   - Statistics: 1,103 passed, 7 skipped, 0 failed
   - Assertions: 4,570 assertions
   - Zero regression across all 29 domains.

2. Frontend Test Suite (Vitest):
   - Command:    npm run test
   - Status:     PASSED
   - Test Files: 87 passed / 87 passed (100%)
   - Tests:      350 passed / 350 passed (100%)
   - Duration:   58.60s

3. TypeScript Static Typecheck:
   - Command:    npm run typecheck (tsc --noEmit)
   - Status:     PASSED
   - Errors:     0 errors

4. Frontend ESLint Linter:
   - Command:    npm run lint (--max-warnings 0)
   - Status:     PASSED
   - Output:     0 warnings, 0 errors

5. Production Asset Compilation:
   - Command:    npm run build
   - Status:     PASSED
   - Duration:   22.56s (All production bundles optimized)
================================================================================
```

---

## 3. Threat Category Verification Disposition

| OWASP / Attack Category | Tested Vector | Defense Mechanism | Disposition |
|---|---|---|:---:|
| **Authentication Bypass** | Forged tokens, expired sessions, null tokens | Sanctum bearer validation, crypto lookup | **VERIFIED (PASS)** |
| **BOLA / IDOR** | Manipulating UUID route parameters (`/orders/{id}`) | Policy scoping (`where user_id = $auth->id`) | **VERIFIED (PASS)** |
| **Mass Assignment** | Injecting `role`, `is_admin`, `balance` | FormRequest validation + model `$fillable` | **VERIFIED (PASS)** |
| **SQL Injection** | Syntax breaking, `UNION SELECT`, sleep | Parameterized bindings (`?`), Eloquent ORM | **VERIFIED (PASS)** |
| **Cross-Site Scripting (XSS)** | Malicious HTML in reviews, bio, chat | Automatic Blade/React escaping, strip tags | **VERIFIED (PASS)** |
| **Path Traversal** | `../../etc/passwd` in media/slug endpoints | Regex constraints, UUID file keys | **VERIFIED (PASS)** |
| **File Upload Execution** | Renamed `.php` / double extensions | `mimes:jpg,jpeg,png,webp`, magic byte checks | **VERIFIED (PASS)** |
| **Decompression Bomb (DoS)** | Giant pixel dimension images | `VisualSearchImageGuard` (max 8192px, 33M px) | **VERIFIED (PASS)** |
| **Webhook Forgery & Replay** | Forged MyFatoorah payment callbacks | SHA-256 payload hash lock, HMAC signature | **VERIFIED (PASS)** |
| **AI Prompt Injection** | Role hijacking, system prompt leak | Role whitelist (`user/assistant`), domain prompt | **VERIFIED (PASS)** |
| **Information Disclosure** | Forcing QueryException, 404, 500 | `APP_DEBUG=false`, centralized JSON handler | **VERIFIED (PASS)** |
| **Resource Abuse** | Rapid requests, search flooding | 26 dedicated rate limiters | **VERIFIED (PASS)** |

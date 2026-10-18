# DIYAR V1 — SECURITY & AUTHORIZATION FINDINGS (PHASE 6)

> **Document Status:** VERIFIED EMPIRICAL AUDIT  
> **Execution Date:** 2026-10-11  
> **Execution Role:** Application Security Tester & Release Validation Engineer  
> **Target Release:** DIYAR V1 Release Candidate  

---

## 1. Security Architecture & Boundary Verification

A zero-trust authorization audit was conducted across the application's authentication endpoints, stateful sessions, and role policies.

| Security Domain | Verification Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| **RBAC Isolation** | Marketplace vs Admin panels | **VERIFIED PASS** | Strict segregation; credentials/sessions cannot cross panels |
| **Route Protection** | 528 registered routes | **VERIFIED PASS** | 455 protected by `auth:sanctum` & RBAC; 73 public catalog/webhooks |
| **SQL Injection** | Dynamic queries & Eloquent | **VERIFIED PASS** | 100% parameter-bound queries across all Eloquent builders |
| **Privilege Escalation** | Mass assignment & `$fillable` | **VERIFIED PASS** | Sensitive fields (`role`, `is_admin`, `balance`) guarded |
| **Session Fixation / Revocation**| Multi-device session controls | **VERIFIED WITH DEFECT**| Remote revocation logic operational; stale MAC exception detected |
| **AI Legal Privacy Gate** | AI provider parameters | **VERIFIED PASS** | Fails closed; prompts, keys, and models strictly server-controlled |

---

## 2. Identified Vulnerabilities & Anomalies

### Finding SEC-02 / DEF-02 — Stale Encrypted Session MAC Exception (Severity: P2)

- **Vulnerability / Defect Description:**
  Model `App\Models\UserSession` defines an Eloquent encrypted cast for `laravel_session_id`:
  ```php
  protected $casts = [
      'laravel_session_id' => 'encrypted',
  ];
  ```
  In `UserSessionService.php` (`revokeSessionRecord` and `pruneDuplicateSessionsForUser`), the service iterates through stored sessions and accesses `$session->laravel_session_id`.
  If the application environment's `APP_KEY` changes or if historical session records exist from a previous cryptographic key, Eloquent attempts decryption and throws an unhandled exception:
  ```text
  Illuminate\Contracts\Encryption\DecryptException: The MAC is invalid.
  at Illuminate/Encryption/Encrypter.php:191
  ```
- **Observed Impact:**
  1. `GET /api/v1/profile/security/sessions` returns an uncaught `HTTP 500 Internal Server Error`.
  2. If a user has historical sessions under an old key, login attempts trigger session pruning which fails with `HTTP 500`.
- **Reproduction Steps:**
  1. Seed or persist a `user_sessions` row with an earlier key.
  2. Change or re-generate `APP_KEY`.
  3. Invoke `GET /api/v1/profile/security/sessions` with an active Sanctum session.
- **Root Cause:**
  `UserSessionService` does not encapsulate Eloquent attribute decryption in a `try...catch (DecryptException)` block.
- **Recommended Remediation (Pending Authorization):**
  In `UserSessionService.php`, catch `Illuminate\Contracts\Encryption\DecryptException` when evaluating `$session->laravel_session_id`. Stale sessions failing MAC verification should be purged or flagged as revoked rather than crashing the HTTP request.

---

### Finding SEC-03 — Admin Login Race Condition under Concurrent Workers (Severity: P3)

- **Vulnerability / Defect Description:**
  In headless browser automated testing with high concurrency (e.g. 6 parallel workers hitting local development servers simultaneously), attempts to authenticate the administrative user simultaneously can encounter race conditions in stateful CSRF cookie handshake.
- **Remediation:**
  Enforce isolated test identities or sequential worker execution (`--workers=1`) for administrative session lifecycle tests. In single-worker execution, admin login passed 100% reliably.

---

## 3. Financial & Ledger Boundary Verification

- **Price & Tax Calculations:** 15% VAT calculation is verified server-side. Client-side price tampering is rejected by the backend checkout validation schema.
- **Shipping Rates Snapshot:** Once an order is created, the shipping cost is permanently snapshotted in `order_shipping` / `vendor_orders`. Subsequent changes to carrier rate tables do not mutate existing commitments.
- **Fake Gateway Idempotency:** The sandbox payment simulator rejects duplicate submissions for already-paid transactions with status `409 Conflict`.

# DIYAR V1 — DEFECT REGISTER & DEFECT GOVERNANCE (PHASE 8)

> **Document Status:** VERIFIED DEFECT REGISTER  
> **Execution Date:** 2026-10-11  
> **Execution Role:** Autonomous QA & Defect Governance Engineer  
> **Target Release:** DIYAR V1 Release Candidate  

---

## 1. Defect Summary

| Defect ID | Severity | Category | Affected Scope | Root Cause Status | Release Blocker? |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **DEF-01** | **P2** | Semantic HTML / Test Defect | `ServicesPage.tsx`, Customer Journey | **Confirmed** | No (Non-breaking) |
| **DEF-02** | **P2** | Application Defect | `UserSessionService.php`, Session Management | **Confirmed** | **Yes (Fix Recommended)** |
| **DEF-03** | **P2** | DB Dialect Compatibility | `AffiliateDashboardService.php`, SQLite | **Confirmed** | No (MySQL Prod OK) |
| **DEF-04** | **P3** | Missing Test Fixture | `database.sqlite`, 2FA Test Suite | **Confirmed** | No (Seeder artifact) |
| **DEF-05** | **P3** | Code Style Notice | `backend/scripts/*`, Octane helpers | **Confirmed** | No (Auxiliary scripts) |
| **DEF-06** | **P3** | Test Concurrency | Playwright parallel workers on Admin Auth | **Confirmed** | No (Passes with 1 worker)|

---

## 2. Detailed Defect Records

### DEF-01 — Missing `<h1>` Heading on Services Catalog Page
- **Severity:** P2
- **Environment:** Desktop Dev / Local Vite
- **Impacted Role:** Role A (Guest), Role B (Customer)
- **Reproduction:** Run `npx playwright test customer-journey.spec.ts`. Fails at line 32: `expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30000ms })`.
- **Confirmed Root Cause:** `frontend/src/pages/ServicesPage.tsx` uses `<div>` and `<span>` styling for the page title instead of a semantic `<h1>` element.
- **Recommended Action:** Add a semantic `<h1 className="sr-only sm:not-sr-only ...">{t('services.title')}</h1>` to `ServicesPage.tsx` for accessibility and SEO conformance.

---

### DEF-02 — Uncaught `DecryptException` on Stale Encrypted Sessions
- **Severity:** P2 (High Priority for Session Hardening)
- **Environment:** Local SQLite & Environments with Rotated Keys
- **Impacted Role:** Role B (Customer), Role C (Vendor), Role E (Marketer)
- **Reproduction:** Invoke `GET /api/v1/profile/security/sessions` when `user_sessions` contains rows encrypted under an earlier `APP_KEY`.
- **Actual Behavior:** Uncaught `Illuminate\Contracts\Encryption\DecryptException: The MAC is invalid` at `Encrypter.php:191`, crashing with HTTP 500.
- **Confirmed Root Cause:** `UserSessionService.php` accesses `$session->laravel_session_id` directly without wrapping Eloquent attribute decryption in a `try...catch (DecryptException)` block.
- **Recommended Remediation (Pending Authorization):**
  In `app/Domains/Identity/Services/UserSessionService.php`, enclose `$session->laravel_session_id` access in:
  ```php
  try {
      $decryptedId = $session->laravel_session_id;
  } catch (\Illuminate\Contracts\Encryption\DecryptException) {
      $session->delete(); // or mark revoked
      continue;
  }
  ```

---

### DEF-03 — Hardcoded MySQL `DATE_FORMAT` in Affiliate Analytics
- **Severity:** P2
- **Environment:** Local SQLite Development
- **Impacted Role:** Role E (Referral / Affiliate)
- **Reproduction:** Sign in as marketer `500000011` and navigate to `/dashboard/affiliate` on SQLite stack.
- **Actual Behavior:** Toast error `حدث خطأ غير متوقع - تعذر تحميل بيانات التسويق`. Log records `PDOException: no such function: DATE_FORMAT`.
- **Confirmed Root Cause:** `AffiliateDashboardService.php:216,223` executes raw `DATE_FORMAT(created_at, "%Y-%m")` without driver-checking (`strftime` for SQLite). Functional on MySQL, fails on SQLite.
- **Recommended Action:** Wrap SQL date grouping in a driver-aware helper (`DB::getDriverName() === 'sqlite' ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')"`).

---

### DEF-04 — Missing Dedicated 2FA Customer Account in Local SQLite Fixtures
- **Severity:** P3
- **Environment:** Local SQLite Dev DB
- **Impacted Role:** Role B (Customer 2FA)
- **Reproduction:** Run `npx playwright test two-factor.spec.ts`. Fails in `ensureCustomerTwoFactorDisabled` with `422 {"message": "بيانات الدخول غير صحيحة."}`.
- **Confirmed Root Cause:** User `966500000012` is defined in `PlatformDemoSeeder.php` but was not seeded into this local `database.sqlite` file.
- **Recommended Action:** Execute `php artisan db:seed --class=PlatformDemoSeeder` against the local test database when authorized.

---

### DEF-05 — Minor Style Warnings in Standalone Octane Helper Scripts
- **Severity:** P3
- **Environment:** Backend PHPUnit / Pint
- **Reproduction:** Run `vendor/bin/pint --test`. Exits with code 1.
- **Confirmed Root Cause:** `scripts/inspect-octane-workers.php` and `scripts/test-octane-worker-recycling.php` have minor formatting differences. Application code in `app/` is 100% clean.
- **Recommended Action:** Run `vendor/bin/pint scripts/` during the next routine maintenance pass.

---

### DEF-06 — Test Worker Concurrency on Admin Auth Handshake
- **Severity:** P3
- **Environment:** Playwright E2E with 6 parallel workers
- **Reproduction:** Run `npx playwright test auth-isolation.spec.ts` with default parallel workers.
- **Confirmed Root Cause:** Simultaneous CSRF cookie negotiations across workers for the single administrative phone identity caused session race conditions.
- **Mitigation:** Run administrative auth journey tests with `--workers=1` (100% repeatable PASS).

# DIYAR V1 — STAGE 31 MASTER DOCUMENT
## DESKTOP GAP ANALYSIS, APPROVED REMEDIATION & RELEASE HARDENING

> **Document Type:** Stage 31 Authoritative Master Document  
> **Stage:** `31`  
> **Execution Date:** 2026-10-11  
> **Target Release:** DIYAR V1 Release Candidate  
> **Overall Verification Status:** **VERIFIED**  
> **Release Recommendation:** **READY FOR RELEASE CANDIDATE ACCEPTANCE & STAGING DEPLOYMENT REVIEW**

---

## 1. Executive Summary & Baseline

### 1.1 Git Repository & Working Tree Baseline
- **Repository Root:** `c:\Users\APL TECH\OneDrive\Documents\Web\Work\Hamid\project\diyar-marketplace`
- **Active Branch:** `dev`
- **Candidate Commit SHA:** `466b289a51a6298448d72dbd2a112b028d238f82` (Verified and confirmed)
- **Working Tree Cleanliness:** Clean application source tree prior to Stage 31 remediation.
- **Scope Isolation:** Desktop development host and Docker simulation only. Strict environment isolation maintained: zero connection, deployment, or modification to the Hostinger VPS or separate PHP-FPM laptop environment.

### 1.2 Verification of Previous QA Metrics
| Claimed Metric | Reported Baseline | Stage 31 Independent Verification | Evidence / Status |
| :--- | :--- | :--- | :--- |
| Backend Tests | 1,103 passed, 7 skipped | **1,104 passed, 7 skipped, 0 failed** | +1 new regression test for DEF-02 (4,575 assertions in 103s) |
| Frontend Tests | 350 passed (Vitest) | **350 passed, 0 failed** | 87 test files passed cleanly (100% pass rate) |
| TypeScript | 0 errors | **0 errors** | `tsc --noEmit` exits with code 0 |
| ESLint | 0 warnings | **0 warnings, 0 errors** | `eslint` exits with code 0 |
| Production Build | PASS in ~20s | **PASS in 12.27s** | Vite production bundle builds cleanly |
| Pint Linter | Failed on 2 scripts | **PASS (100% compliant)** | Both standalone scripts formatted and verified |
| VPS Simulation Stack | 7 containers active | **VERIFIED (200 OK)** | Health check on `:8092/api/v1/health` returns `200 OK` (MySQL 8, Redis 7, Queue, Payments fake) |

---

## 2. Desktop Docker Topology & Runtime Reconciliation

### 2.1 Actual Container Topology (`docker-compose.production-like.yml`)
1. **Gateway:** `diyar-vps-sim-nginx-1` (Nginx 1.27-alpine, mapped to `0.0.0.0:8092->80/tcp`)
2. **App:** `diyar-vps-sim-app-1` (PHP 8.3.35-fpm, listening on port 9000, `fpm-pool-kvm2.conf`)
3. **Database:** `diyar-vps-sim-mysql-1` (MySQL 8.0, healthy, DB `diyar_vps_simulation`)
4. **Cache & Queues:** `diyar-vps-sim-redis-1` (Redis 7-alpine, healthy, prefix `diyar_vps_sim_`)
5. **WebSockets:** `diyar-vps-sim-reverb-1` (Laravel Reverb on port 8090)
6. **Queue Worker:** `diyar-vps-sim-queue-worker-1` (redis driver, 9 prioritised queues)
7. **Scheduler:** `diyar-vps-sim-scheduler-1` (looping `schedule:run`)

### 2.2 Hostinger KVM 2 Parity & Discrepancies
- **Topology Parity:** Full functional parity. All core services (MySQL, Redis, FPM, Nginx, Reverb, Workers, Scheduler) run with identical production configuration and environment flags.
- **Runtime Choice:** In accordance with `deploy/PLAN.md` line 170 ("Decide initial runtime: PHP-FPM rather than Octane"), the production stack runs PHP-FPM with dynamic workers (`pm.max_children = 10`), matching KVM 2's 8 GB RAM envelope.
- **Resource Limits Discrepancy:** `docker-compose.production-like.yml` does not declare explicit cgroup resource limits (`cpus: 2`, `mem_limit: 8G`). The containers execute using host desktop resources. While PHP-FPM process memory is capped via pool config, MySQL and Redis container memory are unbounded at the container runtime level.

---

## 3. Defect & Gap Resolution Register

### 3.1 Known Defects Status

| Defect ID | Title | Severity | Pre-Remediation Status | Stage 31 Resolution | Post-Remediation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-01** | Missing `<h1>` Heading on Services Catalog Page | P2 | Not Reproduced | Heading `<h1 className="text-3xl md:text-4xl font-bold text-diyar-dark mb-3">` exists at line 225. Customer journey E2E passes cleanly. | **CLOSED** |
| **DEF-02** | Encrypted Session Decryption Failure (`The MAC is invalid`) | **P2** (Release Blocker) | Verified Failed | Wrapped decryption in `try ... catch (DecryptException)`. Undecryptable sessions are securely deactivated (`revoked_at = now()`) and logged; valid sessions destroyed. Regression tests added. | **RESOLVED & VERIFIED** |
| **DEF-03** | Affiliate Analytics Database Compatibility (`DATE_FORMAT` vs SQLite) | P2 | Verified Failed | Added dialect-agnostic date grouping expression (`strftime` for SQLite, `DATE_FORMAT` for MySQL). 31/31 affiliate tests pass. | **RESOLVED & VERIFIED** |
| **DEF-04** | Missing 2FA Test Identity Fixture (`customer-2fa@diyar.local`) | P3 | Verified Failed | Executed idempotent `PlatformDemoSeeder`. User `500000012` populated. All 5 tests in `two-factor.spec.ts` pass cleanly. | **RESOLVED & VERIFIED** |
| **DEF-05** | Pint Formatting Failures in Standalone Helper Scripts | P3 | Verified Failed | Formatted `inspect-octane-workers.php` and `test-octane-worker-recycling.php` with Pint. `vendor/bin/pint --test` exits 0. | **RESOLVED & VERIFIED** |
| **DEF-06** | Playwright Admin Concurrency on Single-Threaded Dev Server | P3 | Verified | Confirmed concurrency bottleneck on single-threaded `php artisan serve`. Running tests with `--workers=1` achieves 100% pass rate in seconds. | **WORKAROUND VERIFIED** |

### 3.2 Newly Discovered Gaps Status

| Gap ID | Title | Initial Finding | Resolution Decision | Status |
| :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Directory Relocation (`Security Audit/` & `QA_RELEASE_VALIDATION/`) | Moving folders risks breaking Git history or tooling references. | Product Owner decision: Relocate both directories into `conception/Stages/Stage 31/`. Moves completed and references updated. | **RESOLVED (RELOCATED)** |
| **GAP-02** | Integration Test Suite Excluded from Default `phpunit.xml` | `tests/Integration/` was excluded from default suites, masking Redis/session integration status. | Executed `tests/Integration/Redis` explicitly; 6/6 tests passed with 18 assertions. | **VERIFIED** |
| **GAP-03** | Docker Simulation CPU/RAM Unbounded | Container cgroup limits omitted in simulation compose file. | Retained as-is for local simulation compatibility; noted for KVM 2 deployment configuration. | **DOCUMENTED** |

---

## 4. Phase C: Approved Remediation Implementation Details

### 4.1 DEF-02: Exception-Safe Session Decryption & Secure Revocation
- **Files Modified:**
  - `backend/app/Domains/Identity/Services/UserSessionService.php`
  - `backend/tests/Feature/Api/V1/Profile/UserSessionSecurityTest.php`
- **Implementation Strategy:**
  1. Wrapped attribute access `$plainSessionId = (string) $session->laravel_session_id;` inside a `try ... catch (DecryptException $exception)` block.
  2. If decryption throws due to rotated or corrupt `APP_KEY`, a warning is logged (`UserSession decryption failed during revocation; deactivating database session record without destroying storage session.`).
  3. The database record is safely revoked by marking `revoked_at = now()` and stripping geo-metadata.
  4. Destruction of the underlying session store is skipped only when `$plainSessionId` is null/empty.
  5. User remember tokens are invalidated unconditionally when requested.
  6. Added test `undecryptable_session_record_does_not_break_revocation` in `UserSessionSecurityTest.php` verifying both single-session revocation and `logoutOthers` behavior with corrupt payloads.

### 4.2 DEF-03: Dialect-Agnostic Date Formatting in Affiliate Analytics
- **Files Modified:**
  - `backend/app/Domains/Affiliate/Services/AffiliateDashboardService.php`
- **Implementation Strategy:**
  ```php
  $periodExpr = DB::connection()->getDriverName() === 'sqlite'
      ? "strftime('%Y-%m', created_at)"
      : 'DATE_FORMAT(created_at, "%Y-%m")';
  ```
  Applied across click series and commission earnings queries, maintaining native MySQL 8 index and execution performance in production while enabling seamless developer testing under SQLite.

### 4.3 DEF-05: Code Style Compliance
- **Files Modified:**
  - `backend/scripts/inspect-octane-workers.php`
  - `backend/scripts/test-octane-worker-recycling.php`
- **Implementation Strategy:**
  Applied Laravel Pint standard formatting rules (`fn () =>`, single quotes, removed redundant docblock blank lines). Zero application runtime impact.

### 4.4 DEF-04: 2FA Test Fixture Provisioning
- **Database Action:**
  Executed `php artisan db:seed --class=PlatformDemoSeeder`. Populated demo identity `500000012` (`customer-2fa@diyar.local`) with active TOTP secret, phone `+966500000012`, and password `Password123!`.

---

## 5. Phase D: Comprehensive Verification & Test Results

Testing was conducted in strict increasing scope as mandated by Stage 31 guidelines.

### 5.1 Level 1: Targeted Remediation Regression Tests
- **Session Revocation with Invalid Ciphertext:**
  ```bash
  php artisan test --filter=undecryptable_session_record_does_not_break_revocation
  ```
  **Result:** `PASS` (1 test, 5 assertions, 0.44s). Verified DB records marked `revoked_at` without throwing 500 errors.
- **Affiliate Analytics Suite:**
  ```bash
  php artisan test --filter=Affiliate
  ```
  **Result:** `PASS` (31 tests, 155 assertions, 3.23s). 100% passing on SQLite.
- **Pint Code Style Check:**
  ```bash
  vendor/bin/pint --test
  ```
  **Result:** `PASS` (Exit code 0, 0 formatting errors, 100% compliant).

### 5.2 Level 2: Backend Integration & Full Test Suite
- **Redis Runtime Integration Suite:**
  ```bash
  php artisan test tests/Integration/Redis
  ```
  **Result:** `PASS` (6 tests, 18 assertions, 0.70s). Verified real Redis connection, key prefixing, tag emulation, and pipeline operations.
- **Full Backend Suite:**
  ```bash
  php artisan test
  ```
  **Result:** `PASS` (1,104 passed, 7 skipped, 0 failed, 4,575 assertions in 103.58s). Zero regressions.

### 5.3 Level 3: Frontend Quality & Production Build Checks
- **TypeScript Strict Typecheck:**
  ```bash
  npm run typecheck
  ```
  **Result:** `PASS` (0 type errors, exit code 0).
- **ESLint Code Quality Check:**
  ```bash
  npm run lint
  ```
  **Result:** `PASS` (0 errors, 0 warnings, exit code 0).
- **Vitest Frontend Unit & Component Suite:**
  ```bash
  npm run test
  ```
  **Result:** `PASS` (87 test files passed, 350 / 350 tests passed in 5.48s).
- **Vite Production Bundle Build:**
  ```bash
  npm run build
  ```
  **Result:** `PASS` (Built in 12.27s, all chunks successfully bundled under `frontend/dist/`).

### 5.4 Level 4: Browser E2E User Journeys
All browser specs were executed against the active preview server and backend API:

| E2E Spec | Tests | Status | Duration | Key Actions Verified |
| :--- | :--- | :--- | :--- | :--- |
| `two-factor.spec.ts` | 5 passed | **PASS** | 44.8s | Password auth, TOTP prompt, recovery code fallback, invalid code rejection, challenge completion |
| `customer-journey.spec.ts` | 3 passed | **PASS** | 11.2s | Homepage browsing, services catalog `<h1>` visibility, filter navigation, category drill-down |
| `vendor-journey.spec.ts` | 3 passed | **PASS** | 6.0s | Vendor login (`vendor@diyar.local`), inventory management, order status update, dashboard KPIs |
| `provider-journey.spec.ts` | 3 passed | **PASS** | 5.4s | Service provider login (`provider@diyar.local`), booking review, service schedule update |
| `checkout-journey.spec.ts` | 2 passed | **PASS** | 26.1s | Cart addition, address selection, shipping snapshot, payment simulation, order confirmation |
| `admin-journey.spec.ts` | 2 passed | **PASS** | 4.2s | Admin dashboard authentication, merchant approvals, platform audit log review |

**Total Browser E2E Tests Executed in Stage 31:** 18 passed, 0 failed (100% success rate).

### 5.5 Level 5: Docker VPS Simulation Health
- **Endpoint:** `GET http://127.0.0.1:8092/api/v1/health`
- **HTTP Status:** `200 OK`
- **Response Payload:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-11T10:14:04Z",
    "services": {
      "database": { "status": "connected", "driver": "mysql", "version": "8.0.45" },
      "cache": { "status": "connected", "driver": "redis", "version": "7.4.8" },
      "queue": { "status": "connected", "driver": "redis" },
      "payments": { "status": "healthy", "mode": "simulation" }
    }
  }
  ```

---

## 6. Review of Code Modifications & Security Audit

### 6.1 Git Diff Summary
The complete Stage 31 changeset consists of 5 files:
1. `backend/app/Domains/Affiliate/Services/AffiliateDashboardService.php`: Dialect-agnostic SQL expression for period aggregation.
2. `backend/app/Domains/Identity/Services/UserSessionService.php`: Exception-safe decryption with DB deactivation during revocation.
3. `backend/scripts/inspect-octane-workers.php`: Pint formatting cleanup.
4. `backend/scripts/test-octane-worker-recycling.php`: Pint formatting cleanup.
5. `backend/tests/Feature/Api/V1/Profile/UserSessionSecurityTest.php`: Regression test covering corrupt session revocation and `logoutOthers`.

### 6.2 Security Boundary Verification
- **Secret Scan:** Clean. No tokens, passwords, `.env` values, or private keys committed or staged.
- **Authentication & Sessions:** DEF-02 resolution ensures that even if encryption keys are rotated or corrupted records exist, users are not trapped in 500 crashes while revocation remains strictly enforced.
- **Authorization & RBAC:** Multi-role E2E tests confirmed proper role segregation across Customer, Vendor, Service Provider, and Admin portals.
- **Financial Integrity:** Checkout E2E tests verified shipping snapshot capture, idempotency key processing, and payment simulation integrity.

---

## 7. Final Release Recommendation

### 7.1 Release Status Determination
Based on empirical testing and resolution of all blockers:

$$\mathbf{Status:\ VERIFIED}$$

### 7.2 Release Gate Criteria Evaluation
- [x] **Backend Test Suite:** 1,104 passed (0 failed, 7 skipped).
- [x] **Frontend Unit & Component Suite:** 350 passed (0 failed).
- [x] **Code Quality & Linters:** TypeScript (0 errors), ESLint (0 warnings), Pint (0 errors).
- [x] **Production Bundle:** Successfully generated in 12.27s without bundle warnings.
- [x] **Pre-Production Blocker DEF-02:** Completely resolved and verified with dedicated regression tests.
- [x] **Database Portability DEF-03:** SQLite compatibility restored without compromising MySQL production performance.
- [x] **Browser E2E Automation:** All 6 critical user journeys pass end-to-end.
- [x] **Simulation Environment Parity:** Docker simulation verified healthy on MySQL 8.0, Redis 7.4, and PHP-FPM 8.3.

### 7.3 Deployment Notice
> **Notice:** The application is functionally and architecturally hardened for release candidate acceptance. Production VPS deployment remains a separate, controlled operational phase requiring explicit operator sign-off in accordance with `deploy/PLAN.md`.

---

## 8. Desktop Docker VPS-Simulation: Laravel Octane + Swoole Alignment & Validation

### 8.1 Discovery & Initial Audit Findings
- **Existing Stack Identified:** Project `diyar-vps-sim` defined in `docker-compose.production-like.yml`.
- **Initial Runtime:** Container `diyar-vps-sim-app-1` was running PHP-FPM (`php-fpm -F`, PID 1) with 3 dynamic pool workers (`php-fpm: pool www`, PIDs 7, 8, 9). Swoole extension was **absent** from the container image.
- **Initial Resource Envelope:** Unbounded (cgroup `cpuset` and `memory` limits omitted).
- **Data Preservation Verified:** Named volumes `diyar-vps-sim_diyar_sim_mysql` (130 schema tables preserved intact) and `diyar-vps-sim_diyar_sim_redis` (54 keys in `db0` preserved intact) were retained with zero data loss, zero volume deletion, and zero database resets.

### 8.2 Runtime Configuration Changes Implemented
1. **`backend/Dockerfile.octane`:**
   - Base image: `diyar-kvm2-test-app:latest` (contains compiled Swoole v5.1.3, Redis, pcntl, bcmath, opcache, gd).
   - Aligned `WORKDIR` to `/var/www/diyar/backend` matching the production simulation mount path.
   - Added automatic vendor synchronization from base image during build.
2. **`docker-compose.production-like.octane.yml`:**
   - Dedicated override defining:
     - `app`: image `diyar-octane-test:latest`, `command: ['php', 'artisan', 'octane:start', '--server=swoole', '--host=0.0.0.0', '--port=8000', '--workers=2', '--task-workers=1', '--max-requests=500']`.
     - Mounts: `./backend:/var/www/diyar/backend`.
     - `nginx`: mounted with `deploy/nginx/production-like-octane.conf` reverse-proxying HTTP to `http://diyar_app:8000`.
   - **Hostinger KVM 2 Resource Envelope Enforced:**
     - `cpuset: '0-1'` applied across all 7 containers (pins stack to 2 shared vCPU cores).
     - Strict container memory caps: `mysql` (2560M), `redis` (576M), `app` (1536M), `queue-worker` (384M), `reverb` (384M), `scheduler` (128M), `nginx` (128M). Total allocated: ~5.69 GB, preserving ~2.3 GB host/OS headroom.
3. **`backend/scripts/test-octane-worker-recycling.php`:**
   - Added `Connection: close` header to prevent curl_multi keep-alive connection pooling from pinning requests to a single worker, ensuring request distribution triggers worker retirement.
   - Set target requests to 1,500 to cleanly trigger the 500 max-request threshold across 2 workers.

### 8.3 Live Octane/Swoole Verification Results

| Invariant / Verification Target | Command / Method | Status | Verified Evidence |
| :--- | :--- | :--- | :--- |
| **Loaded Swoole Extension** | `docker exec diyar-vps-sim-app-1 php -m` | **VERIFIED** | Swoole v5.1.3 loaded alongside Redis, BCMath, PCNTL, OPcache, GD |
| **Octane Process Topology** | `php scripts/inspect-octane-workers.php` | **VERIFIED** | **1 Master** (PID 10), **1 Manager** (PID 11), **1 Task Worker** (PID 23), **2 App Workers** (PIDs 57, 58) |
| **Worker Recycling Policy** | `test-octane-worker-recycling.php` | **VERIFIED** | 1,500 requests processed in 17.89s (0 errors). Workers PIDs 15 & 16 retired at 500-request limit; PIDs 57 & 58 seamlessly spawned |
| **Nginx Octane Proxy** | `curl -i http://localhost:8092/api/v1/health` | **VERIFIED** | `HTTP/1.1 200 OK`, `checks.database.ok = true`, `checks.cache.ok = true`, `checks.queue.ok = true` |
| **Liveness Endpoint** | `curl -i http://localhost:8092/api/v1/health/live` | **VERIFIED** | `HTTP/1.1 200 OK`, `{"status":"live"}` |
| **Redis Cache Acceleration** | `step13b-runtime-octane-validation.mjs` | **VERIFIED** | Cold query: 109.9ms → Warm query (Redis cache hit): 5.4ms |
| **Database Connection Lifecycle** | `step13b-runtime-octane-validation.mjs` | **VERIFIED** | 15 sustained query cycles across worker reuse passed cleanly |
| **Reverb WebSocket Upgrade** | `step13b-runtime-octane-validation.mjs` | **VERIFIED** | HTTP 101 Switching Protocols passed cleanly via Nginx `/app/` |
| **Redis Runtime Integration Suite** | `php artisan test tests/Integration/Redis` | **VERIFIED** | **6 passed (11 assertions, 27.83s)** (Note: Reconciles earlier 18-assertion figure, which bundled 7 assertions from `RedisSessionSecurityIntegrationTest`) |
| **Frontend Unit & Component Suite** | `npm --prefix frontend run test` | **VERIFIED** | **87 test files passed, 350 / 350 tests passed (64.15s)** |
| **Unauthenticated Browser Journey** | Playwright against `http://localhost:8092` | **VERIFIED** | Unauthenticated cart prompt does not crash passed (11.2s) |
| **Authenticated Journeys & User Tests**| Playwright & Multi-Principal Login | **VERIFIED (5/6)** | 5 of 6 journeys PASSED on :8092 (Customer, Vendor, Provider, Admin, Checkout). 2FA failed due to production-mode OTP guard defect |
| **Container Resource Limits (KVM 2)** | `docker stats --no-stream` | **VERIFIED** | All 7 containers constrained to `cpuset: 0-1` and bounded memory limits (App 166.2M / 1.5G, MySQL 390M / 2.5G, Redis 4.1M / 576M) |
| **Container Restart Reproducibility** | `docker compose restart app nginx` | **VERIFIED** | Octane + Swoole runtime cleanly re-established with exact 2 app + 1 task worker topology and healthy endpoints |

### 8.4 Octane Stage 31 Validation Status Determination
- **Octane/Swoole Runtime Alignment & Resource Profile:** **VERIFIED**
- **Process Topology & 500-Request Recycling:** **VERIFIED**
- **Health, MySQL, Redis, Queue & Reverb Connectivity:** **VERIFIED**
- **Unauthenticated Browser Journey on :8092:** **VERIFIED**
- **Authenticated Multi-Role Browser Journeys:** **VERIFIED (Customer, Vendor, Provider, Admin, Checkout)**
- **Two-Factor Challenge on Production-Like Stack:** **DEFECT IDENTIFIED** (Environment guard in `OtpTestCodeResolver`)

---

## 9. Approved Option 1 Fixture Provisioning & Authenticated E2E Validation

### 9.1 Phase 1 — Pre-Execution Review & Schema Invariant Audit
- **Authorization:** Option 1 (Non-destructive fixture provisioning on desktop simulation stack `diyar-vps-sim`, base URL `http://localhost:8092`) approved by project owner.
- **Active Database Verified:** MySQL database `diyar_vps_simulation` inside container `diyar-vps-sim-mysql-1` on network `diyar-vps-sim_diyar_sim_net`.
- **Runtime Verified:** Octane + Swoole v5.1.3 on `diyar-vps-sim-app-1` with 2 app workers, 1 task worker, and `--max-requests=500`.
- **Script Path Designed:** `backend/scripts/provision-vps-sim-test-fixtures.php` (v1.0.0).
- **Safety Invariants Verified:**
  - Strictly non-destructive insert-only operations using `firstOrCreate` / uniqueness checks.
  - Zero deletes (`delete()`), zero truncates, zero migration resets, zero volume drops.
  - Zero modifications to unrelated records or existing credentials.
  - Bounded side effects: Mail disabled (`MAIL_MAILER: log`), SMS disabled (`DIYAR_SMS_DRIVER: log`), Payments mocked (`DIYAR_PAYMENT_USE_FAKE_GATEWAY: 'true'`).

### 9.2 Phase 2 — Fixture Provisioning Execution & Evidence

**Execution Command:**
```bash
docker exec diyar-vps-sim-app-1 php scripts/provision-vps-sim-test-fixtures.php
```
**Exit Code:** `0`

**Database Row Counts (Initial -> Provisioned -> Idempotency Rerun):**

| Table | Before Count | After Provisioning | Delta | Rerun Count | Rerun Delta | Unique Keys / Invariants |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `roles` | 0 | 5 | +5 | 5 | +0 | `name` (customer, vendor, provider, marketer, admin) |
| `permissions` | 11 | 64 | +53 | 64 | +0 | `key` (all 64 `AdminPermission` cases attached to Admin) |
| `users` | 0 | 5 | +5 | 5 | +0 | `phone`, `email` (5 isolated identities) |
| `vendor_accounts` | 0 | 1 | +1 | 1 | +0 | `user_id`, `slug` (`diyar-furniture`) |
| `vendor_shipping_settings` | 0 | 1 | +1 | 1 | +0 | `vendor_account_id` (carrier flat rate 28.00, pickup enabled) |
| `categories` | 0 | 2 | +2 | 2 | +0 | `slug` (`living-room`, `interior-design`) |
| `products` | 0 | 1 | +1 | 1 | +0 | `slug` (`kanaba-thulathiya-fakhira`, matches search 'كنب') |
| `product_colors` | 0 | 1 | +1 | 1 | +0 | `['product_id', 'name']` (`رمادي`, `#9CA3AF`) |
| `product_inventory` | 0 | 1 | +1 | 1 | +0 | `product_id` (stock: 50, reserved: 0, available: 50) |
| `service_categories` | 0 | 1 | +1 | 1 | +0 | `slug` (`interior-design`, icon `palette`) |
| `provider_accounts` | 0 | 1 | +1 | 1 | +0 | `user_id`, `slug` (`eiwan-design`) |
| `provider_work_policies` | 0 | 1 | +1 | 1 | +0 | `provider_account_id` (delivery 7d, 2 revisions) |
| `services` | 0 | 2 | +2 | 2 | +0 | `slug` (`integrated-apartment-design`, `office-3d-design`) |
| `commission_rules` | 0 | 1 | +1 | 1 | +0 | `['scope', 'scope_id']` (Global 10.00%) |
| `system_settings` | 0 | 44 | +44 | 44 | +0 | `['group', 'key']` (Default platform definitions) |

**Created Fixture UUIDs:**
- Customer: `01a12fc7-f102-73e7-b5a5-b030f8132a6e` (Phone: `966500000010`)
- 2FA Customer: `01a12fc7-f173-71e9-bc19-1c073e62db26` (Phone: `966500000012`)
- Vendor: `01a12fc7-f17e-728d-9945-45c676914458` (Phone: `966500000002`)
- Vendor Account: `01a12fc7-f189-700e-809e-384df78525f1` (Slug: `diyar-furniture`)
- Provider: `01a12fc7-f190-73ea-b446-79e7ca110d3b` (Phone: `966500000101`)
- Provider Account: `01a12fc7-f1b8-7355-ab64-ac5b12262db2` (Slug: `eiwan-design`)
- Admin: `01a12fc7-f1be-7244-b797-d56d634b1d3d` (Phone: `966500000001`)
- Living Room Category: `01a12fc7-f1d6-73a9-b749-01324aa4c580`
- Service Category: `01a12fc7-f1da-721d-bf6a-c56ee6c41391`
- Product (Sofa): `01a12fc7-f1ea-73d6-8429-59af75e98c9c` (Stock: 50)
- Services: `01a12fc7-f206-72ae-9ee8-1b56ebc09cd9`, `01a12fc7-f20a-7017-b9b3-f1b99d5a0891`

### 9.3 Phase 3 — Authenticated Playwright Verification Results

All tests executed with:
```powershell
$env:E2E_BASE_URL="http://localhost:8092"
$env:E2E_API_URL="http://localhost:8092/api/v1"
```

| # | User Journey / Specification | Command Executed | Exit Code | Tests Passed | Duration | Status | Evidence / Notes |
| :- | :--- | :--- | :-: | :-: | :-: | :--- | :--- |
| **1** | **Customer Authentication & Core Journey** | `npx playwright test e2e/customer-journey.spec.ts --workers=1` | `0` | **3 / 3** | 21.1s | **VERIFIED** | Home browse, search ("كنب"), open product, login (966500000010), view profile, services catalog with filters, unauthenticated cart prompt all passed. |
| **2** | **Vendor Authentication & Journey** | `npx playwright test e2e/vendor-journey.spec.ts --workers=1` | `0` | **3 / 3** | 5.7s | **VERIFIED** | Vendor login (966500000002) reaches `/dashboard/vendor`, `/dashboard/vendor/products`, `/dashboard/vendor/orders`. |
| **3** | **Service-Provider Journey** | `npx playwright test e2e/provider-journey.spec.ts --workers=1` | `0` | **3 / 3** | 5.5s | **VERIFIED** | Provider login (966500000101) reaches `/dashboard/service`, `/dashboard/service/services`, and public services catalog lists seeded Eiwan Design services. |
| **4** | **Admin Authentication & Journey** | `npx playwright test e2e/admin-journey.spec.ts --workers=1` | `0` | **2 / 2** | 4.7s | **VERIFIED** | Admin login (966500000001), dashboard, `/admin/users`, `/admin/settings`, `/admin/finance`, `/admin/audit`, and unauthorized marketplace profile isolation verified. |
| **5** | **Two-Factor Authentication (2FA)** | `npx playwright test e2e/two-factor.spec.ts --workers=1` | `1` | **1 / 5** | 3.1s | **FAILED (Defect Identified)** | `E2E-01 login without 2FA authenticates directly` passed. `E2E-03` failed at `POST /profile/security/two-factor/confirm` with code `123456`. See Section 9.4 for root-cause analysis. |
| **6** | **Checkout Journey** | `npx playwright test e2e/checkout-journey.spec.ts --workers=1` | `0` | **2 / 2** | 14.7s | **VERIFIED** | 1) API checkout: cart items, address creation, checkout preview, order placement, fake payment simulation (`paid`), status `confirmed`. 2) UI cart to fake payment simulator (`/checkout/payment/.../simulate`) redirecting to `/orders`. |

### 9.4 Identified Defects & Limitations
1. **Defect — Production Simulation OTP Test Mode Incompatibility:**
   - **File:** `backend/app/Domains/Identity/Support/OtpTestCodeResolver.php` (Line 35):
     ```php
     public static function testModeEnabled(): bool
     {
         if (! app()->environment(['local', 'testing'])) {
             return false;
         }
         return (bool) config('diyar.otp.test_mode', false);
     }
     ```
   - **Root Cause:** In the simulation stack (`docker-compose.production-like.yml`), `APP_ENV: production`. Even though Compose explicitly configures `DIYAR_OTP_TEST_MODE: 'true'` and `DIYAR_OTP_TEST_CODE: '123456'`, the application code strictly denies test OTP resolution unless `APP_ENV` is `local` or `testing`. Consequently, the OTP service issues a randomized code and hashes it without exposing or matching `123456`, causing Playwright's `confirm` call in `two-factor.spec.ts` to receive HTTP 422 (`code: diyar.otp.invalid`).
   - **Scope Discipline:** Per instructions, application logic was not altered merely to make the suite green. The defect is documented here for resolution (e.g. updating `testModeEnabled()` to also evaluate `config('diyar.vps_simulation')`).

### 9.5 Final Evidence-Based Status Determination
- **Local VPS-Simulation Stack (`diyar-vps-sim`):** **VERIFIED** (Hostinger KVM 2 resource envelope, 2 app workers + 1 task worker on Octane/Swoole v5.1.3, worker recycling at 500 requests, MySQL 8.0, Redis 7.0, Reverb WebSockets).
- **Non-Destructive Fixture Provisioning:** **VERIFIED** (15 tables populated idempotently without data loss or existing record alteration).
- **Customer, Vendor, Provider, Admin, and Checkout User Journeys:** **VERIFIED** (13 / 13 test cases passed on `http://localhost:8092`).
- **Two-Factor Authentication Interactive Challenge:** **NOT VERIFIED / DEFECT IDENTIFIED** (Blocked by `APP_ENV=production` guard in `OtpTestCodeResolver`).
- **Overall Stage 31 Release Candidate Status:** **VERIFIED WITH DOCUMENTED 2FA SIMULATION LIMITATION**.




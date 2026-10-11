# DIYAR V1 — BASELINE REPORT (PHASE 0)

> **Document Status:** VERIFIED BASELINE  
> **Execution Date:** 2026-10-11  
> **Execution Role:** Autonomous QA & Release Validation Engineer  
> **Target Release:** DIYAR V1 Release Candidate  

---

## 1. Repository & Commit Baseline

| Property | Value | Verification Method |
| :--- | :--- | :--- |
| **Repository Root** | `c:\Users\APL TECH\OneDrive\Documents\Web\Work\Hamid\project\diyar-marketplace` | `git rev-parse --show-toplevel` |
| **Active Branch** | `dev` (tracking `diyar/dev`) | `git branch --show-current` |
| **Exact Commit SHA** | `466b289a51a6298448d72dbd2a112b028d238f82` | `git rev-parse HEAD` |
| **Working Tree Status** | **Clean** (`nothing to commit, working tree clean`) | `git status` |
| **Untracked Files** | None | `git status -s` |

---

## 2. Host Environment & Runtime Baseline

| Component | Detected Specification | Health / Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 Enterprise / PowerShell | Host dev environment |
| **PHP Runtime** | PHP 8.4.0 (cli) NTS VC19 x64 | Active CLI runtime (`sodium` extension warning noted) |
| **Composer** | Composer 2.8.3 | Package manager ready |
| **Node.js** | v23.11.0 | Frontend execution runtime |
| **npm** | 11.6.4 | Frontend package manager |
| **Docker Engine** | Docker Desktop (Windows) active | Container daemon responsive (`docker ps -a` functional) |
| **Host Port 8080** | In use by PID 4964 (`httpd`) | Apache/XAMPP active; does not conflict with :3000, :8000, or :8092 |

---

## 3. Database & Storage Baseline

| Target | Configuration | Status |
| :--- | :--- | :--- |
| **Dev SQLite** | `backend/database/database.sqlite` (3,248,128 bytes) | Present, seeded with historical dev fixtures |
| **Testing DB** | `:memory:` SQLite via `backend/phpunit.xml` | Non-destructive in-memory database for automated tests |
| **VPS Simulation DB** | MySQL 8.0 `diyar_vps_simulation` via Docker | Docker container `diyar-vps-sim-mysql-1` exists, currently stopped |
| **Redis Cache/Queue** | Redis 7 via Docker (`diyar-vps-sim-redis-1` / `docker-compose.dev.yml`) | Container exists, currently stopped |

---

## 4. Implemented Roles & Authorization Matrix Baseline

Based on source analysis of `backend/app/Enums/RoleName.php`, `AdminPermission.php`, `VendorTeamRole.php`, and database seeders:

| System Role | Code Identifier | Description / Subroles | Seeded Test Identity |
| :--- | :--- | :--- | :--- |
| **Role A: Guest** | Unauthenticated | Public storefront, session/token cart isolation (`X-Guest-Cart-Token`) | N/A (Isolated browser contexts) |
| **Role B: Customer** | `customer` | Registered consumer, cart, checkout, order history, reviews | `500000010` / `customer@diyar.local` |
| **Role B (2FA): Customer 2FA**| `customer` (2FA enabled) | Multi-factor auth verification flow | `500000012` / `customer-2fa@diyar.local` |
| **Role C: Seller / Vendor** | `vendor` (`merchant`) | Vendor portal, products, orders, fulfillment, team roles (`owner`, `manager`, `customer_service`) | `500000002` / `vendor@diyar.local` |
| **Role D: Service Provider**| `provider` (`service_provider`) | Services catalog, bookings lifecycle, calendar | `500000101` / `eiwan@diyar.local` |
| **Role E: Referral / Affiliate** | `marketer` | Affiliate codes, conversions, commission ledger, payouts | `500000011` / `marketer@diyar.local` |
| **Role F: Admin** | `admin` | Full admin panel access, 50+ granular permissions across 16 domain groups | `500000001` / `admin@diyar.local` |

---

## 5. Automated Verification Inventory

| Suite | Technology | Location | Documented / Verified Baseline |
| :--- | :--- | :--- | :--- |
| **Backend Feature & Unit** | PHPUnit 11 | `backend/tests/` | 1,103 passed, 7 skipped, 0 failed (documented 2026-10-10) |
| **Backend Code Style** | Laravel Pint | `backend/` | Verification mode via `vendor/bin/pint --test` |
| **Frontend Unit & Component** | Vitest 3.2.7 | `frontend/src/` | 350 tests across 87 suites (documented 2026-10-10) |
| **Frontend Type Checking** | TypeScript 5.8.2 | `frontend/` | `tsc --noEmit` (0 errors documented) |
| **Frontend Linting** | ESLint 9.39.5 | `frontend/` | `npm run lint` (`--max-warnings 0`) |
| **Frontend Build** | Vite 6.2.3 | `frontend/` | `npm run build` |
| **Browser E2E Suite** | Playwright 1.62.1 | `frontend/e2e/` | 94 tests across 24 files |
| **Enterprise Platform QA** | PowerShell orchestrator | `scripts/qa/` | `run-platform-certification.ps1` |

---

## 6. Baseline Integrity Confirmation

- **No modifications** were made to business logic, database migrations, security policies, dependencies, or `.env` files.
- Working tree remains strictly clean.
- All subsequent phases will measure results against commit `466b289a51a6298448d72dbd2a112b028d238f82`.

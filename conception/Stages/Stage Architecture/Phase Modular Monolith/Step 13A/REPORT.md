# DIYAR — STEP 13A REPORT
# LOCAL VPS SIMULATION CONFIGURATION HARDENING & REPOSITORY CLEANUP

**Document Type:** Local VPS Production Simulation Configuration Hardening & Infrastructure Audit  
**Phase:** Modular Monolith Architecture  
**Date:** 2026-10-06  
**Baseline:** Step 13 Configuration Phase  
**Authority:** Senior Software Architect, DevOps Engineer, Laravel Architect, Docker Engineer, Security Engineer, QA Engineer  
**Execution Mode:** CONFIGURATION + CLEANUP ONLY  
**Runtime Validation:** DEFERRED (Intentionally Not Executed)  
**Final Decision:** **CONFIGURATION READY WITH LIMITATIONS**

---

## 1. Baseline

- **Repository Root:** `c:\Users\APL TECH\OneDrive\Documents\Web\Work\Hamid\project\diyar-marketplace`
- **Branch:** `dev`
- **Baseline Commit:** `1a64564c26122b3997985135edff995a05a22b09`
- **Safety Precondition:** Real Hostinger VPS, production databases, production Redis, live storage, and production secrets were **NEVER TOUCHED**.
- **Verified Repository Invariants:**
  - Registered Routes: **528** (Exact match)
  - Backend PHPUnit: **1,101 passed, 7 skipped, 0 failed** (1,108 total tests, 4,560 assertions)
  - Frontend Vitest: **350 / 350 passed** (87 test suites)
  - Frontend TypeScript: **0 errors** (`npm --prefix frontend run typecheck` exit 0)
  - Frontend ESLint: **0 warnings, 0 errors** (`npm --prefix frontend run lint` exit 0)
  - Frontend Production Build: **PASS in 22.91s** (`npm --prefix frontend run build` exit 0)

---

## 2. Configuration Audit

An exhaustive inspection of all Docker, environment, script, and Nginx configurations was executed across the repository:

| Configuration Area | Inspected Assets | Scope & Purpose |
|---|---|---|
| **Root Compose** | 11 Compose files (`docker-compose.*.yml`) | Local dev, production FPM, production Octane, KVM2 simulation, k6 load testing, Grafana observability, multi-node clustering, staging sandbox |
| **Dockerfiles** | 3 Dockerfiles in `backend/` | `Dockerfile.fpm` (PHP 8.3 FPM), `Dockerfile.octane` (PHP 8.3 Swoole/Octane), `Dockerfile.octane.spx` (SPX profiler) |
| **Deploy Assets** | 30 files in `deploy/` | Specialized Nginx configurations (7), PHP pool configs (4), Supervisor profiles (1), MySQL configs (1), SOP guides |
| **Environment Templates** | 12 templates (`.env.*.example`) | VPS simulation, local dev, Docker SPA, staging, production, loadtest |
| **Automation Scripts** | 119 scripts across `scripts/`, `backend/scripts/`, `frontend/scripts/` | Local bootstrap, certification gates, k6 performance scenarios, database explainers, deployment orchestration |

---

## 3. Configuration Inconsistencies Found

During the detailed audit, the following contradictions and configuration gaps were identified:

1. **`docker-compose.production-like.yml` Staging Contradiction:**  
   The stack was named `diyar-fpm` but configured with `APP_ENV: staging`, `DB_DATABASE: diyar_staging_like`, and `REDIS_PREFIX: diyar-staging-prodlike-`. This contradicted the VPS simulation requirement for an isolated `APP_ENV=production` simulation model.
2. **Missing Queue Topology in Workers:**  
   `docker-compose.production-like.yml` and `setup-vps-simulation.ps1` previously listened to incomplete queue subsets (e.g. omitting `notifications-low`, `chat-low`, and `analytics`), which risked stranded background jobs during simulation.
3. **Gateway Frontend SPA Mount Gap:**  
   `docker-compose.production-like.yml` used `deploy/nginx/production-like.conf` which was API-only, lacking the `/var/www/diyar/frontend/dist` volume mount and SPA client-side fallback required by the canonical target model.
4. **Reverb Broadcasting Driver Mismatch:**  
   In `backend/.env.vps-simulation.example`, `BROADCAST_CONNECTION` was set to `log` instead of `reverb`, while Reverb credentials were fully specified.
5. **Sanctum & CORS Port Coverage:**  
   `SANCTUM_STATEFUL_DOMAINS` in simulation templates lacked explicit entries for simulation ports (`8092`, `8080`), risking authentication failure when accessed through the Nginx simulation gateway.

---

## 4. Changes Made

All modifications were strictly limited to configuration hardening, alignment, and documentation:

1. **Hardened `backend/.env.vps-simulation.example` & Local `backend/.env.vps-simulation`:**
   - Canonical simulation database: `diyar_vps_simulation`.
   - Dedicated Redis prefix: `diyar_vps_sim_`.
   - Realtime aligned: `BROADCAST_CONNECTION=reverb` with internal HTTP broadcast targeting `127.0.0.1:8090`.
   - Statefulness: Added `localhost:8080`, `localhost:8092`, `diyar.local:8080` to `SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS`.
   - Safe local mocks: `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true`, `DIYAR_SMS_DRIVER=log`, `DIYAR_OTP_TEST_MODE=true`, `DIYAR_ASSISTANT_USE_FAKE=true`, `DIYAR_MAIL_ENABLED=false`.
2. **Hardened `deploy/nginx/production-like.conf`:**
   - Structured as the canonical VPS simulation gateway:
     - `/` and `/assets/*` serve the built frontend SPA from `/var/www/diyar/frontend/dist`.
     - `/api/*`, `/sanctum/*`, and `/broadcasting/*` forward to PHP-FPM (`app:9000`).
     - `/app/*` and `/apps/*` proxy WebSocket connections to Laravel Reverb (`reverb:8090`).
     - `/storage/*` aliases public media storage.
     - Security directives strictly block sensitive file patterns (`.env`, `.git`, `.sql`, `.bak`, `.log`, `.sh`).
3. **Hardened `docker-compose.production-like.yml`:**
   - Set project name `diyar-vps-sim`.
   - Configured `APP_ENV: production`, `DB_DATABASE: diyar_vps_simulation`, `REDIS_PREFIX: diyar_vps_sim_`, `DIYAR_ENFORCE_REDIS_IN_PRODUCTION: 'true'`.
   - Added all 9 application queues to `queue-worker`:
     `--queue=critical,notifications-high,notifications,notifications-low,broadcast,chat,chat-low,analytics,default`.
   - Mounted `./frontend/dist:/var/www/diyar/frontend/dist:ro` into Nginx.
   - Configured MySQL 8.0 command with `--character-set-server=utf8mb4` and `--collation-server=utf8mb4_unicode_ci`.
4. **Hardened `scripts/local/setup-vps-simulation.ps1`:**
   - Documented exact port mappings and service URLs (Host Port vs Internal Container Port vs Public Simulation URL vs Internal Service URL).
   - Documented launcher workflows for both Option A (Containerized Docker Compose) and Option B (Native Local Simulation).
   - Corrected native queue command to cover all 9 queues.

---

## 5. Docker Inventory

| Compose File | Primary Role | Published Ports | Services | Status |
|---|---|---|---|---|
| `docker-compose.dev.yml` | Local Dev Cache/Queue | `6379:6379` | `redis` | Active / Preserved |
| `docker-compose.local-gateway.yml` | Dev Gateway Reverse Proxy | `8080:8080` | `gateway` (Nginx) | Active / Preserved |
| `docker-compose.production.yml` | Hostinger KVM2 Canonical Production | `8080:80` | `mysql`, `redis`, `app`, `nginx`, `queue-critical`, `queue-default`, `queue-analytics`, `scheduler`, `reverb-1`, `reverb-2`, `backup` | Active / Preserved |
| `docker-compose.production.octane.yml` | Production Octane (Swoole) Override | (Inherited) | `app`, `nginx` | Active / Preserved |
| `docker-compose.production-like.yml` | Local VPS Production Simulation | `8092:80` | `mysql`, `redis`, `app`, `reverb`, `queue-worker`, `scheduler`, `nginx` | **Hardened / Preserved** |
| `docker-compose.kvm2-test.yml` | KVM2 Resource Envelope Overlay | (Overlay) | Limits cpuset 0-1, memory 6.3 GB | Active / Preserved |
| `docker-compose.kvm2-test.k6.yml` | KVM2 Networked k6 Runner | Internal | `k6` | Active / Preserved |
| `docker-compose.k6-grafana.yml` | k6 Runner + Live Web Dashboard | `5665:5665` | `k6` | Active / Preserved |
| `docker-compose.loadtest.yml` | Standalone Unthrottled Octane Stress | `8000:8000`, `6379:6379`, `3307:3306` | `redis`, `mysql`, `api`, `k6` | Active / Preserved |
| `docker-compose.multinode.yml` | Multi-Node Octane Cluster Gate | `8088:80`, `6380:6379`, `3308:3306` | `redis`, `mysql`, `migrate`, `api-a`, `api-b`, `nginx`, `queue-worker-1`, `queue-worker-2`, `scheduler-a`, `scheduler-b` | Active / Preserved |
| `docker-compose.staging.yml` | Local Staging Sandbox Infrastructure | `3307:3306`, `6380:6379`, `1025`, `8025` | `mysql`, `redis`, `mailhog` | Active / Preserved |

---

## 6. Script Inventory & Classification

Every script in the repository was classified:

- **Local Dev & Gateway:** `scripts/local/*` (8 scripts) — `KEEP — DEV / VPS SIMULATION`.
- **Production Deployment:** `scripts/deploy/deploy-release.sh` — `KEEP — PRODUCTION`.
- **E2E Bootstrap:** `scripts/e2e/*` (3 scripts) — `KEEP — DEV / QA`.
- **Performance & k6:** `scripts/performance/*` (35 scripts) — `KEEP — K6 / PERFORMANCE / OCTANE`.
- **Certification & QA:** `scripts/certification/*` (3 scripts), `scripts/qa/*` (3 scripts) — `KEEP — QA / CERTIFICATION`.
- **Staging Smoke:** `scripts/staging/smoke.sh` — `KEEP — STAGING`.
- **Test Helpers:** `scripts/test-*` (5 scripts) — `KEEP — DEV / CI/CD`.
- **Frontend Tools:** `frontend/scripts/*` (6 scripts) — `KEEP — FRONTEND`.
- **Backend Boot & Probes:** `backend/scripts/*` (68 scripts) — `KEEP — CERTIFICATION / DOCKER`.

---

## 7. Files Deleted, Retained, and Archived

- **Files Deleted:** **0** (No file met the rigorous deletion criteria; all files have active references in Compose, CI, deploy, or certification audits).
- **Files Archived:** **0**.
- **Files Retained:** **100% of repository assets**.

---

## 8. Security & Environment Isolation

1. **No Live Production Exposure:** Live Hostinger VPS, production IP, production credentials, real databases, and payment keys are untouched.
2. **Clean Environment Isolation:**
   ```text
   Development DB:         diyar_marketplace (port 3306)
   Simulation DB:          diyar_vps_simulation (port 3306)
   Production DB:          diyar_production (Hostinger KVM2 only)
   
   Development Redis:      prefix diyar_dev_ or diyar_cache_
   Simulation Redis:       prefix diyar_vps_sim_
   Production Redis:       prefix diyar-production-
   ```
3. **Local Mock Integrations:**
   - Payments: `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true`
   - SMS/OTP: `DIYAR_SMS_DRIVER=log`, `DIYAR_OTP_TEST_MODE=true`
   - Mail: `MAIL_MAILER=log`, `DIYAR_MAIL_ENABLED=false`
   - AI Assistant: `DIYAR_ASSISTANT_USE_FAKE=true`

---

## 9. Canonical Network Architecture & Port Mapping

```text
Browser
   ↓
Nginx Simulation Gateway (:8092 or :8080)
   ├── Frontend production build (dist/)
   ├── /api/*, /sanctum/*, /broadcasting/*
   └── /app/* WebSocket
          ↓
       Laravel (PHP-FPM :9000 or Octane :8000)
       ├── Redis 7 / 8 (Port 6379, prefix diyar_vps_sim_)
       ├── MariaDB 10.4 / MySQL 8.0 (Port 3306, diyar_vps_simulation)
       ├── Public Storage (backend/storage/app/public)
       ├── Queue Worker (All 9 queues)
       ├── Scheduler (60s tick)
       └── Reverb WebSocket Server (:8090)
```

### Port Mapping Disambiguation:

| Concept | Nginx Gateway | PHP Backend | Reverb WebSockets | MariaDB / MySQL | Redis |
|---|---|---|---|---|---|
| **Host Port** | `8092` (or `8080`) | None (Docker) / `8000` (Native) | None (Docker) / `8090` (Native) | `3306` | `6379` |
| **Internal Container Port** | `80` | `9000` (FPM) / `8000` (Octane) | `8090` | `3306` | `6379` |
| **Public Simulation URL** | `http://localhost:8092` | N/A (Proxied via Nginx) | `ws://localhost:8092/app/` | N/A | N/A |
| **Internal Service URL** | N/A | `app:9000` | `http://reverb:8090` | `mysql:3306` | `redis:6379` |

---

## 10. Octane Configuration Hierarchy

| Tier | Configuration Source | Workers | Task Workers | Max Requests | Purpose |
|---|---|---|---|---|---|
| **Base Image** | `backend/Dockerfile.octane` | 4 | 2 | 1000 | Baseline container default |
| **Production Override** | `docker-compose.production.octane.yml` | 2 (`${OCTANE_WORKERS:-2}`) | 1 | 500 | Hostinger KVM2 (2 vCPU) production sizing |
| **KVM2 Resource Overlay** | `docker-compose.kvm2-test.yml` | 2 (cpuset `0-1`) | 1 | 500 | Strict 2 vCPU / 6.3 GB memory boundary |
| **Multi-Node Cluster** | `docker-compose.multinode.yml` | 2 per node (4 total across `api-a`, `api-b`) | 1 per node | 500 | Failover & session affinity gate |
| **Stress Load-Test** | `docker-compose.loadtest.yml` | 4 | 2 | 2000 | Unthrottled k6 concurrency load generation |

---

## 11. Queue Topology Audit

Every queue name in the application was audited from source code and dispatch logic:

| Queue Name | Priority | Assigned Worker Service | Retry Policy | Timeout | Purpose |
|---|---|---|---|---|---|
| `critical` | P0 (Highest) | `queue-critical` / `queue-worker` | 3–5 tries | 120s | Critical transactional operations, orders, outbox dispatch |
| `notifications-high` | P1 (High) | `queue-default` / `queue-worker` | 5 tries | 120s | High priority notifications, urgent user alerts |
| `notifications` | P2 (Normal) | `queue-default` / `queue-worker` | 5 tries | 120s | General user notifications |
| `notifications-low` | P3 (Low) | `queue-default` / `queue-worker` | 5 tries | 180s | Marketing / non-urgent notifications |
| `broadcast` | P2 (Normal) | `queue-default` / `queue-worker` | 5 tries | 180s | Realtime WebSocket event broadcasting dispatch |
| `chat` | P1 (High) | `queue-default` / `queue-worker` | 5 tries | 120s | Realtime conversation messages |
| `chat-low` | P3 (Low) | `queue-default` / `queue-worker` | 5 tries | 120s | Chat typing indicators & archive sweeps |
| `analytics` | P3 (Low) | `queue-analytics` / `queue-worker` | 3 tries | 120s | Search queries & customer analytics ingestion |
| `default` | P2 (Normal) | `queue-critical` / `queue-worker` | 3–5 tries | 120s | General background job fallback |

---

## 12. Compose Validation Results

All 11 Compose files were evaluated via `docker compose config`:

- `docker-compose.dev.yml`: **VALID** (Exit 0)
- `docker-compose.k6-grafana.yml`: **VALID** (Exit 0)
- `docker-compose.kvm2-test.k6.yml`: **VALID** (Exit 0)
- `docker-compose.loadtest.yml`: **VALID** (Exit 0)
- `docker-compose.local-gateway.yml`: **VALID** (Exit 0)
- `docker-compose.multinode.yml`: **VALID** (Exit 0)
- `docker-compose.production-like.yml`: **VALID** (Exit 0)
- `docker-compose.staging.yml`: **VALID** (Exit 0)
- `docker-compose.production.yml`: **VALID** (Exit 0, evaluated with `deploy/docker/production.env.local.example`)
- `docker-compose.production.octane.yml`: **VALID** (Exit 0, evaluated as overlay on `docker-compose.production.yml`)
- `docker-compose.kvm2-test.yml`: **VALID** (Exit 0, evaluated as overlay on `docker-compose.production.yml`)

---

## 13. Application Regression Results

All verification gates were executed and confirmed invariant:

```text
Registered Routes:         528 (PASS)
Backend PHPUnit Tests:     1,101 passed, 7 skipped, 0 failed (1,108 total tests, 4,560 assertions) (PASS)
Frontend Vitest Tests:     350 / 350 passed (87 test suites) (PASS)
Frontend TypeScript:       0 errors (PASS)
Frontend ESLint:           0 warnings, 0 errors (PASS)
Frontend Production Build: PASS in 22.91s (dist/ verified)
```

---

## 14. Remaining Limitations

1. **Runtime Execution Deferred:** Live container startup, active HTTP request validation through the simulation gateway, and live WebSocket handshake verification were intentionally deferred.
2. **Redis Versioning Distinction:** Local simulation Redis (8.10 on Windows host / Redis 7 alpine in containers) is verified for compatibility; this simulation does not claim to replace final production testing on the actual Hostinger VPS environment.
3. **External Legal/AI Integration:** External cloud AI and production payment webhooks remain mocked/disabled for security.

---

## 15. Next Step

Step 13A is complete. The repository configuration is hardened, normalized, and internally consistent.

Next action: Proceed to the full **Step 13 Runtime Phase** when authorized, launching the simulation stack and performing end-to-end runtime validation, business smoke tests, and failure injection testing without touching the live Hostinger VPS.

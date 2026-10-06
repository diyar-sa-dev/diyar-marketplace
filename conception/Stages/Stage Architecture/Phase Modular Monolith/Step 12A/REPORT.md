# DIYAR — STEP 12A REPORT
# INFRASTRUCTURE, DOCKER & REPOSITORY CLEANUP AUDIT

**Document Type:** Infrastructure & Repository Architecture Audit  
**Phase:** Modular Monolith Architecture  
**Date:** 2026-10-06  
**Baseline Commit:** `1a037f61b95a35b709b94bed9f0fda4367f9ca83`  
**Status:** **CERTIFIED WITH LIMITATIONS**  
**Decision Gate:** **CLEANUP READY: YES (0 Deletions Required / All 11 Compose Stacks & 3 Dockerfiles Active & Protected)**

---

## 1. Executive Summary

Step 12A conducted an exhaustive, read-only audit of all infrastructure, Docker, Compose, deployment, and repository orchestration assets across the DIYAR repository prior to entering the VPS-production simulation phase.

The audit examined 100% of the repository's infrastructure footprint, including:
- 11 Docker Compose orchestration files at the root level;
- 3 Dockerfiles and 1 profiler configuration in `backend/`;
- 30 deployment files and specifications in `deploy/` (`nginx/`, `php/`, `supervisor/`, `docker/`);
- 6 GitHub Actions workflows in `.github/workflows/`;
- 49 operational, performance (k6), QA, certification, and local automation scripts in `scripts/`;
- 2 frontend preview/lighthouse scripts in `frontend/scripts/`;
- 68 backend certification and benchmark scripts in `backend/scripts/`;
- 1 PaaS deployment blueprint (`render.yaml`).

### Key Audit Findings

1. **Zero Dead or Accidental Docker Assets:** There are no obsolete compose files or orphan development containers. Every one of the 11 compose files serves an active, specialized operational role (Local Dev, Local Gateway, Production FPM, Production Octane Override, KVM2 Strict Overlay, KVM2 k6 Runner, Standalone Octane Loadtest, Octane Grafana Dashboard, Multi-node Octane Cluster, and Staging Sandbox).
2. **100% Compose Configuration Validity:** All 11 compose configurations were syntactically and architecturally validated via `docker compose config` and exit with code 0.
3. **No Duplicate Dockerfiles:** Exactly 3 Dockerfiles exist, each with a single explicit responsibility: `Dockerfile.fpm` (PHP 8.3 FPM production runtime), `Dockerfile.octane` (PHP 8.3 Swoole/Octane high-throughput runtime), and `Dockerfile.octane.spx` (NoiseByNorthwest/php-spx kernel profiling overlay).
4. **Zero Untracked or Leaked Build Artifacts:** Git working tree was clean (`working tree clean`). Build artifacts (`frontend/dist`, `backend/vendor`, `.env` secrets) are properly git-ignored.
5. **Clear Separation of Operational Environments:**
   - **Dev Stack:** `docker-compose.dev.yml` (Redis) + `docker-compose.local-gateway.yml` (Nginx diyar.local:8080) + `npm run dev:prod-api` (Vite :3000).
   - **Production Stack:** `docker-compose.production.yml` (PHP 8.3 FPM + MySQL 8.0 + Redis 7 + Reverb x2 + 3 Queue Workers + Scheduler + Nginx).
   - **VPS Simulation:** `docker-compose.production-like.yml` and `docker-compose.kvm2-test.yml` (Hostinger KVM2 2 vCPU cpuset 0-1 strict 6.3 GB memory envelope).
   - **Octane Strategy:** `docker-compose.production.octane.yml` and `docker-compose.multinode.yml` (Swoole workers with multi-node load balancing).
   - **k6 Performance Strategy:** `docker-compose.loadtest.yml`, `docker-compose.kvm2-test.k6.yml`, and `docker-compose.k6-grafana.yml`.

---

## 2. Baseline

- **Repository Root:** `c:\Users\APL TECH\OneDrive\Documents\Web\Work\Hamid\project\diyar-marketplace`
- **Baseline Commit:** `1a037f61b95a35b709b94bed9f0fda4367f9ca83`
- **Branch:** `dev` (ahead of `diyar/dev` by 2 commits)
- **Working Tree State:** Clean (0 untracked files, 0 uncommitted changes)
- **Step 12 Invariant Verification:**
  - Backend Routes: 528 registered routes
  - Backend PHPUnit Tests: 1,101 passed, 7 skipped, 0 failed (1,108 total tests, 4,560 assertions)
  - Frontend Vitest Tests: 350 / 350 passed (87 test suites)
  - Frontend TypeScript: 0 errors (`npx tsc --noEmit` exit 0)
  - Frontend ESLint: 0 warnings, 0 errors (`npm run lint` exit 0)
  - Frontend Production Build: PASS in 17.69s (`npm run build` exit 0)

---

## 3. Infrastructure Inventory

The repository infrastructure is structured across 6 principal directories:

```text
diyar-marketplace/
├── docker-compose.*.yml         (11 specialized Compose configurations)
├── render.yaml                  (Render cloud PaaS blueprint)
├── backend/
│   ├── Dockerfile.fpm           (Canonical PHP 8.3 FPM image)
│   ├── Dockerfile.octane        (Canonical PHP 8.3 Swoole/Octane image)
│   ├── Dockerfile.octane.spx    (SPX profiling overlay image)
│   ├── .dockerignore            (Docker context build exclusion rules)
│   ├── docker/spx.ini           (SPX php extension config)
│   └── scripts/                 (Container boot scripts & benchmark probes)
├── deploy/
│   ├── docker/                  (Environment templates & MySQL tuning cnf)
│   ├── nginx/                   (7 specialized Nginx reverse proxy configurations)
│   ├── php/                     (FPM pool configs & opcache template)
│   ├── supervisor/              (Supervisor worker process definitions)
│   └── *.md                     (Deployment SOPs and architecture specifications)
├── scripts/
│   ├── certification/           (Platform measurement & Docker cert scripts)
│   ├── deploy/                  (Release deployment script deploy-release.sh)
│   ├── e2e/                     (E2E bootstrap & startup scripts)
│   ├── local/                   (Local dev & gateway orchestration scripts)
│   ├── performance/             (k6 load test scenarios & runner scripts)
│   ├── qa/                      (Tiered platform certification orchestration)
│   └── staging/                 (Staging stack smoke scripts)
└── .github/workflows/           (6 CI/CD workflows)
```

---

## 4. Docker Inventory

| Asset | Path | Base Image | Extensions / Dependencies | Status |
|---|---|---|---|---|
| PHP-FPM Image | `backend/Dockerfile.fpm` | `php:8.3-fpm-bookworm` | bcmath, gd (jpeg, webp), intl, pcntl, pdo_mysql, zip, opcache, pecl/redis | Active / Protected |
| Octane Image | `backend/Dockerfile.octane` | `php:8.3-cli-bookworm` | pdo_mysql, pdo_sqlite, zip, intl, pcntl, bcmath, opcache, gd, pecl/redis, pecl/swoole | Active / Protected |
| SPX Profile Image | `backend/Dockerfile.octane.spx` | `diyar-kvm2-test-app:latest` | noise-by-northwest/php-spx kernel profiling overlay | Active / Protected |
| SPX Config | `backend/docker/spx.ini` | N/A | SPX PHP runtime ini (data dir, sampling frequency) | Active / Protected |
| Docker Ignore | `backend/.dockerignore` | N/A | Excludes `.git`, `vendor`, `node_modules`, `storage/logs`, `.env` | Active / Protected |

---

## 5. Compose Inventory

| File | Project Name | Exposed Ports | Services Defined | Primary Role | Status / Recommendation |
|---|---|---|---|---|---|
| `docker-compose.dev.yml` | `diyar-dev` | 6379 | `redis` | Local dev Redis cache/queue/Reverb storage | `KEEP — DEV` |
| `docker-compose.local-gateway.yml` | `diyar-local-gateway` | 8080 | `gateway` (Nginx) | Unified origin router for diyar.local:8080 (Vite :3000 + API :8093) | `KEEP — DEV` |
| `docker-compose.production.yml` | `diyar-production` | 8080 (HTTP_PORT) | `mysql`, `redis`, `app`, `nginx`, `queue-critical`, `queue-default`, `queue-analytics`, `scheduler`, `reverb-1`, `reverb-2`, `backup` | Hostinger KVM2 canonical production stack | `KEEP — PRODUCTION` |
| `docker-compose.production.octane.yml` | (Override) | N/A (8000 internal) | `app` (Octane Swoole), `nginx` (Octane upstream conf) | High-throughput Octane profile overlay for production stack | `KEEP — OCTANE` |
| `docker-compose.production-like.yml` | `diyar-fpm` | 8092 | `mysql`, `redis`, `app`, `reverb`, `queue-worker`, `scheduler`, `nginx` | Staging-like local stack for cross-origin testing | `KEEP — VPS SIMULATION` |
| `docker-compose.kvm2-test.yml` | (Override) | N/A | Resource constraints (`cpuset: '0-1'`, 6.3 GB RAM limit) on all 10 production containers | Strict Hostinger KVM2 hardware boundary emulation | `KEEP — VPS SIMULATION` |
| `docker-compose.kvm2-test.k6.yml` | (Profile k6) | N/A | `k6` (cpuset 2-3, on public/backend networks) | k6 runner targeting KVM2 container network directly | `KEEP — K6` |
| `docker-compose.loadtest.yml` | `diyar-loadtest` | 6379, 3307, 8000 | `redis`, `mysql`, `api` (Octane), `k6` | Standalone Octane load-testing stack with relaxed limiters | `KEEP — K6` |
| `docker-compose.k6-grafana.yml` | (Profile k6) | 5665 | `k6` (web dashboard exported to 5665) | Real-time k6 visual metrics dashboard against Octane stack | `KEEP — K6` |
| `docker-compose.multinode.yml` | `diyar-multinode` | 6380, 3308, 8088 | `redis`, `mysql`, `migrate`, `api-a`, `api-b`, `nginx` (load balancer), `queue-worker-1`, `queue-worker-2`, `scheduler-a`, `scheduler-b` | Multi-node Octane clustering and distributed concurrency gate | `KEEP — OCTANE` |
| `docker-compose.staging.yml` | `diyar-staging` | 3307, 6380, 1025, 8025 | `mysql`, `redis`, `mailhog` | Local staging database, cache, and email sink container stack | `KEEP — SHARED` |

---

## 6. Dockerfile Inventory

### 6.1 `backend/Dockerfile.fpm`
- **Base:** `php:8.3-fpm-bookworm`
- **Extensions:** `bcmath`, `gd` (with JPEG & WebP), `intl`, `pcntl`, `pdo_mysql`, `zip`, `opcache`, `redis` (via PECL).
- **Composer:** Multi-stage COPY from `composer:2`.
- **Target Runtime:** Hostinger KVM2 production FPM pool (`deploy/php/fpm-pool-kvm2.conf`) mounted on `/usr/local/etc/php-fpm.d/zz-diyar.conf`.
- **User:** Non-root `www-data` (UID/GID 33).
- **Port:** 9000 (FastCGI).

### 6.2 `backend/Dockerfile.octane`
- **Base:** `php:8.3-cli-bookworm`
- **Extensions:** `pdo_mysql`, `pdo_sqlite`, `zip`, `intl`, `pcntl`, `bcmath`, `opcache`, `gd`, `redis` (via PECL), `swoole` (via PECL).
- **Composer:** Multi-stage COPY from `composer:2` with `--optimize-autoloader`.
- **Entrypoint:** `php artisan octane:start --server=swoole --host=0.0.0.0 --port=8000 --workers=4 --task-workers=2 --max-requests=1000`.
- **Verification:** Built-in PHP check verifying `bcmath` extension loaded.
- **Port:** 8000 (HTTP).

### 6.3 `backend/Dockerfile.octane.spx`
- **Base:** `diyar-kvm2-test-app:latest`
- **Extensions:** Compiles NoiseByNorthwest/php-spx from GitHub source.
- **Config:** Installs `backend/docker/spx.ini` to `/usr/local/etc/php/conf.d/99-spx.ini`.
- **Data Dir:** `/tmp/spx-data` with 777 permissions.
- **Target:** On-demand low-overhead profiling for performance audits.

---

## 7. VPS Configuration

The canonical VPS deployment target is **Hostinger KVM 2** (2 vCPU, 8 GB RAM, Ubuntu 24.04 LTS / Debian 12 Bookworm).

The VPS configuration artifacts comprise:
1. **Reverse Proxy:** `deploy/nginx/kvm2-docker.conf` (reverse proxies `/api/v1` to FPM port 9000 and `/app/` WebSockets to Reverb cluster on port 8090).
2. **Process Supervisor:** `deploy/supervisor/diyar-notifications.conf` (manages 4 distinct queue worker streams: `critical`, `high`, `broadcast`, and `chat`, plus Reverb and scheduler).
3. **Database Tuning:** `deploy/docker/mysql-kvm2.cnf` (InnoDB buffer pool 512 MB, max connections 100, slow query log enabled >1s).
4. **PHP FPM Tuning:** `deploy/php/fpm-pool-kvm2.conf` (dynamic process manager, `pm.max_children = 25`, `pm.start_servers = 5`, `pm.min_spare_servers = 3`, `pm.max_spare_servers = 8`, `pm.max_requests = 1000`).
5. **Deployment SOP:** `scripts/deploy/deploy-release.sh` (zero-downtime symlink deployment into `/var/www/diyar/releases/{timestamp}` with environment validation, forward-only migrations, opcache warming, and service reloading).

---

## 8. Dev Configuration

The canonical development environment supports two execution modes:

### Mode A: Lightweight Local (Windows/Linux native services)
- **Redis:** Started via `docker compose -f docker-compose.dev.yml up -d redis` (port 6379).
- **Backend:** `cd backend && composer dev` (serves API on port 8000 and Reverb on 8080).
- **Frontend:** `cd frontend && npm run dev` (Vite dev server on port 3000).

### Mode B: Unified Full-Stack Local Gateway (`diyar.local:8080`)
- **Automated Starter:** `.\scripts\local\start-local-dev.ps1`
  1. Starts KVM2 Docker production API stack on internal port 8093 (`docker-compose.production.yml`).
  2. Spawns Vite frontend on port 3000 with API proxying target set to :8093 (`npm run dev:prod-api`).
  3. Launches Nginx local gateway on port 8080 (`docker-compose.local-gateway.yml`).
  4. Automatically registers Windows hosts entry `127.0.0.1 diyar.local`.
  5. Storefront is accessed at `http://diyar.local:8080` with seamless single-origin cookie/CSRF credentials.

---

## 9. Production Configuration

The canonical production configuration is defined by `docker-compose.production.yml`:
- **App Service:** Built from `backend/Dockerfile.fpm`, booted via `backend/scripts/docker-production-boot.sh`.
- **Database:** `mysql:8.0` with `mysql-kvm2.cnf` tuning.
- **Cache / Queues / Sessions:** `redis:7-alpine` with `--maxmemory 512mb`, `allkeys-lru`, and AOF enabled.
- **Queue Workers:** 3 dedicated worker containers:
  - `queue-critical`: `--queue=critical,default`
  - `queue-default`: `--queue=notifications-high,notifications,notifications-low,broadcast,chat,chat-low`
  - `queue-analytics`: `--queue=analytics`
- **Scheduler:** Dedicated container running `schedule:run` every 60s.
- **WebSockets:** 2 Reverb nodes (`reverb-1` and `reverb-2`) scaled across Redis channel `reverb`.
- **Reverse Proxy:** Nginx 1.27 Alpine routing `/api/` to app and `/app/` to Reverb.

---

## 10. Octane Configuration

Octane is fully integrated and protected via two production-ready profiles:

1. **Production Override Profile:**
   - Stack: `docker compose -f docker-compose.production.yml -f docker-compose.production.octane.yml up -d --build`
   - Replaces FPM `app` service with `Dockerfile.octane` (Swoole server).
   - Dynamically configures workers: `--workers=${OCTANE_WORKERS:-2} --task-workers=1 --max-requests=500`.
   - Nginx switches configuration to `deploy/nginx/kvm2-docker-octane.conf`.
2. **Multi-Node Clustering Stack:**
   - Stack: `docker compose -f docker-compose.multinode.yml up -d --build`
   - Runs 2 concurrent Octane nodes (`api-a` and `api-b`) behind an Nginx round-robin load balancer on port 8088.
   - Validates session stickiness, cache invalidation, and Redis queue distribution across multiple Octane instances.
3. **SPX Kernel Profiler:**
   - Stack: Built via `backend/Dockerfile.octane.spx` and controlled by `scripts/performance/kvm2-spx.ps1` to detect memory leaks and CPU hotspots during load.

---

## 11. k6 Configuration

k6 load and performance testing is an active first-class subsystem:
- **Runner Containers:**
  - `docker-compose.kvm2-test.k6.yml`: Runs on the isolated Docker network alongside Nginx to avoid Windows `host.docker.internal` network bottlenecks.
  - `docker-compose.loadtest.yml`: Standalone runner with preconfigured profiles (`rps10`, `baseline`, `100`).
  - `docker-compose.k6-grafana.yml`: Exports live telemetry to the Grafana web dashboard on port 5665.
- **Scenarios in `scripts/performance/`:**
  - `smoke.js`: Smoke test (10 → 100 VUs).
  - `soak.js`: Endurance test under sustained load.
  - `spike.js`: Sudden traffic spike resilience test.
  - `mixed-workload.js`: Realistic e-commerce browsing, searching, and cart operations.
  - `analytics.js`: Admin analytics endpoint p95 latency testing.
  - `kvm2-equivalent-campaign.js`: Full Hostinger KVM2 capacity benchmark campaign.
  - `kvm2-octane-predeploy.js`: Pre-deployment validation against Octane Swoole.

---

## 12. CI/CD Configuration

All 6 GitHub Actions workflows in `.github/workflows/` were audited:

1. **`ci.yml`:** Core verification pipeline (lint, typecheck, Vitest, Playwright E2E with Redis, PHPUnit, MySQL index EXPLAIN tests, Redis integration, queue integration, and broadcast authorization).
2. **`staging-deploy.yml`:** Validates staging `.env` safety and executes staging smoke tests (`scripts/staging/smoke.sh`).
3. **`performance.yml`:** Weekly scheduled k6 load smoke test against Octane with Swoole.
4. **`deploy-pages.yml`:** Automated Vite static build deployment to GitHub Pages.
5. **`messaging-integration.yml`:** Validates outbox processing, chat moderation, and notification state machines with MySQL and Redis.
6. **`npm-publish-github-packages.yml`:** Publishes client packages on release tags.

**Conclusion:** No workflow references obsolete Docker or script files.

---

## 13. Deployment Configuration

The `deploy/` directory contains complete documentation and configuration templates:
- `deploy/BACKUP-RESTORE.md`: MySQL dump and point-in-time recovery runbook.
- `deploy/DEPLOYMENT.md`: Zero-downtime deployment instructions.
- `deploy/MONITORING.md`: Sentry, health probes, and log rotation.
- `deploy/OPERATIONS.md`: Routine maintenance, cache clearing, and queue drainage.
- `deploy/PRODUCTION.md`: Production architecture diagram and hardware prerequisites.
- `deploy/RENDER_VERCEL.md` & `deploy/VERCEL.md`: PaaS cloud deployment guide.
- `deploy/ROLLBACK.md`: Emergency rollback procedures.
- `deploy/SCALING.md`: Horizontal scaling guidelines for Octane and Reverb.
- `deploy/SECURITY.md`: SSL, firewall, Redis password, and CORS constraints.

---

## 14. Generated Artifacts

The audit verified build output handling and tracking hygiene:
- `frontend/dist/`: Git-ignored (`.gitignore` line 9).
- `backend/vendor/`: Git-ignored (`.gitignore` line 11).
- `frontend/node_modules/`: Git-ignored (`.gitignore` line 2).
- `storage/logs/`: Git-ignored (`.gitignore` line 22).
- `.env` files: All local environment files containing secrets are git-ignored; only clean `.example` templates and Vite's non-secret `frontend/.env.production` are tracked.
- Working tree remains completely clean after local builds.

---

## 15. KEEP List

Every file below is explicitly preserved and protected:

### KEEP — PRODUCTION
- `docker-compose.production.yml`
- `backend/Dockerfile.fpm`
- `backend/scripts/docker-production-boot.sh`
- `deploy/nginx/kvm2-docker.conf`
- `deploy/nginx/production.conf.example`
- `deploy/php/fpm-pool-kvm2.conf`
- `deploy/php/fpm-pool-small.conf.example`
- `deploy/php/fpm-pool-medium.conf.example`
- `deploy/php/fpm-pool-large.conf.example`
- `deploy/php/opcache-production.ini.example`
- `deploy/supervisor/diyar-notifications.conf`
- `deploy/docker/production.env.example`
- `scripts/deploy/deploy-release.sh`
- `deploy/BACKUP-RESTORE.md`
- `deploy/DEPLOYMENT.md`
- `deploy/MONITORING.md`
- `deploy/OPERATIONS.md`
- `deploy/PRODUCTION.md`
- `deploy/ROLLBACK.md`
- `deploy/SCALING.md`
- `deploy/SECURITY.md`
- `deploy/workers/README.md`

### KEEP — DEV
- `docker-compose.dev.yml`
- `docker-compose.local-gateway.yml`
- `deploy/nginx/local-dev-gateway.conf`
- `deploy/docker/production.env.local.example`
- `scripts/local/start-local-dev.ps1`
- `scripts/local/start-dev-gateway.ps1`
- `scripts/local/start-frontend-prod-api.ps1`
- `scripts/local/Ensure-DiyarHostsEntry.ps1`
- `scripts/local/Sync-ProductionEnv.ps1`
- `scripts/local/rebuild-production-api.ps1`
- `frontend/scripts/stop-preview-port.ps1`

### KEEP — VPS SIMULATION
- `docker-compose.production-like.yml`
- `docker-compose.kvm2-test.yml`
- `deploy/nginx/production-like.conf`
- `deploy/nginx/kvm2-docker-spa.conf`
- `deploy/docker/mysql-kvm2.cnf`
- `deploy/docker/kvm2-test.env.example`
- `scripts/local/start-production-stack.ps1`
- `scripts/performance/run-kvm2-equivalent-validation.ps1`
- `scripts/certification/run-2fa-docker-cert.ps1`
- `scripts/certification/collect-platform-measurements.ps1`
- `scripts/certification/setup-phase21-dirs.ps1`

### KEEP — OCTANE
- `docker-compose.production.octane.yml`
- `docker-compose.multinode.yml`
- `backend/Dockerfile.octane`
- `backend/Dockerfile.octane.spx`
- `backend/docker/spx.ini`
- `backend/scripts/octane-multinode-boot.sh`
- `backend/scripts/run-certification-gates.bat`
- `deploy/nginx/kvm2-docker-octane.conf`
- `deploy/nginx/multinode-octane.conf`
- `scripts/performance/run-octane-predeploy.ps1`
- `scripts/performance/kvm2-octane-predeploy.js`
- `scripts/performance/kvm2-spx.ps1`
- `scripts/performance/kvm2-spx-kernel-profile.php`
- `scripts/performance/kvm2-spx-parse-flat.php`
- `scripts/performance/kvm2-spx-validate.ps1`
- `scripts/performance/kvm2-spx-export-report.ps1`

### KEEP — K6
- `docker-compose.loadtest.yml`
- `docker-compose.kvm2-test.k6.yml`
- `docker-compose.k6-grafana.yml`
- `scripts/performance/run-k6.ps1`
- `scripts/performance/start-loadtest.sh`
- `scripts/performance/smoke.js`
- `scripts/performance/soak.js`
- `scripts/performance/spike.js`
- `scripts/performance/mixed-workload.js`
- `scripts/performance/analytics.js`
- `scripts/performance/concurrency-matrix.js`
- `scripts/performance/kvm2-equivalent-campaign.js`
- `scripts/performance/common.js`
- `scripts/performance/profiles.js`
- `scripts/performance/rps-profiles.js`
- `scripts/performance/stage28-workload.js`
- `scripts/performance/room-design-save-smoke.js`
- `scripts/performance/README.md`
- `scripts/performance/run-kvm2-phase*.ps1` (Phase runners 2, 15, 17, 18, 19, 20, 21)

### KEEP — CI/CD
- `.github/workflows/ci.yml`
- `.github/workflows/staging-deploy.yml`
- `.github/workflows/performance.yml`
- `.github/workflows/deploy-pages.yml`
- `.github/workflows/messaging-integration.yml`
- `.github/workflows/npm-publish-github-packages.yml`
- `scripts/e2e/bootstrap-backend.sh`
- `scripts/e2e/bootstrap-stack.ps1`
- `scripts/e2e/start-backend.sh`
- `scripts/staging/smoke.sh`

### KEEP — SHARED
- `docker-compose.staging.yml`
- `backend/.dockerignore`
- `backend/.env.example`
- `backend/.env.staging.example`
- `backend/.env.production.example`
- `backend/.env.loadtest.example`
- `frontend/.env.example`
- `frontend/.env.production`
- `frontend/.env.production.example`
- `frontend/.env.staging.example`
- `frontend/.env.prod-api.example`
- `frontend/.env.docker-spa.example`
- `frontend/e2e/.env.example`
- `frontend/scripts/lighthouse-preview.ps1`
- `scripts/test-phpunit.ps1`
- `scripts/test-phpunit-mysql.ps1`
- `scripts/test-phpunit-mysql.sh`
- `scripts/test-queue-integration.ps1`
- `scripts/test-redis-integration.ps1`
- `scripts/qa/run-platform-certification.ps1`
- `scripts/qa/run-phase-28-17-certification.ps1`
- `scripts/qa/_helpers.ps1`
- `scripts/qa/README.md`
- `backend/scripts/probe-avatar-http.sh`
- `backend/scripts/probe-avatar-upload.php`
- `backend/scripts/probe-profile-avatar-flow.php`
- `backend/scripts/probe-provider-avatar-flow.php`

---

## 16. ARCHIVE List

Files retained for architectural reference, cloud PaaS deployment blueprints, or historical capacity evidence:
1. `render.yaml` — Render Cloud Blueprint specification (PaaS alternative target documented in `deploy/RENDER_VERCEL.md`).
2. `backend/scripts/render-web-start.sh` — Render web worker entrypoint script.
3. `deploy/RENDER_VERCEL.md` & `deploy/VERCEL.md` — Cloud PaaS deployment runbooks.
4. `backend/scripts/stage28-*.php` (19 scripts) — Database and API performance benchmark scripts cited in Stage 28 verification documentation.
5. `backend/scripts/stage2817-*.php` (27 scripts) — Concurrency, adversarial probe, and multinode verification scripts cited in Phase 28.17 documentation.
6. `backend/scripts/stage29-*.php` (5 scripts) — Database deep audit, table optimization, and scale verification scripts cited in Stage 29 documentation.
7. `backend/scripts/concurrency-worker-bootstrap.php` & `certification-session-multinode-probe.php` — Historical concurrency test helpers.

*Note: In accordance with Section 6 and Section 22, ARCHIVE files are preserved in place without deletion.*

---

## 17. DELETE List

**Total Files Safe to Delete: 0**

*Evidence:* Every single infrastructure configuration file in the repository maps directly to an active, required operational role. No duplicate compose files, orphan Dockerfiles, untracked build artifacts, or dead deployment scripts were found.

---

## 18. BLOCKED List

**Total Blocked Files: 0**

Every infrastructure file was definitively analyzed, referenced, and classified.

---

## 19. Changes Implemented

- Performed complete read-only audit across 100% of infrastructure assets.
- Validated all 11 Docker Compose configurations with `docker compose config` (all exit 0).
- Validated all Dockerfiles and build contexts.
- Verified absence of committed build artifacts and confirmed clean working tree.
- Documented canonical topologies for Dev, Production, VPS Simulation, Octane, and k6.

---

## 20. Regression Tests

| Suite | Gate Requirement | Result | Status |
|---|---|---|---|
| Backend Routes | 528 registered routes | 528 HTTP routes | **PASS** |
| Backend PHPUnit | 1,101 pass / 7 skip / 0 fail | 1,101 passed, 7 skipped, 0 failed (1,108 total tests, 4,560 assertions) | **PASS** |
| Frontend Vitest | 350 / 350 passed | 350 passed (87 test suites) | **PASS** |
| Frontend TypeScript | 0 errors | 0 errors (`npx tsc --noEmit` exit 0) | **PASS** |
| Frontend ESLint | 0 warnings/errors | 0 warnings, 0 errors (`npm run lint` exit 0) | **PASS** |
| Frontend Build | Production build PASS | Built in 17.69s (`npm run build` exit 0) | **PASS** |
| Docker Compose Syntactic Validation | Exit 0 on all 11 configs | 11/11 configs exit 0 | **PASS** |

---

## 21. Remaining Limitations

1. **Host-Dependent Swoole Execution:** Swoole is not compiled into native Windows PHP; running local Octane and k6 high-concurrency benchmarks continues to require the Docker Octane stack (`docker-compose.loadtest.yml` or `docker-compose.production.octane.yml`) or WSL2/Linux.
2. **Production Secrets:** Live production secrets (`APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `REVERB_APP_SECRET`) must be provided via `deploy/docker/production.env` on the VPS host and are not stored in repository version control.

---

## 22. Final Certification

### **CERTIFIED WITH LIMITATIONS**

The repository infrastructure and Docker configurations have been thoroughly audited, categorized, and verified. All protected development, production, VPS simulation, Octane, k6, Reverb, Redis, MySQL, queue worker, scheduler, Nginx, and CI/CD assets are intact and verified. The repository is in an optimal, clean state ready for Step 13 (VPS Production Simulation).

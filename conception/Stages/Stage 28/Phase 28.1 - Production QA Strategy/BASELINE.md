# Phase 28.1 — Measured Baseline

**Captured:** 2026-08-27 (local workstation)  
**Git commit:** `92638a9ef5e5dcce27ca56a3ededdf3d40163bed`  
**Branch:** `dev`  
**Worktree:** **DIRTY** (uncommitted Stage 28 docs + diagnostic scripts — see §Worktree)

---

## Worktree integrity

| Item | Value |
|------|-------|
| `git rev-parse HEAD` | `92638a9ef5e5dcce27ca56a3ededdf3d40163bed` |
| Branch | `dev` |
| Pre-existing uncommitted | `conception/Stages/Stage 28/`, `backend/scripts/stage28-*.php` |
| Phase 28.1 additions (uncommitted) | Phase 28.1 docs, benchmark scripts, `_*.txt` raw outputs |

**Commits created:** NO

---

## Environment summary

See [ENVIRONMENT.md](./ENVIRONMENT.md). Measured highlights:

| Component | Measured value |
|-----------|----------------|
| PHP | 8.4.0 (CLI) |
| Laravel | 13.26.1 |
| Node | 23.11.0 |
| npm | 11.6.4 |
| Composer | 2.8.3 |
| DB engine | **MariaDB 10.4.32** (via `SELECT VERSION()`) |
| Redis | 7.4.7 (Docker) |
| phpredis | 6.1.0 |

---

## Backend tests (PHPUnit)

**Command:** `php artisan test`  
**Environment:** `phpunit.xml` — sqlite `:memory:`, `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array`  
**Duration:** ~88.3s (88,257 ms reported in JSON summary)

| Metric | Result |
|--------|--------|
| Total tests | **732** |
| Passed | **731** |
| Errors | **1** |
| Failed | 0 |
| Skipped | NOT MEASURED separately |
| Assertions | **3155** |
| Exit code | **2** (failure) |

### Failure detail

| Test | Error | Classification |
|------|-------|----------------|
| `Tests\Unit\Services\Shipping\ShippingRulePrecedenceTest::test_vendor_specific_rule_wins_over_platform_rule` | `Cart weight exceeds the maximum supported limit.` | **APPLICATION DEFECT** or **TEST DEFECT** (fixture weight) — requires Phase 28.3 triage |

Raw output: `_phpunit_output.txt`

### Test inventory

| Category | File count |
|----------|------------|
| PHPUnit total | 143 |
| Unit | 15 |
| Feature | 128 |

---

## Frontend unit tests (Vitest)

**Command:** `npm run test` (vitest run)  
**Duration:** 30.29s

| Metric | Result |
|--------|--------|
| Test files | 25 |
| Tests | **124** |
| Passed | **124** |
| Failed | 0 |
| Coverage | **NOT CONFIGURED** |

**Warnings:** React `act(...)` warnings in `AuthContext.test.tsx`, `B2BCompanyPage.test.tsx` (tests still PASS).

Raw output: `_vitest_output.txt`

---

## E2E tests (Playwright)

### Local run (existing `composer dev` servers)

**Command:** `npm run test:e2e` (CI=false, reuse running API on :8000)  
**Date:** 2026-08-27  
**Workers:** 6  
**Duration:** ~2.9m (174s)

| Metric | Result |
|--------|--------|
| Total tests | **39** |
| Passed | **33** |
| Failed | **3** |
| Did not run | **3** (serial `b2b-admin` suite aborted after first failure) |
| Browser | chromium |
| Base URL | `http://127.0.0.1:3000` |
| API URL | `http://127.0.0.1:8000/api/v1` |
| DB | MariaDB `diyar` (dev seed state — **not** E2E bootstrap) |
| Redis | enabled (local `.env`) |

#### Failures (local)

| Spec | Failure | Classification |
|------|---------|----------------|
| `b2b-admin.spec.ts` | Draft company preview not visible after draft filter | **ENVIRONMENT GAP** (dev DB lacks E2E B2B seed) or **APPLICATION DEFECT** |
| `blog.spec.ts` | `GET /blog/articles/{slug}` not OK | **ENVIRONMENT GAP** (missing E2E blog article in dev DB) |
| `projects.spec.ts` | Modal overlay intercepts Projects button click (90s timeout) | **TEST DEFECT** or **UI DEFECT** |

### CI-mode attempt (BLOCKED)

**Command:** `CI=true npm run test:e2e`  
**Result:** **BLOCKED** — port 8000 already in use (`composer dev` running); Playwright webServer could not start.

### Last reported CI run (reference only — commit `92638a9` era)

From prior CI logs on `dev`: ~35 passed, 2 failed, 2 flaky (loyalty/b2b-admin). **NOT re-run in this Phase 28.1 session** after local changes.

Raw output: `_playwright_output.txt`

---

## Static quality checks

| Tool | Command | Result | Notes |
|------|---------|--------|-------|
| TypeScript | `npm run typecheck` | **PASS** | |
| ESLint | `npm run lint` | **PASS** | Scoped paths only |
| Prettier | `npm run format:check` | **PASS** | |
| Laravel Pint | `vendor/bin/pint --test` | **FAIL** | 1 file: `backend/scripts/stage28-queue-verify.php` (Phase 28.1 instrumentation — style only) |
| PHPStan/Larastan | — | **NOT CONFIGURED** | No entry in `composer.json` |

---

## Production frontend build

**Command:** `npm run build`  
**Result:** **PASS**  
**Duration:** 20.10s  
**Modules transformed:** 3284

### Largest JS assets (raw / gzip)

| File | Raw | Gzip |
|------|-----|------|
| `index-iADxzyGO.js` | 499.27 kB | 143.59 kB |
| `CartesianChart-DsugK3Y2.js` | 324.78 kB | 98.89 kB |
| `vendor-react-BjpkU8XY.js` | 194.25 kB | 60.73 kB |
| `MarketplaceShell-BGSHbfqp.js` | 189.81 kB | 59.31 kB |
| `confirmDialog-BP8QSvUC.js` | 86.13 kB | 22.32 kB |

### CSS

| File | Raw | Gzip |
|------|-----|------|
| `index-DNTpKyNo.css` | 248.85 kB | 34.36 kB |

**Build warnings:** NOT MEASURED (none observed in captured output)

Raw output: `_build_output.txt`

---

## Health endpoints

**Environment:** local `composer dev`, Redis + MariaDB

| Endpoint | HTTP | Response time | Purpose |
|----------|------|---------------|---------|
| `GET /api/v1/health` | 200 | **115.6 ms** | Full readiness-style payload |
| `GET /api/v1/health/live` | 200 | NOT MEASURED separately | Liveness (`status: live` only) |
| `GET /api/v1/health/ready` | 200 | NOT MEASURED separately | Same payload as `/health` |

### `/api/v1/health` checks (2026-08-27)

```json
{
  "database": { "ok": true, "driver": "mysql" },
  "cache": { "ok": true, "driver": "redis" },
  "queue": { "ok": true, "driver": "redis", "pending_jobs": 0, "failed_jobs": 0 },
  "payments": { "ok": true, "status": "ok", "metrics": { "provider": "fake" } }
}
```

**Liveness vs readiness:** `/health/live` is minimal (process up). `/health` and `/health/ready` include dependency checks — suitable for **readiness**, not pure liveness.

---

## Redis baseline

Gate verification: [../REDIS_VERIFICATION.md](../REDIS_VERIFICATION.md) — **PASS**

### Warm latency benchmark (15 iterations, warm PHP process)

**Command:** `php scripts/stage28-redis-benchmark.php --iterations=15`  
**Note:** Laravel already bootstrapped in CLI process. **456 ms "PING" from initial gate was cold-bootstrap artifact**, not Redis server latency.

| Operation | min (ms) | median (ms) | p95 (ms) | max (ms) |
|-----------|----------|-------------|----------|----------|
| Redis PING (warm) | 0.49 | 0.52 | 0.77 | 0.77 |
| Raw SET/GET/DEL | 1.52 | 1.59 | 9.51 | 9.51 |
| Laravel cache roundtrip | 1.57 | 1.67 | 3.58 | 3.58 |
| Queue `size()` | 0.51 | 0.57 | 1.05 | 1.05 |

### Queue worker execution

**Command:** `php scripts/stage28-queue-verify.php`  
**Result:** PASS — dispatch 677.8 ms, worker `--once` 377.6 ms, marker processed, failed_jobs=0

---

## Database baseline

**Command:** `php scripts/stage28-db-baseline.php`  
**Connection:** mysql → database `diyar` @ 127.0.0.1

| Metric | Value |
|--------|-------|
| Engine | **MariaDB 10.4.32** |
| Migration files | 93 |
| Tables in `diyar` schema (critical set) | See script output |
| `failed_jobs` rows | 0 |
| `sessions` rows | 6 |

**Caveat:** `Schema::getTableListing()` reported **226 tables** including **other databases on shared server** (`hospital_stock.*`, `cybercafe_db.*`) — environment isolation gap (see KNOWN_ISSUES.md).

**Database size:** NOT MEASURED

---

## PHP resource limits (local CLI)

| Setting | Value |
|---------|-------|
| memory_limit | 128M |
| max_execution_time | 0 (unlimited CLI) |
| upload_max_filesize | 2M |
| post_max_size | 8M |

PHPUnit overrides: `memory_limit=512M` in `phpunit.xml`

---

## k6 / load-test capability (inventory only — no load run in 28.1)

| Script | Peak VUs | Duration | Endpoints | Thresholds |
|--------|----------|----------|-----------|------------|
| `smoke.js` | 100 | ~100s | `/health`, `/catalog/search`, `/products` | p95<1500ms, fail<5% |
| `profiles.js` | 10 → **25000** (profile env) | varies | catalog hot paths | profile-specific |
| `analytics.js` | 20 | 60s | admin/vendor/provider analytics | p95<3000ms, fail<10% |
| `common.js` | — | shared helpers | auth session, cookie jar | — |

**25K VUs:** profile defined in `profiles.js` — **NOT VERIFIED** (consistent with Stage 22 / README).

---

## API surface (inventory)

**Source:** `backend/routes/api.php` + `php artisan route:list --path=api/v1`  
**Approximate route count:** ~100+ (monolithic api.php)  
Detailed domain mapping: [TEST_MATRIX.md](./TEST_MATRIX.md)

---

## CI baseline summary

| Workflow | PHP | Node | DB | Redis | Notes |
|----------|-----|------|-----|-------|-------|
| `ci.yml` frontend | — | 22 | — | — | typecheck, lint, vitest, build |
| `ci.yml` e2e | 8.3 | 22 | sqlite (bootstrap) | yes | Playwright |
| `ci.yml` backend | 8.3 | — | sqlite memory | **no** | PHPUnit + Pint |
| `ci.yml` k6-analytics | 8.3 | — | sqlite (bootstrap) | yes | analytics smoke |
| `performance.yml` | 8.3 | — | MySQL (compose) | yes | Octane k6 |
| `messaging-integration.yml` | 8.3 | — | MySQL | yes | separate PR path |

**Local vs CI parity:** **PARTIAL** — PHPUnit never uses Redis; local E2E uses dev MariaDB vs CI sqlite seed.

---

## Phase 28.1 baseline verdict

| Area | Status |
|------|--------|
| PHPUnit | **FAIL** (1 error / 732) |
| Vitest | **PASS** |
| Playwright (local dev DB) | **FAIL** (3/39; 3 skipped) |
| Static analysis | **PARTIAL** (Pint fail on instrumentation file) |
| Production build | **PASS** |
| Health | **PASS** |
| Redis | **PASS** |
| Load testing at scale | **NOT VERIFIED** |

**Optimization started:** NO  
**Production ready:** NO

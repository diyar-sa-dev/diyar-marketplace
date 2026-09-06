# Phase 28.5 — E2E Seed Parity (KI-028-048)

**Status:** **INVESTIGATED — RESOLVED WITH PROCEDURE**

---

## Problem statement

Phase 28.4 Playwright against `composer dev` (MariaDB) reported:

| Spec | Failure |
|------|---------|
| `blog.spec.ts` | `e2e-blog-article` API not OK |
| `b2b-admin.spec.ts` | `draft-b2b-company` not visible in admin filter |
| `projects.spec.ts` | Modal intercept (separate issue KI-028-041) |

---

## Root cause

| Layer | Local dev (`composer dev`) | CI / E2E bootstrap |
|-------|---------------------------|-------------------|
| Database | MariaDB `diyar` (incremental dev state) | SQLite `database/database.sqlite` |
| Seed | **Not** `migrate:fresh --seed` on every run | **`migrate:fresh --seed`** via `bootstrap-backend.sh` |
| E2E fixtures | Missing unless manually seeded | Always present via `DatabaseSeeder` |

**E2E-specific seeders in `DatabaseSeeder`:**

| Seeder | Slugs / data |
|--------|--------------|
| `BlogE2eSeeder` | `e2e-blog-article`, `e2e-showcase-project` |
| `B2bContentSeeder` | `draft-b2b-company` (draft) |
| `B2bE2eSeeder` | `e2e-b2b-company`, `e2e-b2b-draft` |

---

## Measured evidence

### Dev MariaDB (composer dev API :8000)

```text
GET /api/v1/blog/articles/e2e-blog-article → 404
GET /api/v1/b2b/companies/draft-b2b-company → 404 (expected public)
```

### Fresh SQLite (`migrate:fresh --seed`)

```text
blog e2e-blog-article: EXISTS (published)
draft-b2b-company: EXISTS (draft)
published projects: 4
```

### CI-parity local run (SQLite :8000 + preview :3000)

After `cache:clear` (Redis had stale blog miss — see KI-028-049):

| Spec | Result |
|------|--------|
| `blog.spec.ts` | **PASS** |
| `b2b-admin.spec.ts` (draft filter) | **PASS** |
| `b2b-admin.spec.ts` (publish flow) | **PASS** |

---

## Reproducible E2E procedure (Windows)

Equivalent to CI `bootstrap-backend.sh`:

```powershell
cd backend
$env:DB_CONNECTION='sqlite'
$env:DB_DATABASE=(Resolve-Path 'database/database.sqlite')
$env:CACHE_STORE='redis'
$env:REDIS_HOST='127.0.0.1'
$env:QUEUE_CONNECTION='sync'
$env:DIYAR_PAYMENT_USE_FAKE_GATEWAY='true'
$env:DIYAR_LOADTEST_MODE='true'
php artisan migrate:fresh --seed --force
php artisan cache:clear
php artisan serve --host=127.0.0.1 --port=8000
```

Frontend (separate terminal):

```powershell
cd frontend
$env:VITE_API_URL='/api/v1'
$env:VITE_BACKEND_URL=''
npm run build
npx vite preview --host 127.0.0.1 --port 3000
```

Playwright:

```powershell
cd frontend
npm run test:e2e
```

**Note:** `composer dev` must **not** occupy ports 8000/3000. CI bash scripts are not native on Windows — manual parity above.

---

## Classification

| ID | Classification |
|----|----------------|
| KI-028-048 | **ENVIRONMENT GAP** — dev MariaDB ≠ CI SQLite seed |
| KI-028-003/004/009 | **CONFIRMED** same root cause |

---

## Gate

```text
PASS (with documented procedure)
```

Local dev E2E ≠ CI unless seed/bootstrap is applied.

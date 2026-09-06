# Phase 28.5 — E2E Environment

**Raw:** `_e2e_environment.json`

---

## CI-equivalent stack (measured 2026-08-27)

| Component | Value |
|-----------|-------|
| **Database engine** | SQLite 3.43.2 |
| **Database file** | `backend/database/database.sqlite` |
| **Seed** | `php artisan migrate:fresh --seed --force` |
| **Backend** | Laravel `artisan serve` → `http://127.0.0.1:8000` |
| **Frontend** | Vite preview (prod build) → `http://127.0.0.1:3000` |
| **API proxy** | Preview proxies `/api` → `:8000` |
| **Redis** | `127.0.0.1:6379` — `CACHE_STORE=redis` |
| **Queue** | `sync` (CI bootstrap) |
| **Session** | `database` |
| **Payment** | Fake gateway enabled |
| **Browser** | Chromium (Playwright) |
| **Node** | v23.11.0 (local); CI uses 22 |
| **PHP** | 8.4.0 (local); CI uses 8.3 |

---

## Local development stack

| Component | Value |
|-----------|-------|
| **Database** | MariaDB 10.4.x / MySQL — `diyar` schema |
| **Backend** | `composer dev` → :8000 |
| **Frontend** | Vite dev → :3000 |
| **Seed** | **Not** auto-refreshed — incremental dev data |

---

## GitHub CI (`.github/workflows/ci.yml`)

| Step | Action |
|------|--------|
| Bootstrap | `bash scripts/e2e/bootstrap-backend.sh` |
| DB | SQLite + full `DatabaseSeeder` |
| Redis | Service container redis:7 |
| Frontend | `npm run build` + `preview :3000` |
| Playwright | `CI=true npm run test:e2e` (webServer auto-start) |

---

## Windows limitation

CI bash bootstrap is **not native** on Windows. Phase 28.5 used PowerShell-equivalent bootstrap (documented in `E2E_SEED_PARITY.md`).

---

## Pre-run checklist

1. Free ports 8000 and 3000
2. Redis running (for cache)
3. `migrate:fresh --seed` on SQLite
4. **`php artisan cache:clear`** after DB switch (KI-028-049)
5. Production build with `VITE_API_URL=/api/v1`

---

## Gate

```text
PASS
```

Reproducible CI-parity environment documented and executed.

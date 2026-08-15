# Local Development Setup

> **Status:** CURRENT BASELINE — Stage 1 finalized  
> **Last updated:** 2026-08-15

## Required Toolchain

| Tool | Required Version | Notes |
|------|------------------|-------|
| **Node.js** | **20 LTS** (recommended) | `.nvmrc` at repo root and `frontend/` pins `20`. Node 23 is not LTS and may cause watcher issues on Windows/OneDrive. |
| **npm** | 10+ (bundled with Node 20) | Use `npm ci` in CI |
| **PHP** | **8.3+** | Required by `backend/composer.json` |
| **Composer** | **2.x** | 2.8+ tested |
| **MySQL** | **8.0+** | V1 default (sqlite OK for quick local dev / tests) |

## Monorepo Layout

Always run frontend commands from `frontend/`:

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**Do not** run Vite from the repository root.

## Frontend

```bash
cd frontend
npm ci
npm run dev
npm run build
npm run typecheck
npm run lint
npm test
```

Copy `frontend/.env.example` → `frontend/.env.local` and set:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate        # requires MySQL or switch to sqlite in .env
php artisan serve          # http://localhost:8000
```

Verify health:

```bash
curl http://localhost:8000/api/v1/health
```

### MySQL (recommended)

Create database `diyar` and configure `DB_*` in `backend/.env` (see `.env.example`).

### SQLite (quick local fallback)

```env
DB_CONNECTION=sqlite
# DB_DATABASE=database/database.sqlite
```

## Quality Commands

| Area | Command |
|------|---------|
| Backend tests | `cd backend && php artisan test` |
| Backend format | `cd backend && vendor/bin/pint` |
| Frontend tests | `cd frontend && npm test` |
| Frontend format | `cd frontend && npm run format` |

## Queue Worker (V1 — database queue)

```bash
cd backend
php artisan queue:work
```

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | `frontend/.env.local` | API base URL |
| `FRONTEND_URL` | `backend/.env` | CORS + Sanctum stateful domains |
| `DB_*` | `backend/.env` | MySQL / sqlite |
| `APP_URL` | `backend/.env` | Laravel URL |

## OneDrive / Windows Notes

- Repository on OneDrive increases file-lock risk (`EBUSY`)
- Keep Vite scoped to `frontend/` only
- Prefer Node 20 LTS over Node 23 for dev stability

## AI Development Control

Before any implementation, read `.agent/SYSTEM.md` and `.agent/CURRENT_STATE.md`.

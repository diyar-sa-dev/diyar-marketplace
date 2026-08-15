# GitHub / Repository Workflow

> **Status:** CURRENT BASELINE — Stage 1 finalized

## Remote

- `origin`: https://github.com/diyar-sa-dev/diyar-marketplace.git

## Branches

- `main` — production-aligned / GitHub Pages deploy
- `dev` — active development

## CI Workflows

| Workflow | Path | Trigger |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | Push/PR to `main`, `dev` |
| Deploy Pages | `.github/workflows/deploy-pages.yml` | Push to `main` |

### CI pipeline

**Frontend** (`frontend/`): typecheck → eslint → prettier → vitest → build

**Backend** (`backend/`): pint → phpunit (sqlite in-memory)

## Development Commands

| Component | Directory | Command |
|-----------|-----------|---------|
| Frontend dev | `frontend/` | `npm run dev` |
| Frontend build | `frontend/` | `npm run build` |
| Frontend test | `frontend/` | `npm test` |
| Backend serve | `backend/` | `php artisan serve` |
| Backend test | `backend/` | `php artisan test` |

**Never run Vite from repository root.**

## Commit Conventions

`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `ci:`

## Do Not Commit

- `frontend/node_modules/`, `frontend/dist/`
- `backend/vendor/`
- `.vite/` (anywhere)
- `.env` files (except `.env.example`)

## Project Control

See `.agent/` for AI development protocol and current stage status.

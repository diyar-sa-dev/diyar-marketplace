# DIYAR Marketplace

Arabic RTL multi-vendor marketplace for furniture products and home services — **Saudi Arabia** (SAR, VAT 15%).

## Status

| Stage | Status |
|-------|--------|
| Stage 0 — Discovery & Architecture | **COMPLETE** |
| Stage 1 — Engineering Foundation | **COMPLETE / FINALIZED** |
| Stage 2 — Identity & Access | **COMPLETE / FINALIZED** |
| **Next:** Stage 3 — Catalog / Marketplace | **NOT AUTHORIZED** |

| Component | Status |
|-----------|--------|
| Frontend UI | React 19 SPA — auth integrated; marketplace UI still mock data |
| Backend API | Laravel 13 — health + **Stage 2 identity/auth API** |
| CI | GitHub Actions — lint, test, build (frontend + backend) |

Live project state: [.agent/CURRENT_STATE.md](.agent/CURRENT_STATE.md)

## Repository Structure

```
diyar-marketplace/
├── .agent/              # AI development control & current stage state
├── conception/          # Product, architecture, business rules, stage reports
│   └── API/             # Implemented API docs + Postman collection
├── frontend/            # React 19 + TypeScript + Vite (run all npm commands here)
├── backend/             # Laravel 13 REST API (/api/v1)
└── .github/workflows/   # CI + GitHub Pages deploy
```

## Quick Start

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env.local   # optional: set VITE_API_URL
npm run dev                  # http://localhost:3000
```

**Important:** Always run Vite from `frontend/` — not the repo root (OneDrive/monorepo watcher issues).

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve            # http://localhost:8000
curl http://localhost:8000/api/v1/health
```

Full setup: [conception/runbooks/LOCAL_SETUP.md](conception/runbooks/LOCAL_SETUP.md)

### Quality checks

```bash
# Frontend
cd frontend && npm run typecheck && npm run lint && npm test && npm run build

# Backend
cd backend && vendor/bin/pint --test && php artisan test
```

## Documentation

| Document | Purpose |
|----------|---------|
| [MASTER_DEVELOPMENT_PLAN.md](conception/MASTER_DEVELOPMENT_PLAN.md) | Roadmap & stage map |
| [REQUIREMENTS_BASELINE.md](conception/REQUIREMENTS_BASELINE.md) | Authoritative business + tech rules |
| [conception/API/README.md](conception/API/README.md) | API conventions, health endpoint, Postman |
| [Stage 1 completion report](conception/Stages/Stage%201/STAGE_1_COMPLETION_REPORT.md) | Engineering foundation summary |
| [Stage 2 completion report](conception/Stages/Stage%202/STAGE_2_COMPLETION_REPORT.md) | Identity & access summary |
| [LOCAL_SETUP.md](conception/runbooks/LOCAL_SETUP.md) | Toolchain & environment |

**Postman:** import [DIYAR API v1 collection](conception/API/postman/DIYAR-API-v1.postman_collection.json) and [local environment](conception/API/postman/DIYAR-API-Local.postman_environment.json).

## Tech Stack (V1 baseline)

| Layer | Choice |
|-------|--------|
| Frontend | React 19, TypeScript, Vite, Tailwind, TanStack Query, Axios |
| Backend | Laravel 13, PHP 8.3+, MySQL 8 |
| Auth | Sanctum stateful sessions + CSRF (Stage 2) |
| API | REST `/api/v1`, JSON envelope |
| Architecture | Modular monolith |
| Cache / Queue | Laravel Cache, database queue |
| Testing | Vitest (frontend), PHPUnit (backend) |

## External Providers

| Domain | Provider | Status |
|--------|----------|--------|
| Payments | MyFatoorah (Saudi API) | Adapter deferred — Payments stage |
| OTP / SMS | MSEGAT / مسجات | **Adapter implemented (Stage 2)** — LogSmsProvider in dev |
| AI | OpenAI | Deferred — AI stage |

See [ADR-006](conception/adr/ADR-006-external-providers.md). No provider credentials belong in this repository.

## Branches

- `main` — production / GitHub Pages
- `dev` — active development

See [.github/WORKFLOW.md](.github/WORKFLOW.md).

## License

Private — DIYAR Marketplace.

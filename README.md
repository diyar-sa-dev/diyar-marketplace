# DIYAR Marketplace

Arabic RTL multi-vendor marketplace for furniture products and home services.

## Repository Structure

```
diyar-marketplace/
├── conception/     # Product & architecture documentation (start here)
├── frontend/       # React 19 + Vite UI prototype
├── backend/        # Laravel 13 API (Stage 0 scaffold)
└── github/         # Git workflow documentation
```

## Quick Start

### Documentation

Read [conception/MASTER_DEVELOPMENT_PLAN.md](conception/MASTER_DEVELOPMENT_PLAN.md) for the full roadmap.

Stage 0 completion: [conception/Stages/Stage 0/STAGE_0_COMPLETION_REPORT.md](conception/Stages/Stage%200/STAGE_0_COMPLETION_REPORT.md)

### Frontend (UI prototype)

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000 — run from frontend/ only
```

### Backend

Laravel 13 scaffold in `backend/`. Business modules begin in Stage 1.

See [conception/runbooks/LOCAL_SETUP.md](conception/runbooks/LOCAL_SETUP.md).

## Status

| Component | Status |
|-----------|--------|
| Frontend UI | Prototype (mock data) |
| Backend API | Laravel 13 scaffold only |
| Stage | **0 FINALIZED** — awaiting Stage 1 authorization |

## Tech Stack (V1 baseline)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Laravel 13, PHP 8.3+, Sanctum, MySQL 8
- **Architecture:** Modular monolith REST API (`/api/v1`)

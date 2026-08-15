# DIYAR Backend API

> **Status:** CURRENT — Stage 0 scaffold (no business modules)

Laravel application scaffold for the DIYAR marketplace API.

## Technology Baseline (V1)

| Item | Value |
|------|-------|
| Framework | **Laravel 13.x** (`laravel/framework ^13.17`) |
| PHP | ^8.3 |
| API prefix | `/api/v1` |
| Database (Stage 1+) | MySQL 8 |
| Auth (Stage 1+) | Laravel Sanctum |
| Cache (V1) | Laravel Cache |
| Queue (V1) | Database queue |
| Health check | `GET /api/v1/health` |

## Local Setup (Stage 1+)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_CONNECTION=mysql
php artisan migrate
php artisan serve
```

## Architecture

See [../conception/architecture/](../conception/architecture/) for system design, database, and API specifications.

## Stage 0 Scope

- [x] Laravel 13 project created
- [x] API route file with health endpoint
- [ ] Sanctum, modules, migrations — **Stage 1**

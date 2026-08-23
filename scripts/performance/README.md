# DIYAR k6 Load Profiles

Staged profiles for catalog hot paths (`health`, `catalog/search`, `products`).

## Important: use Octane + Swoole (not `artisan serve`)

`php artisan serve` is single-threaded and will **timeout** above ~30–50 concurrent VUs.
For PROFILE `100` and above, use the Docker Octane stack or Linux/WSL with Swoole.

| PROFILE | Peak VUs | Server |
|---------|----------|--------|
| `baseline` | 10 | Octane recommended |
| `100` | 100 | **Octane + MySQL required** |
| `500+` | 500–25K | Octane + staging infra |

## Quick start (Windows + Docker)

```powershell
# 1. Start Octane API + Redis + MySQL
docker compose -f docker-compose.loadtest.yml up --build

# 2. Run k6 on the same Docker network (recommended — avoids host.docker.internal timeouts)
.\scripts\performance\run-k6.ps1 -Profile 100
```

**Do not** use `host.docker.internal` for PROFILE 100 on Windows — k6 in a separate container often hits `dial: i/o timeout` under load. Use `run-k6.ps1` instead.

Manual equivalent:

```powershell
docker compose -f docker-compose.loadtest.yml --profile k6 run --rm -e PROFILE=100 k6
```

## Local Octane (Linux / WSL / macOS with Swoole)

```bash
cd backend
cp .env.loadtest.example .env
composer install
php artisan key:generate
# Use MySQL for profiles >= 100
php artisan migrate:fresh --seed --seeder=DatabaseSeeder --force
php artisan octane:start --server=swoole --host=127.0.0.1 --port=8000 --workers=8 --max-requests=2000
```

## Load-test optimizations (automatic with `DIYAR_LOADTEST_MODE=true`)

- API rate limits disabled
- Health probes cached (5s) to avoid DB/cache stampede under k6
- k6 sends `X-Forwarded-For` per VU (requires trusted proxies — enabled)

## Interpreting results

| Symptom | Likely cause |
|---------|----------------|
| `dial: i/o timeout` | k6 → `host.docker.internal` on Windows; use compose `k6` service |
| p95 > 1.5s at 100 VUs | SQLite DB or too few Octane workers |
| error rate > 5% | Server saturated or wrong BASE_URL |

## Evidence

Record results in `conception/Stages/Stage 22/LOAD_TEST_RESULTS.md` with:
- date, machine, server (`artisan serve` vs `octane+swoole`), DB (`sqlite` vs `mysql`), profile, p50/p95/p99, RPS, error rate
- mark **LOCAL VERIFIED** vs **STAGING VERIFIED** vs **NOT VERIFIED**

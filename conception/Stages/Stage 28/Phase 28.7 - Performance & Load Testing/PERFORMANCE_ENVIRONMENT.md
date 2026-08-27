# Performance Environment — Phase 28.7

**Date:** 2026-08-27  
**Reproducibility:** Documented; credential mismatch requires manual override (PERF-028-002).

---

## Host machine

| Field | Value |
|-------|-------|
| OS | Windows 10 (build 19045) |
| Role | Dev workstation running Docker Desktop |
| CPU/RAM | Not instrumented at OS level in this phase |

---

## Application stack (measured)

| Component | Version / config |
|-----------|------------------|
| API runtime | Laravel **Octane + Swoole** (Docker `Dockerfile.octane`) |
| PHP | **8.3.33** (container) |
| Laravel | **13.26.1** |
| Workers | 8 workers, 4 task workers, max-requests 2000 |
| Web exposure | `http://127.0.0.1:8000` (host) / `http://diyar-perf-api-28:8000` (compose network) |
| Load-test mode | `DIYAR_LOADTEST_MODE=true` (rate limits relaxed) |
| Fake payments | `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true` |

---

## Data stores

| Service | Image | Version | Connection |
|---------|-------|---------|------------|
| MySQL | `mysql:8.0` | **8.0.46** | `mysql:3306` — database **`diyar_staging`** |
| Redis | `redis:7-alpine` | **7.4.7** | `redis:6379` — prefix `diyar-loadtest-` |

### Credential note (PERF-028-002)

`docker-compose.loadtest.yml` declares `MYSQL_ROOT_PASSWORD=loadtest` and `diyar_loadtest`, but the **persistent Docker volume** was initialized with **`staging_root`** / **`diyar_staging`**. Phase 28.7 API container started with:

```text
DB_PASSWORD=staging_root
DB_DATABASE=diyar_staging
```

---

## Laravel drivers (Octane container)

| Driver | Value |
|--------|-------|
| `DB_CONNECTION` | mysql |
| `CACHE_STORE` | redis |
| `QUEUE_CONNECTION` | redis (API health); sync in one-off compose runs |
| `SESSION_DRIVER` | redis |

Health probe (`GET /api/v1/health`): **~11 ms** from compose network, status **ok**, DB + cache + queue checks passing.

---

## Frontend (measurement only)

| Field | Value |
|-------|-------|
| Build | Existing `frontend/dist` production build |
| Node version | Not re-captured (see Phase 28.4) |
| Mode | Static assets — no runtime server load-tested |

---

## Docker commands (reproduce API)

```powershell
# MySQL + Redis
docker compose -f docker-compose.loadtest.yml up -d mysql redis

# Octane API (override DB creds for existing volume)
docker compose -f docker-compose.loadtest.yml run -d --name diyar-perf-api-28 --service-ports `
  -e DB_PASSWORD=staging_root -e DB_DATABASE=diyar_staging `
  -e QUEUE_CONNECTION=redis -e DIYAR_LOADTEST_MODE=true `
  api sh -c "php artisan config:clear && php artisan octane:start --server=swoole --host=0.0.0.0 --port=8000 --workers=8 --task-workers=4 --max-requests=2000"

# k6 (working endpoints only)
docker run --rm --network diyar-marketplace_default `
  -v "${PWD}/scripts/performance:/scripts" `
  -e BASE_URL=http://diyar-perf-api-28:8000/api/v1 `
  -e PROFILE=100 grafana/k6 run /scripts/stage28-workload.js
```

**Important:** Do **not** mount host `backend/` volume — local `.env` breaks Redis host resolution.

---

## Known environment limits

| ID | Limit |
|----|-------|
| PERF-028-001 | Docker PHP image missing **bcmath** extension |
| PERF-028-002 | MySQL compose credentials ≠ volume credentials |
| PERF-028-003 | Local `php artisan serve` on :8000 conflicts with Docker — must stop before host tests |

Raw: [`raw/_environment_docker.json`](./raw/_environment_docker.json) (capture pending save from run output)

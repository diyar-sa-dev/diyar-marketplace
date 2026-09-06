# B01 — Octane Docker image missing `bcmath` extension

| Field | Value |
|-------|-------|
| **Problem** | `/api/v1/products` returned HTTP 500 under load; k6 showed ~80% error rate |
| **How discovered** | Docker logs: `Call to undefined function App\Services\Loyalty\bcadd()` |
| **Evidence** | `docker logs diyar-marketplace-api-1` after k6 rps25/rps100 |
| **Impact** | All catalog endpoints using loyalty pricing failed; load tests invalid |
| **Root cause** | `Dockerfile.octane` installed `pdo_mysql`, `swoole`, `redis` but not `bcmath`; `Dockerfile.fpm` had `bcmath` |
| **Fix** | Added `bcmath opcache` to `backend/Dockerfile.octane`; build-time guard `extension_loaded('bcmath')` |
| **Before** | k6 rps25: 80.8% errors, p95 13,563 ms |
| **After** | k6 rps10: 0% errors, p95 290 ms |
| **Residual risk** | Future Dockerfile changes must keep parity with `PhpRuntimeValidator` required extensions |
| **Scale trigger** | Run `php artisan diyar:validate-php-runtime` in CI/deploy |

---

# B02 — Load-test stack startup baked wrong config

| Field | Value |
|-------|-------|
| **Problem** | `docker-compose.loadtest.yml` API container failed MySQL auth on first boot |
| **How discovered** | Container crash loop; `Access denied for user 'root'` |
| **Evidence** | Prior session logs; fixed startup command |
| **Impact** | Could not benchmark MySQL 8 + Redis + Octane stack |
| **Root cause** | `config:cache` before `.env` was written; `.env` excluded from image via `.dockerignore` |
| **Fix** | Startup copies `.env.loadtest.example`, sed overrides, `config:clear` before Octane |
| **Before** | Stack unhealthy |
| **After** | Health 200; cache=redis, queue=redis, database=mysql |
| **Residual risk** | `migrate:fresh --seed` on every container recreate resets benchmark datasets |
| **Scale trigger** | Use named volume + conditional migrate for repeat benchmarks |

---

# B03 — Production-like stack staging safety false positive

| Field | Value |
|-------|-------|
| **Problem** | FPM stack could not migrate: `staging must not point at production database credentials` |
| **How discovered** | `docker compose exec app php artisan migrate` |
| **Evidence** | Database name `diyar_prodlike` matched `diyar_prod` substring in validator |
| **Impact** | PHP-FPM benchmark stack blocked |
| **Root cause** | `EnvironmentSafetyValidator::looksLikeProductionDatabase()` substring match too broad |
| **Fix** | Renamed DB to `diyar_staging_like`; `REDIS_PREFIX=diyar-staging-prodlike-` |
| **Before** | RuntimeException on boot |
| **After** | FPM health 200 via Nginx :8080 |
| **Residual risk** | Other `*prod*` database names may false-trigger in staging |
| **Scale trigger** | Use explicit env names (`diyar_staging_*`) in all non-prod stacks |

---

# B04 — Dev Docker host CPU saturation below target RPS

| Field | Value |
|-------|-------|
| **Problem** | Target 25–50 RPS not achieved; latency SLOs violated with 0% errors |
| **How discovered** | k6 constant-arrival-rate profiles rps25, rps50 |
| **Evidence** | rps25 actual 17.3 RPS p95 5096 ms; rps50 actual 24 RPS p95 8510 ms |
| **Impact** | Cannot verify 278 RPS / 1M req/hour on this workstation |
| **Root cause** | Limited host CPU/RAM sharing Docker Desktop + 8 Octane workers + MySQL + Redis |
| **Fix** | Document as hardware-limited; safe operating point measured at 10 RPS |
| **Before** | Projected 278 RPS in docs |
| **After** | **MEASURED safe 10 RPS** (Octane); saturation ~24 RPS with degraded latency |
| **Residual risk** | Production VPS with tuned FPM/Octane workers may differ |
| **Scale trigger** | Re-benchmark on target VPS before launch |

---

# B05 — PHP-FPM underperforms Octane on identical catalog workload (measured)

| Field | Value |
|-------|-------|
| **Problem** | FPM cannot sustain 10 RPS with acceptable latency on dev Docker |
| **How discovered** | k6 rps10 via Nginx→FPM vs direct Octane |
| **Evidence** | FPM: 6.3 RPS actual, p95 8228 ms; Octane: 10 RPS, p95 290 ms |
| **Impact** | Recommend Octane/Swoole for throughput-sensitive deployments |
| **Root cause** | FPM worker bootstrap per request + default worker count |
| **Fix** | None required — architecture selection evidence favors Octane |
| **Before** | Octane benefit projected |
| **After** | Octane **~28× better p95** at same target RPS on measured stack |
| **Residual risk** | FPM tuning (pm.max_children, opcache) not fully optimized in prod-like stack |
| **Scale trigger** | If Octane ops complexity unacceptable, tune FPM pool and re-measure |

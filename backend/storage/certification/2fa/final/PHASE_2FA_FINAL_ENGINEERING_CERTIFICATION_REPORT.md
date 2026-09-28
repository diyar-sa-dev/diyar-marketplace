# PHASE — 2FA FINAL ENGINEERING CERTIFICATION REPORT

**Project:** DIYAR Marketplace  
**Date:** 2026-09-11  
**Previous verdict:** CERTIFIED WITH LIMITATIONS (application-only evidence)  
**Final verdict:** **CERTIFIED WITH LIMITATIONS**

---

## 1. Executive Summary

2FA was validated against the **actual `diyar-production` Docker stack** (nginx → PHP-FPM 8.3 → MySQL → Redis). The API image was rebuilt to include 2FA routes; the migration was applied; and a host-side runtime harness (`scripts/certification/run-2fa-docker-cert.ps1`) executed **all mandatory security gates** with recorded evidence.

**Hard gates passed:**

- Test OTP `123456` rejected when `DIYAR_OTP_TEST_MODE=false`
- No password-only bypass; pending-2FA APIs return 401
- OTP replay and stale-challenge rejection
- **Parallel verification race:** 8 concurrent requests → **exactly 1** authentication success
- `GET /profile/security/two-factor` returns 200 when authenticated

**Remaining limitations** are environmental, not application-bypass defects:

- `APP_ENV=local` (local docker cert stack, not production SMS)
- Log SMS provider used (MSEGAT not configured on this host)
- Playwright E2E, multi-node, load test, restart chaos, and full PHPUnit suite not executed this cycle

---

## 2. Previous Certification → This Cycle

| Area | Before | After |
|------|--------|-------|
| Docker API image | Stale (404 on two-factor routes) | Rebuilt with 2FA code |
| Migration on Docker MySQL | Pending | **Applied** |
| Runtime HTTP security evidence | None | **11 gates PASS** |
| Parallel OTP race | NOT VERIFIED | **PASS** (1/8) |
| Test OTP production gate | PHPUnit only | **Docker HTTP PASS** |
| Playwright E2E | NOT VERIFIED | Still NOT VERIFIED |

---

## 3. Production Docker Environment

See `baseline.md`. Summary:

- **API:** http://127.0.0.1:8093
- **Compose project:** `diyar-production`
- **App image:** `diyar-production-app` (built 2026-09-11)
- **Git commit tested:** `257a7a719e5236272ff9e057b81e3fd68805d1e9`
- **Runtime:** PHP-FPM 8.3.33, Laravel 13.26.1

---

## 4. Runtime Topology

```
Host :8093 → nginx → PHP-FPM app → MySQL (diyar_production_local)
                              ↘ Redis (OTP, sessions, cache, queues)
                              ↘ Reverb ×2 (WebSocket via nginx /app/)
```

MySQL and Redis are internal-only (not host-published).

---

## 5. Configuration

See `configuration.md`.

| Gate | Result |
|------|--------|
| APP_DEBUG=false | PASS |
| DIYAR_OTP_TEST_MODE=false | PASS |
| Test OTP 123456 rejected at runtime | PASS |
| OTP provider | log (local); **SMS not exercised** |

---

## 6. OTP Architecture

Single `OtpService` for all SMS OTP flows. OTP stored as bcrypt hash in Redis; plaintext never persisted. Log provider exposes OTP to stderr **only** in local/testing without MSEGAT — disabled when `APP_ENV=production`.

---

## 7. 2FA Architecture

```
Login → password OK → logout → challenge (Redis) + OTP (Redis)
     → 422 two_factor_required
POST /auth/verify-two-factor → locked OTP verify + challenge consume → session
```

Enrollment/disable via `/profile/security/two-factor/*`.

---

## 8. Authentication State Machine

| State | /auth/me | Protected APIs |
|-------|----------|----------------|
| Unauthenticated | 401 | 401 |
| Pending 2FA (password OK) | 401 | 401 |
| Fully authenticated | 200 | 200 |

Verified at Docker runtime.

---

## 9. Security Controls

| Control | Status | Evidence |
|---------|--------|----------|
| 2FA enforcement | PASS | docker-runtime-results.json |
| Test OTP isolation | PASS | docker-runtime-results.json |
| Replay protection | PASS | docker-runtime-results.json |
| Stale challenge | PASS | docker-runtime-results.json |
| Challenge consume lock | PASS | parallel race |
| Brute-force limits | PASS | PHPUnit |
| Pending-2FA isolation | PASS | docker-runtime-results.json |

---

## 10. Race / Replay Results

**Parallel verification (Docker, Redis, PHP-FPM):**

- Concurrency: 8
- Successes: **1**
- Failures: 7 (422)
- p50: 299ms, p95: 537ms

Evidence: `docker-runtime-results.json`, `2fa-parallel-race.php`

---

## 11. Provider Results

| Provider | Result |
|----------|--------|
| Log (local docker) | Used for cert OTP delivery |
| MSEGAT SMS | **NOT VERIFIED** (credentials not configured) |
| Provider failure fail-closed | PASS (PHPUnit mock) |

---

## 12. Redis Results

- Connectivity: PASS (PING, SETEX, TTL, DEL)
- OTP/challenge keys use Redis cache store with locks
- Rate limits shared via Redis

---

## 13. Database / Migration

Migration `2026_09_11_100000_add_two_factor_to_users_table` applied on Docker MySQL. Additive columns only. See `migration.md`.

---

## 14. Multi-Node Results

**NOT VERIFIED.** Single FPM replica in production compose. Shared Redis design supports horizontal scale; explicit cross-node test deferred. See `multi-node.md`.

---

## 15. Performance

Parallel verify p95 ~537ms through nginx (includes session + Redis). Formal load test (1–100 concurrency) not executed. See `performance.json`.

---

## 16. Load Test

**NOT VERIFIED** this cycle.

---

## 17. Failure Matrix

See `failure-matrix.md`. No authentication bypass in executed scenarios.

---

## 18. Restart / Recovery

**NOT VERIFIED.** See `restart-tests.md`.

---

## 19. Frontend

- SecurityPage unit tests: 9 passed
- Auth error handling: 10 passed
- TypeScript: PASS
- 2FA UI integrated (AuthPage, SecurityPage, OtpCodeField)

---

## 20. Playwright

**NOT VERIFIED.** Spec exists at `frontend/e2e/two-factor.spec.ts`. See `e2e-results.md`.

---

## 21. Regression

See `test-results.md`:

- PHPUnit (2FA/auth subset): 57 passed
- Vitest: 19 passed
- Docker runtime harness: PASS

---

## 22. RTL / LTR

SecurityPage and auth i18n strings present in `ar.ts` / `en.ts`. Playwright RTL scenarios not executed.

---

## 23. Accessibility

OtpCodeField uses labeled inputs; full a11y audit not in scope.

---

## 24. Observability

- OTP plaintext not logged at `LOG_LEVEL=warning` (production default)
- Local cert used `LOG_LEVEL=info` for harness OTP extraction only
- `otp.sent` / `otp.verify.success` metadata logged without secrets

---

## 25. Deployment Readiness

| Item | Status |
|------|--------|
| Migration | Ready (applied on cert DB) |
| Docker image | Rebuild required after backend deploy |
| Redis | Required |
| SMS (MSEGAT) | Required for production OTP |
| Env: DIYAR_OTP_TEST_MODE=false | Required |
| Env: APP_ENV=production | Required on real prod |
| Healthcheck | nginx `/api/v1/health/live` healthy |

### Handoff commands

```powershell
# Rebuild & deploy API
.\scripts\local\rebuild-production-api.ps1

# Migrate (production)
docker compose -f docker-compose.production.yml --env-file deploy/docker/production.env exec app php artisan migrate --force

# Re-run runtime cert
.\scripts\certification\run-2fa-docker-cert.ps1
```

### Rollback

- Revert image to previous tag; migration rollback drops 2FA columns (backup first)

---

## 26. Remaining Risks

1. **SMS provider** not validated on this host — configure MSEGAT before production cutover
2. **APP_ENV=production** gate not exercised on local docker (`APP_ENV=local`)
3. **Playwright E2E** not run against :8093
4. **Multi-node** race not explicitly tested
5. Queue/scheduler containers unhealthy (pre-existing ops issue)

---

## 27. Certification Matrix

| Gate | Result | Evidence |
|------|--------|----------|
| Source audit | PASS | codebase review |
| Docker runtime | PASS | docker-runtime.md |
| Production config | PARTIAL | APP_ENV=local |
| Test OTP isolation | PASS | docker-runtime-results.json |
| OTP correctness | PASS | docker-runtime-results.json |
| Registration OTP | PASS | PHPUnit |
| Password recovery | PASS | PHPUnit |
| 2FA enrollment | PASS | PHPUnit |
| 2FA login | PASS | docker-runtime-results.json |
| 2FA enforcement | PASS | docker-runtime-results.json |
| Challenge binding | PASS | PHPUnit |
| Stale challenge | PASS | docker-runtime-results.json |
| Replay protection | PASS | docker-runtime-results.json |
| Race protection | PASS | parallel_race |
| Brute-force protection | PASS | PHPUnit |
| Resend protection | PASS | PHPUnit |
| Session security | PASS | runtime + PHPUnit |
| SMS provider | NOT VERIFIED | log provider only |
| Provider failure | PASS | PHPUnit |
| Redis | PASS | runtime |
| Database | PASS | migration.md |
| Migration | PASS | migration.md |
| Multi-node | NOT VERIFIED | multi-node.md |
| Octane/FPM | PASS | FPM confirmed |
| Performance | PARTIAL | parallel latencies only |
| Load | NOT VERIFIED | — |
| Resource isolation | NOT VERIFIED | — |
| Playwright | NOT VERIFIED | e2e-results.md |
| PHPUnit | PASS | 57 tests |
| Vitest | PASS | 19 tests |
| TypeScript | PASS | typecheck |
| RTL/LTR | PARTIAL | i18n only |
| Accessibility | PARTIAL | — |
| Observability | PASS | no OTP in warning logs |
| Restart recovery | NOT VERIFIED | restart-tests.md |
| Cleanup | PASS | Redis TTL on OTP/challenge |
| Documentation | PASS | this report |

---

## 28. Final Verdict

# CERTIFIED WITH LIMITATIONS

All **mandatory application security gates** pass on the **actual diyar-production Docker runtime**, including the **hard test-OTP gate**, **pending-2FA isolation**, and **parallel verification race**.

Full **CERTIFIED** is withheld until:

1. `APP_ENV=production` + MSEGAT SMS provider validation on target hardware
2. Playwright E2E against `:8093`
3. Multi-node verification (optional `docker-compose.multinode.yml`)

No known authentication bypass. The 404 on `/profile/security/two-factor` reported earlier was caused by a **stale Docker image** — resolved by rebuild documented in this cycle.

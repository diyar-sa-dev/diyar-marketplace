# Docker Runtime Validation — 2FA

**Script:** `scripts/certification/run-2fa-docker-cert.ps1`  
**Evidence:** `docker-runtime-results.json`  
**Verdict:** All mandatory HTTP security gates **PASS**

## Gates (2026-09-11)

| Gate | Result |
|------|--------|
| docker_runtime_health | PASS |
| production_config_safety | PASS |
| migration_two_factor_columns | PASS |
| test_otp_isolation (123456 rejected) | PASS |
| password_only_bypass | PASS |
| pending_2fa_api_isolation | PASS |
| otp_login_flow | PASS |
| otp_replay | PASS |
| stale_challenge | PASS |
| parallel_otp_verification (8 concurrent) | PASS (1 success, 7 failures) |
| two_factor_api_route | PASS (HTTP 200) |

## Parallel race evidence

```json
{
  "concurrency": 8,
  "successes": 1,
  "failures": 7,
  "p50_ms": 298.78,
  "p95_ms": 537.29
}
```

Script: `backend/scripts/certification/2fa-parallel-race.php` (curl_multi + CSRF bootstrap against `http://nginx/api/v1`).

## Configuration observed in container

| Setting | Value |
|---------|-------|
| APP_ENV | local |
| APP_DEBUG | false |
| DIYAR_OTP_TEST_MODE | false |
| OTP provider | log (no MSEGAT credentials) |
| Cache | redis |
| Session | redis |
| DB host | mysql |
| Redis host | redis |

## Limitations

- `APP_ENV=local` (local docker cert stack, not `production`)
- OTP provider is **log**, not SMS — real MSEGAT production gate not exercised on this host
- Queue/scheduler containers report unhealthy (pre-existing; not 2FA-specific)

# Regression Test Results

**Date:** 2026-09-11

## Backend (host PHPUnit)

| Suite | Result |
|-------|--------|
| TwoFactor + Otp + Authentication + PasswordRecovery filter | **57 passed**, 205 assertions, ~6.3s |

## Frontend

| Suite | Result |
|-------|--------|
| Vitest SecurityPage + errors | **19 passed**, ~2.8s |
| TypeScript typecheck | **PASS** |

## Docker runtime harness

| Script | Result |
|--------|--------|
| `scripts/certification/run-2fa-docker-cert.ps1` | **PASS** (all mandatory gates) |
| `backend/scripts/certification/2fa-parallel-race.php` | **PASS** (1/8 successes) |

## Not run

- Full project PHPUnit suite
- Playwright E2E (`e2e/two-factor.spec.ts`)
- Load test concurrency 1/10/25/50/100

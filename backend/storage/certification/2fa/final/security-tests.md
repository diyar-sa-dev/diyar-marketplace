# Security Tests — Docker Runtime

Executed against **diyar-production** at http://127.0.0.1:8093 via `run-2fa-docker-cert.ps1`.

## Hard gates

| Test | Expected | Result |
|------|----------|--------|
| Test OTP `123456` with `DIYAR_OTP_TEST_MODE=false` | Reject (422) | **PASS** |
| Password-only login with 2FA enabled | No session (401 /me) | **PASS** |
| Pending 2FA → profile/two-factor | 401 | **PASS** |
| OTP replay after success | 422 | **PASS** |
| Stale challenge after re-login | 422 | **PASS** |
| Parallel verify (8× same OTP) | Exactly 1× 200 | **PASS** |
| Authenticated GET /profile/security/two-factor | 200 | **PASS** |

## Application-layer tests (host PHPUnit, SQLite)

- `TwoFactorAuthenticationTest` + related auth/OTP: **57 passed**, 205 assertions

## Not verified in Docker HTTP harness

- SMS provider failure simulation (requires MSEGAT or mock at runtime)
- Multi-node cross-container challenge/verify
- Redis/DB chaos (restart gates)

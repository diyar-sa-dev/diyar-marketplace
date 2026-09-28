# Failure Matrix — 2FA Docker Certification

| Failure | Expected | Docker result | Evidence |
|---------|----------|---------------|----------|
| Test OTP in production config | Reject | **PASS** | docker-runtime-results.json |
| Password-only bypass | No auth | **PASS** | docker-runtime-results.json |
| Pending 2FA → protected API | 401 | **PASS** | docker-runtime-results.json |
| Invalid OTP | 422 | **PASS** (PHPUnit + runtime) | security-tests.md |
| OTP replay | 422 | **PASS** | docker-runtime-results.json |
| Stale challenge | 422 | **PASS** | docker-runtime-results.json |
| Concurrent verification | Max 1 success | **PASS** | parallel_race in docker-runtime-results.json |
| Redis unavailable | Secure failure | **NOT VERIFIED** | — |
| DB unavailable | Secure failure | **NOT VERIFIED** | — |
| SMS unavailable | 2FA required, no auth | **NOT VERIFIED** (log provider) | — |
| SMS timeout | 2FA required | **NOT VERIFIED** | — |
| Challenge tampering | Reject | **PASS** (PHPUnit binding tests) | test-results.md |
| Resend flood | Rate limited | **PASS** (PHPUnit) | test-results.md |
| Login flood | Rate limited | **PARTIAL** (throttle middleware present) | — |

No authentication bypass observed in executed gates.

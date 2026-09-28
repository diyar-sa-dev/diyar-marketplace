# Restart / Recovery Tests

**Status:** NOT VERIFIED (this cycle)

## Planned checks (not executed)

- `docker restart diyar-production-app-1` → login + 2FA still works
- Redis restart → new challenges work; stale OTP state does not bypass 2FA
- Backend restart → pending challenges in Redis remain valid until TTL

## Operational note

2FA state is Redis-backed (OTP cache, challenge store, rate limits). Restart of app containers is safe; Redis restart clears in-flight challenges (users must re-login — fail-closed).

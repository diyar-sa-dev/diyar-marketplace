# MSEGAT — SMS / OTP Provider

> **Status:** SELECTED — integration **DEFERRED**  
> **Region:** Saudi Arabia  
> **Target stage:** Stage 2 — Identity & Authentication

---

## Provider

**MSEGAT / مسجات**

Official OTP product: https://sms.msegat.com/otp-en/

---

## Integration Status

| Item | Status |
|------|--------|
| Provider selected | **Yes** |
| API credentials in repo | **No** (must never be committed) |
| `MsegatSmsProvider` implementation | **NOT YET IMPLEMENTED** |
| OTP send/verify endpoints | **NOT YET IMPLEMENTED** |

---

## Confirmed Capabilities (Provider Documentation)

- SMS messaging
- OTP verification
- API integration
- API keys and sender IDs
- Delivery reports
- Saudi/local and international messaging

---

## DIYAR Architecture (Required)

```text
Identity / OtpService
    ↓
SmsProvider (internal interface)
    ↓
MsegatSmsProvider
    ↓
MSEGAT API
```

**Rule:** Registration, login, and OTP business logic must depend on `SmsProvider`, not MSEGAT SDK calls directly.

---

## Stage 2 Scope (Planned)

- Send OTP during registration / recovery
- Verify OTP codes with throttling
- Store OTP attempts securely (hashed, TTL, rate limits)
- Log delivery failures; no credentials in logs

---

## Environment Variables (Future — Local Only)

Document in runbooks when implemented. Examples (names TBD at implementation):

```text
MSEGAT_API_KEY=         # local .env only — never commit
MSEGAT_SENDER_ID=       # local .env only
```

Use a **private** Postman environment for secrets. See [POSTMAN.md](../POSTMAN.md).

---

## Related

- [AUTHENTICATION.md](../AUTHENTICATION.md)
- [`../../adr/ADR-006-external-providers.md`](../../adr/ADR-006-external-providers.md)

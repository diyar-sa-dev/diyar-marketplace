# MSEGAT — SMS / OTP Provider

> **Status:** ADAPTER IMPLEMENTED (Stage 2)  
> **Region:** Saudi Arabia  
> **Integration:** Production-ready adapter; credentials required for live SMS

---

## Provider

**MSEGAT / مسجات**

Official documentation: https://msegat.docs.apiary.io/

OTP product reference: https://sms.msegat.com/otp-en/

---

## DIYAR Architecture

```text
OtpService (generates + verifies OTP via cache)
    ↓
SmsProvider (interface)
    ├── LogSmsProvider        ← development / CI
    └── MsegatSmsProvider     ← production
            ↓
        MSEGAT HTTPS JSON API
```

**Rule:** Controllers and Identity services depend on `SmsProvider`, never on MSEGAT directly.

---

## V1 Verification Model

DIYAR **generates** OTP codes, stores **hashed** values in Laravel Cache, and **verifies** locally.

MSEGAT is used for **SMS delivery** only in production (`MsegatSmsProvider::send()`).

MSEGAT also offers `sendOTPCode` / `verifyOTPCode` provider-side OTP APIs. These are documented for reference but are **not** used for V1 business verification to keep provider switching isolated.

---

## MsegatSmsProvider

| Setting | Env variable |
|---------|--------------|
| Username | `MSEGAT_USERNAME` |
| API key | `MSEGAT_API_KEY` |
| Sender ID | `MSEGAT_SENDER_ID` |
| Language | `MSEGAT_LANG` (`Ar` / `En`) |
| Base URL | `MSEGAT_BASE_URL` (default `https://www.msegat.com/gw`) |

Delivery endpoint: `POST /gw/sendsms.php` (JSON body)

Example JSON fields:

```json
{
  "userName": "...",
  "apiKey": "...",
  "userSender": "...",
  "numbers": "9665XXXXXXXX",
  "msg": "...",
  "msgEncoding": "UTF8",
  "lang": "Ar"
}
```

---

## LogSmsProvider (Development)

When MSEGAT credentials are absent, `AppServiceProvider` binds `LogSmsProvider`.

In `local` / `testing` environments only, `LogSmsProvider::exposeForDevelopment()` writes:

```text
OTP issued for development testing
{"phone":"966501234567","purpose":"registration","otp":"123456"}
```

**Never logged when:**
- `APP_ENV=production`
- MSEGAT credentials are present (even in local `.env`)

OTP verification remains in Laravel Cache (hashed). MSEGAT delivers SMS in production without exposing codes in logs.

---

## Security

- Never commit API keys or sender credentials
- Never log OTP values in production
- Use private Postman environments for manual testing

---

## Related

- [AUTHENTICATION.md](../AUTHENTICATION.md)
- [ADR-006-external-providers.md](../../adr/ADR-006-external-providers.md)
- [ADR-007-spa-session-authentication.md](../../adr/ADR-007-spa-session-authentication.md)

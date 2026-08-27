# API Assistant Audit — Phase 28.10

**Date:** 2026-08-27  
**Endpoint:** `POST /api/v1/assistant/chat`

---

## Product/security decision

**Classification:** `public-with-safe-controls`

The assistant is intentionally public (no `auth:sanctum`) to support anonymous catalog help. Security is enforced via:

| Control | Implementation |
|---------|----------------|
| Rate limiting | `throttle:assistant-chat` — 30/min/IP (configurable) |
| Input limits | 1–20 messages, 4000 chars each, 12000 catalog_context |
| Cost protection | 503 when disabled or API key missing |
| Timeout | 45s HTTP timeout to OpenAI |
| No DB exposure | Pure HTTP proxy — no user data persisted |
| Maintenance | Respects marketplace maintenance middleware |

**Not implemented:** Authentication (would break anonymous UX unless product requests it).

---

## Tests added (KI-028-037, KI-028-057)

`AssistantChatTest.php`:

- 503 when disabled
- 503 when API key missing
- 422 validation (messages required, content max)
- 200 with mocked OpenAI response

`RateLimitingTest::test_assistant_chat_is_rate_limited` — 429 after limit.

---

## KI-028-053 resolution

| Field | Value |
|-------|-------|
| Status | **VERIFIED** |
| Blocker | Cleared with documented public-with-controls model |
| Monitor | Rate limit + OpenAI billing alerts in production |

---

## Future triggers

- Require auth if abuse/cost exceeds threshold in production APM
- Queue AI calls if p95 latency >10s (28.11)

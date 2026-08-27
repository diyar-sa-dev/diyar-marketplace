# Phase 28.6 — Realtime Security

---

## Channel authorization (`routes/channels.php`)

| Channel | Rule |
|---------|------|
| `users.{userId}` | Authenticated + ID match via `hash_equals` |
| `conversations.{conversationId}` | `ChatAuthorizationService::canSubscribe` |

---

## PHPUnit

**ChatApiTest + ChatModerationTest: 25/25 PASS**

- Cross-vendor conversation access **403**
- Non-member subscription denied
- Message mutation authorization enforced

---

## NOT VERIFIED

| Scenario | Status |
|----------|--------|
| Live WebSocket subscribe attempt (Reverb) | **NOT VERIFIED** — infrastructure not exercised in 28.6 |
| Forged Pusher auth signature | **NOT VERIFIED** |
| Presence channel enumeration | N/A — private channels only |

---

## Gate

```text
PARTIAL
```

Authorization callbacks correct in source + API tests; live WS handshake **NOT VERIFIED**.

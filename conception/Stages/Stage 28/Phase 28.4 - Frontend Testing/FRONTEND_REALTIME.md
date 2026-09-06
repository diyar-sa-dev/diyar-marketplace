# Phase 28.4 — Realtime UI

---

## Stack

| Package | Purpose |
|---------|---------|
| `laravel-echo` | WebSocket client |
| `pusher-js` | Transport (Reverb-compatible) |

**Config:** Echo initialized from env (`VITE_REVERB_*` / Pusher keys).

---

## UI surfaces

| Feature | Page/component | E2E |
|---------|----------------|-----|
| Chat messages | `ChatPage`, dashboard messages | **messaging.spec.ts PASS** |
| Notifications | Notification bell/dropdown | messaging partial |
| Unread counts | Chat hooks | Source |

---

## Behaviors (source inspection)

| Behavior | Status |
|----------|--------|
| Optimistic message send | Chat components |
| Failed message state | i18n error keys present |
| Reconnect / polling fallback | Echo defaults — **NOT VERIFIED** disconnect sim |
| Logout while connected | **NOT VERIFIED** |
| Duplicate events | **NOT VERIFIED** |

---

## Gate

```text
PARTIAL
```

Chat E2E passes on dev stack. WebSocket failure/reconnect matrix **NOT VERIFIED**.

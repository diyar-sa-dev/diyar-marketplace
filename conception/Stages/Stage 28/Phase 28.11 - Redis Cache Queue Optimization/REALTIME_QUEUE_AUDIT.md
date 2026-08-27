# Realtime & Queue Audit

---

## Stack

| Component | Driver | Queue involvement |
|-----------|--------|-------------------|
| Laravel Broadcasting | Reverb | Events may queue broadcasts |
| Notifications in-app | DB + optional push | `DeliverNotificationChannelJob` |
| Chat messages | DB + Reverb | Sync persist; async notifications suppressed when active |
| Chat typing/presence | Redis cache TTL | Low-volume |

---

## Notification flow

```
Domain event
  → DispatchNotificationListener
  → NotificationDispatcher (dedupe key)
  → notification_deliveries rows
  → DeliverNotificationChannelJob (unique per delivery)
  → Channel handlers (in_app, email, push, sms)
```

**Storm mitigation:**
- Dedupe keys on dispatcher
- Aggregation window for review types (24h config)
- Circuit breaker per provider
- Chat presence suppresses redundant notifications when user active

---

## Broadcast flow

```
Admin broadcast create
  → ProcessNotificationBroadcastJob (chunked by lastUserId)
  → Re-dispatches self for next chunk
  → NotificationDispatcher per user
```

**Risk:** Large broadcasts create many delivery rows — acceptable with chunked job + low-priority queue.

---

## Chat polling fallback (frontend)

| Hook | Interval | Backend load |
|------|----------|--------------|
| `useChat` conversations | 120s | Moderate — mitigated by summary cache |
| Notifications reconcile | 120s visible / 300s hidden | Unread counter cache (300s TTL) |

**Assessment:** Polling intervals are conservative; realtime primary when Reverb connected.

---

## Redis pressure from realtime

- Unread counters: O(1) get/increment per user
- Presence/typing: Short TTL keys (5–120s)
- Not a primary memory growth vector vs analytics/chart payloads

**Verdict:** PASS with documented polling fallback load.

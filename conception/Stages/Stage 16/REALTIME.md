# Realtime Notifications (Reverb)

## Backend

1. **Persist** notification in `NotificationDispatcher::persistInAppNotification()`
2. **Broadcast** via `NotificationRealtimeBroadcaster::notificationCreated()`
3. Event: `UserNotificationCreated` (`ShouldBroadcastNow`)
4. Channel: `private-users.{userId}`
5. Event name: `notification.created`

Read-state sync: `UserNotificationReadStateChanged` → `notification.read_state`

## Configuration

`.env`:

```
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=
REVERB_APP_KEY=
REVERB_APP_SECRET=
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
DIYAR_NOTIFICATIONS_REALTIME=true
```

## Frontend (Echo)

Dependencies: `laravel-echo`, `pusher-js`

- Setup: `frontend/src/lib/realtime/echo.ts`
- Provider: `frontend/src/context/NotificationProvider.tsx`
- Auth: `/broadcasting/auth` (proxied via Vite in dev)
- Vite env: `VITE_REVERB_*`

## Connection lifecycle

| State | Behavior |
|-------|----------|
| connected | Subscribe to `private-users.{id}` |
| disconnected | Exponential backoff reconnect (max 30s) |
| reconnect | `GET unread-count` + invalidate notification queries |

## Polling fallback

Primary: WebSocket. Fallback: 120s reconciliation poll (`DIYAR_NOTIFICATIONS_RECONCILE_SECONDS`).

Dedupe: frontend uses `notification_id` — no duplicate bell entries when both paths fire.

## Security

- Private channels only — never public notification channels.
- Channel auth in `routes/channels.php` with `hash_equals`.
- Users cannot subscribe to another user's channel.

## Cross-tab sync

`BroadcastChannel('diyar-notifications')` propagates read-state changes across tabs.

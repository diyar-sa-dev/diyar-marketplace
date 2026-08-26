# Notification Architecture

## Flow

```text
Domain Event (OrderCreated, etc.)
        ↓
DispatchNotificationListener (afterCommit via event dispatch)
        ↓
NotificationDispatcher
        ↓
┌───────────────────┬────────────────────┐
│ In-app persist    │ Channel deliveries   │
│ user_notifications│ notification_deliveries
└─────────┬─────────┴──────────┬─────────┘
          ↓                      ↓
UserNotificationCreated    DeliverNotificationChannelJob
(Reverb)                   (email / push, afterCommit)
                                   ↓
                           NotificationCircuitBreaker
                                   ↓
                           Provider (SMTP / push)
```

## Domain model

### `user_notifications`

- Recipient notification record (in-app source of truth)
- `dedupe_key` unique per `(user_id, dedupe_key)` — idempotent creation
- `type` → `NotificationType` enum (strongly typed taxonomy)
- `priority` → routes to queue tier

### `notification_deliveries`

- One row per `(notification, channel)` via `dedupe_key`
- Tracks `attempts`, `last_error`, `delivered_at`
- Status: `pending`, `delivered`, `failed`, `skipped`

### Admin broadcasts

- `notification_broadcasts` campaign record
- `ProcessNotificationBroadcastJob` chunks users (200/batch)
- Dispatches `SystemAlert` with deterministic dedupe: `broadcast:{id}:{userId}`

## Preference resolution

```text
system policy (AuthOtp, PaymentFailed, SystemAlert override)
        ↓
user preference (category × channel matrix)
        ↓
channel availability (devices, email present)
```

## Idempotency keys

| Layer | Key pattern |
|-------|-------------|
| Notification | `{eventDedupe}:{userId}` |
| Delivery | `{eventDedupe}:{userId}:{channel}` |
| Broadcast | `broadcast:{campaignId}:{userId}` |

## Critical rule

**Business transactions never wait on notification delivery.** Jobs use `afterCommit()` so rollbacks never enqueue sends.

## API surfaces

| Audience | Endpoint |
|----------|----------|
| User | `/api/v1/profile/notifications` |
| User | `/api/v1/profile/notification-preferences` |
| Admin view | `/api/v1/admin/notifications` |
| Admin deliveries | `/api/v1/admin/notifications/deliveries` |
| Admin retry | `POST .../deliveries/{id}/retry` |
| Admin broadcast | `POST /api/v1/admin/notifications/broadcasts` |

## CLI

```bash
php artisan mail:test ops@example.com
php artisan diyar:notifications:test {userUuid}
```

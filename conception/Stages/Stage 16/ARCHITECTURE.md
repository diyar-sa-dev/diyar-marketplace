# Notification Architecture (Stage 16.5)

## Flow

```
Business Domain
    │ DB::afterCommit + event()
    ▼
DispatchNotificationListener (sync)
    ▼
NotificationDispatcher
    ├── persist in-app (user_notifications)
    ├── NotificationRealtimeBroadcaster → UserNotificationCreated → Reverb
    └── queue DeliverNotificationChannelJob (email / push)
            ├── notifications-high  (OTP, payment failed, system)
            ├── notifications       (default)
            └── notifications-low     (reserved for bulk/system)
```

## Key components

| Component | Role |
|-----------|------|
| `NotificationCategoryRegistry` | Source of truth for categories, roles, policies |
| `NotificationPreferenceService` | Category × channel matrix in `user.preferences.notifications.matrix` |
| `NotificationPreferenceResolver` | Channel gating at dispatch time |
| `NotificationRealtimeBroadcaster` | Isolated realtime delivery; failures never block persistence |
| `CompositePushProvider` | Routes to FCM (android/web), APNs (ios), or log driver |
| `NotificationCircuitBreaker` | Protects email/push/realtime providers |

## Design rules

1. **Database is authoritative** — WebSocket is an optimization.
2. **Domains stay unaware** of Reverb, FCM, queues, or email.
3. **Idempotency** via `dedupe_key` on notifications and deliveries.
4. **Required in-app** categories (`system`, `auth`) cannot disable in-app channel.

## Private channel

- Pattern: `private-users.{userId}`
- Authorization: `routes/channels.php` — `hash_equals` on authenticated user ID.

## Frontend

- `NotificationProvider` — single Echo connection, dedupe by `notification_id`, cross-tab via `BroadcastChannel`.
- Reconciliation poll: 120s fallback for unread count + list refresh.

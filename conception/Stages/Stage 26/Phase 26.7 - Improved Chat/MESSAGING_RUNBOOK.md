# Messaging Operations Runbook

## Daily / scheduled

| Command | Schedule | Purpose |
|---------|----------|---------|
| `notifications:broadcasts:dispatch-scheduled` | every minute | Fire due admin broadcasts |
| `notifications:reconcile-deliveries` | every 15 min | Unstick `processing` deliveries |
| `notifications:prune` | daily 04:00 | Retention (read notifications, old deliveries) |
| `notifications:reconcile-unread` | weekly Mon 03:30 | Fix Redis/DB unread mismatches |
| `chat:reconcile-unread` | weekly Mon 03:00 | Chat unread reconciliation |

## Manual operations

```bash
# Verify mail configuration (safe — sends one test message)
php artisan mail:test ops@example.com

# Reconcile one user's unread counter
php artisan notifications:reconcile-unread --user={uuid}

# Inspect stuck deliveries (default 30 min threshold)
php artisan notifications:reconcile-deliveries --minutes=30
```

## Queue workers (development)

`composer dev` runs workers including `broadcast` queue with `tries=5`.

Production: run separate supervisors per priority queue. Horizon optional — see `QUEUE_ARCHITECTURE.md`.

## Alerts (recommended — not auto-configured)

- Queue depth > threshold for `notifications-high`
- Circuit breaker OPEN for `email` / `push` / `sms`
- Broadcast `failed_deliveries` spike
- Reconcile command reports mismatches > 0

## Rollback

- Migrations `260700`–`260900` are additive; rollback drops new columns/tables only
- Disable realtime: `DIYAR_NOTIFICATIONS_REALTIME=false`
- Disable SMS: `DIYAR_NOTIFICATIONS_SMS_ENABLED=false`

## Logs (structured)

Search for: `notifications.realtime.*`, delivery `correlation_id`, circuit breaker state changes.

Do **not** log OTP, tokens, or full private message bodies in production.

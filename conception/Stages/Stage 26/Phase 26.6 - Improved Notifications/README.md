# Phase 26.6 — Improved Notifications

Enterprise upgrade of the Stage 16 notification platform.

## Status

**PARTIAL** — core pipeline hardened; admin broadcast + delivery ops added; full SMS/Horizon/k6/E2E deferred.

## Documents

| File | Purpose |
|------|---------|
| [AUDIT.md](./AUDIT.md) | Initial audit vs enterprise spec |
| [NOTIFICATION_ARCHITECTURE.md](./NOTIFICATION_ARCHITECTURE.md) | Domain model, routing, delivery |
| [QUEUE_ARCHITECTURE.md](./QUEUE_ARCHITECTURE.md) | Queue separation and worker policy |
| [MAIL_CONFIGURATION.md](./MAIL_CONFIGURATION.md) | Mail provider setup and verification |
| [MESSAGING_SECURITY_AUDIT.md](./MESSAGING_SECURITY_AUDIT.md) | IDOR, channel auth, privacy |
| [MESSAGING_PERFORMANCE_AUDIT.md](./MESSAGING_PERFORMANCE_AUDIT.md) | Query and latency notes |
| [ACCEPTANCE_MATRIX.md](./ACCEPTANCE_MATRIX.md) | Gate checklist |
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Final verdict |

## What shipped in this pass

- `->afterCommit()` on `DeliverNotificationChannelJob` dispatch
- `php artisan mail:test {recipient}` CLI
- Admin broadcast campaigns (chunked queue fan-out)
- Admin delivery list/show/retry endpoints
- `notifications.manage` admin permission
- Custom title/body support in `NotificationRenderer` for broadcasts

## What remains

- SMS notification channel (SMS exists for OTP only)
- Delivery status enum expansion (`queued`, `sending`, `sent`, `cancelled`)
- Provider failover + reconcile worker
- Horizon / queue depth metrics
- Playwright notification E2E
- k6 load profiles

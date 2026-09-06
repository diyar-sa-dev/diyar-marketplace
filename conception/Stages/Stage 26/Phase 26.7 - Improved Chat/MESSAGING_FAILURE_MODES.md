# Messaging Failure Modes

## Design principle

Business transactions **commit successfully** even when acceleration layers fail.

## Failure matrix

| Failure | User impact | System behavior | Recovery |
|---------|-------------|-----------------|----------|
| Redis down | Unread badge may rebuild slower; no typing/presence | DB queries for lists; offline presence | Redis restore; run `notifications:reconcile-unread`, `chat:reconcile-unread` |
| Reverb down | No live updates | REST polling / manual refresh | Reconnect + cursor reconciliation |
| Queue down | No email/push/SMS until workers resume | In-app notifications still persisted | Restart workers; `notifications:reconcile-deliveries` |
| Mail provider 5xx | Email delayed | Job retries + circuit breaker OPEN | Auto retry with backoff; ops alert |
| Mail invalid recipient | Email fails permanently | `failed` delivery, no retry | Admin delivery retry N/A |
| Push invalid token | Device deactivated | `NotificationDeviceService::deactivateByIds` | User re-registers device |
| SMS not configured | SMS suppressed | `suppressed` or channel skipped | Enable `DIYAR_NOTIFICATIONS_SMS_ENABLED` + provider |
| Worker crash mid-delivery | At-least-once retry | `processing` → reconciled to `retrying` | `notifications:reconcile-deliveries` |
| Duplicate job | Possible duplicate external send | DB dedupe + claimForProcessing | Monitor delivery dedupe_key collisions |
| Broadcast storm | Slow non-critical delivery | Separate `broadcast` queue | Rate limit admin broadcasts (partial — chunking only) |

## Delivery semantics

- **In-app:** effectively once (DB unique dedupe)
- **External channels:** at-least-once with dedupe keys; provider may still dedupe on their side
- **Realtime:** best-effort; client must dedupe by notification/message id

## Failure injection (NOT VERIFIED locally)

Planned scenarios: Redis unavailable, provider timeout, worker kill, Reverb disconnect. Requires dedicated test harness or staging environment.

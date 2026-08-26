# Notification Delivery State Machine

## States

| State | Meaning |
|-------|---------|
| `pending` | Record created, not yet queued |
| `queued` | Job dispatched to queue |
| `processing` | Worker claimed delivery (atomic update) |
| `delivered` | Provider/channel confirmed delivery |
| `retrying` | Transient failure; awaiting Laravel queue retry |
| `failed` | Terminal failure or max attempts exceeded |
| `suppressed` | Blocked by user preference / policy (audited) |
| `skipped` | Chat presence/read suppression |
| `cancelled` | Administratively cancelled (future) |

## Transitions

```text
pending → queued → processing → delivered
                              → skipped | suppressed
                              → retrying → processing (retry)
                              → failed (terminal)
failed → queued (admin retry)
```

## Implementation

- `NotificationDeliveryStateMachine` — validates transitions
- `DeliverNotificationChannelJob` — atomic `claimForProcessing()` prevents double-processing
- `NotificationFailureCategory` — classifies retryable vs permanent failures
- Delivery rows track: `correlation_id`, `provider`, `failure_category`, `last_attempt_at`, `next_retry_at`, `failed_at`

## Reconciliation

Scheduled command: `notifications:reconcile-deliveries`

- Resets deliveries stuck in `processing` > 30 minutes to `retrying`
- Marks `retrying` with expired `next_retry_at` as `failed`

## Idempotency

Unique `dedupe_key` per notification+channel. Job exits early when status is terminal.

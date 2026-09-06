# Failure Recovery — Messaging Platform

## Notification delivery failures

| Symptom | Recovery |
|---------|----------|
| Transient provider error | Automatic retry with backoff `[30,60,120,300,600]s` |
| Max attempts exceeded | Status `failed`; admin retry via API |
| Stuck `processing` | `notifications:reconcile-deliveries` |
| Circuit open | Wait cooldown → half-open probe → closed on success |
| Preference suppressed | Status `suppressed`; no retry (by design) |

## Admin operations

- `GET /api/v1/admin/notifications/deliveries?status=failed`
- `POST /api/v1/admin/notifications/deliveries/{id}/retry`

## Broadcast failures

- Campaign status `failed` with `last_error`
- Re-dispatch via new campaign (idempotent dedupe prevents duplicates)

## Chat failures

- Message send failure: client optimistic state `failed` + retry with same `idempotency_key`
- WebSocket down: REST persistence unaffected; reconnect + cursor reconcile
- Redis down: DB authoritative; typing/presence degraded

## Queue worker recovery

Restart workers safely — jobs are idempotent via delivery claim + dedupe keys.

Dev worker queues: `critical,notifications-high,notifications,notifications-low,broadcast,chat-low,default`

## Retention

`notifications:prune` (daily) — configurable read/delivery retention via `diyar.notifications.retention.*`

## Infrastructure dependencies

Mark as **INFRASTRUCTURE REQUIRED** when not locally verified:

- Production SMTP/API mail credentials
- Redis for circuit breaker + chat ephemeral state
- Dedicated queue workers per tier
- Reverb process for realtime acceleration
- SPF/DKIM/DMARC DNS records

Business transactions (orders, payments, chat persist) **never depend** on these recovering.

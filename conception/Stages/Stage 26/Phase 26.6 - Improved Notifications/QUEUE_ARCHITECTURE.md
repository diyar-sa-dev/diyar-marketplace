# Queue Architecture — Messaging

## Queues

| Queue | Workload | Priority |
|-------|----------|----------|
| `critical` | Payment/security side effects | Highest |
| `notifications-high` | Auth, payment failed, system alert | High |
| `notifications` | Orders, bookings, chat | Normal |
| `notifications-low` | Marketing, promotions | Low |
| `mail` | Email channel (via job routing) | Normal |
| `broadcast` | Admin campaign chunk processing | Bulk |
| `chat` | Chat async side effects | High |

Routing: `NotificationQueue::forPriority()` maps notification priority to queue name.

## Job configuration

`DeliverNotificationChannelJob`:

- `tries`: 5 (configurable via `diyar.notifications.worker.tries`)
- `backoff`: [30, 60, 120, 300, 600]
- `timeout`: 120s
- Permanent failures: invalid email, missing push tokens, misconfiguration

`ProcessNotificationBroadcastJob`:

- Chunks 200 users per execution
- Self-chains via cursor (`afterUserId`)
- `broadcast` queue, 300s timeout

## afterCommit

All notification delivery and broadcast jobs dispatch with `->afterCommit()` to prevent sends for rolled-back transactions.

## Backpressure

Separate queues prevent bulk broadcast from starving order/payment notifications. Run dedicated workers per queue in production:

```bash
php artisan queue:work redis --queue=critical,notifications-high,notifications,notifications-low,broadcast
```

## Failed jobs

- Laravel `failed_jobs` table
- Admin can retry individual deliveries via API
- Provider credentials never exposed in admin responses

## Observability (deferred)

- Laravel Horizon recommended when Redis + supervisor available
- Until then: monitor `failed_jobs`, delivery `status=failed`, queue depth via Redis `LLEN`

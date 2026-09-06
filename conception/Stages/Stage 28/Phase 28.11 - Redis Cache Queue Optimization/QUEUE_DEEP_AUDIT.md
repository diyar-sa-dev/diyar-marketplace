# Queue Deep Audit — Second Pass

---

## Jobs (unchanged inventory, re-verified)

All 5 jobs pass IDs/primitives — no full model graphs serialized.

| Job | Payload | Unique | Idempotent |
|-----|---------|--------|------------|
| `ProcessPaymentWebhookJob` | `webhookEventId` string | Yes (pass 1) | DB status gates |
| `DeliverNotificationChannelJob` | `deliveryId` string | Yes | State machine |
| `ProcessNotificationBroadcastJob` | `broadcastId`, cursor | No | Chunked cursor |
| `RecordAdminAuditLogJob` | array payload | No | Append-only |
| `ArchiveOldMessagesJob` | optional limit int | No | Batch archive |

---

## Event → job duplication check

| Flow | Duplicate risk | Mitigation |
|------|----------------|------------|
| Payment webhook | Medium | `ShouldBeUnique` + processed status |
| Notification delivery | Medium | Unique per delivery ID |
| Order create → analytics | Low | Events afterCommit; analytics cache version |
| Broadcast → N deliveries | By design | Chunked job + per-user deliveries |

---

## Notification storm

- `ProcessNotificationBroadcastJob` self-chunks with `afterUserId` cursor
- Configurable queues: critical / notifications-high / normal / low
- Circuit breaker on failing providers

**Throughput benchmark:** NOT VERIFIED (OPT-QUEUE-001 deferred)

---

## Queue config note

`config/queue.php` redis connection `after_commit => false` at driver level — individual dispatches use `->afterCommit()` where needed (notifications, audit).

---

## Verdict

**Queue: PASS** (reliability) / **PARTIAL** (throughput measurement)

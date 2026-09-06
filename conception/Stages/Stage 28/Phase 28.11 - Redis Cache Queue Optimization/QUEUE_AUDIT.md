# Queue Audit

**Jobs inventory:** 5 `ShouldQueue` classes (see `_raw/redis_cache_inventory.json`)

---

## Job matrix

| Job | Queue | Unique | Tries | Backoff | Timeout | Idempotency | Purpose |
|-----|-------|--------|-------|---------|---------|-------------|---------|
| `DeliverNotificationChannelJob` | notifications* | **Yes** (deliveryId) | 5 | 30–600s | 120s | Delivery state machine | Channel delivery |
| `ProcessNotificationBroadcastJob` | notifications | No | 3 | 30–300s | — | Broadcast progress cursor | Bulk notify |
| `ProcessPaymentWebhookJob` | default/critical | **Yes** (28.11) | 5 | 10–300s | — | DB status + paid check | Payment webhook |
| `RecordAdminAuditLogJob` | default | No | — | — | — | Append-only log | Async audit |
| `ArchiveOldMessagesJob` | chat-low | No | 3 | 60–900s | — | Batch archive | Chat retention |

---

## Dispatch sources

| Source | Job | Notes |
|--------|-----|-------|
| `PaymentWebhookProcessor` | `ProcessPaymentWebhookJob` | Async when `DIYAR_PAYMENT_WEBHOOK_ASYNC=true` |
| `NotificationDispatcher` | `DeliverNotificationChannelJob` | Per delivery row |
| `NotificationBroadcastService` | `ProcessNotificationBroadcastJob` | Chunks users |
| `AdminAuditService` | `RecordAdminAuditLogJob` | `afterCommit()` |
| `RunChatArchiveCommand` | `ArchiveOldMessagesJob` | Scheduled/manual |

---

## Queue configuration (`config/diyar.php`)

| Queue name | Use |
|------------|-----|
| `critical` | Payment-critical paths |
| `notifications-high` | Time-sensitive notifications |
| `notifications` | Default notifications |
| `notifications-low` | Low priority |
| `chat` / `chat-low` | Realtime + archive |

**Assessment:** Priority split is justified for notification isolation. No further split required at current scale.

---

## Sync vs async

| Operation | Mode | Correct? |
|-----------|------|----------|
| OTP send | Sync (cache + SMS) | Yes — user waits |
| Checkout order create | Sync + DB transaction | Yes |
| Payment webhook | Async (configurable) | Yes |
| In-app notification insert | Queued delivery | Yes |
| Admin audit | Queued | Yes — non-blocking |

---

## Gaps

| ID | Issue | Priority |
|----|-------|----------|
| OPT-QUEUE-001 | Worker jobs/min not measured on staging | P3 |
| OPT-QUEUE-003 | `RecordAdminAuditLogJob` no explicit `$tries` | P4 |
| OPT-QUEUE-004 | Horizon not used — Supervisor manual | P4 (ops) |

# QA Assessment — Stage 17.5

**Reviewer conclusion:** Strong implementation — **keep it**, do not rebuild.

**Certification:** Production-grade **foundation** — not yet high-scale production **validated**.

## Assessment matrix

| Area | Status | Notes |
|------|--------|-------|
| Stage 16/16.5 reuse | ✅ | Single realtime/queue/Redis stack |
| Realtime + reconnect | ✅ | Reverb + reconciliation |
| Message delivery | ✅ | afterCommit + dedupe + idempotency constraint |
| Optimistic UX | ✅ | pending/sent/failed/retry |
| Pagination | ✅ | Cursor + load older + scroll preserve |
| Attachments | ✅ | Authorized download endpoint |
| Typing | ✅ | Client debounce + server throttle + Redis TTL |
| Archive | 🟢 | Verified batch lifecycle; staging validation pending |
| Security | 🟢 | Baseline solid; malware scan deferred |
| Scalability | 🟢 | Horizontally compatible architecture |
| Observability | 🟡 | Structured events added; dashboards pending |
| Read/unread/delivery | 🟡 | V1 semantics; scale testing pending |
| Presence | 🟡 | Not in V1 scope |
| Load testing | 🟡 | Required before high-scale certification |

## What we kept (correct architecture)

Chat is a **consumer** of platform infrastructure — not a second mini-platform:

```text
Stage 16/16.5 (Redis, Queue, Reverb)
              │
         Stage 17 Chat
              │
   Conversations / Messages / Attachments
```

## Enhancements applied from QA feedback

### Archive verification
Batch table `chat_archive_batches` with lifecycle:

```text
archiving → uploaded → verified → safe_to_purge
```

- SHA-256 checksum + line count verification
- `CHAT_PURGE_AFTER_ARCHIVE=false` by default
- Purge only when batch status is `safe_to_purge` (unless explicitly overridden)

### Conversation lifecycle
`lifecycle_status`: `active`, `inactive`, `archivable`, `archived`, `closed`, `blocked`

Blocked/archived/closed conversations are excluded from message archival.

### Redis locks
`ChatLockService` coordinates:
- Archive job (`lock:archive-job`)
- Unread reconciliation (`lock:reconcile-unread`)

DB transactions remain source of correctness; Redis locks coordinate workers.

### Delivery semantics (V1)
- **Sent** — message persisted (`POST /messages` success)
- **Delivered** — participant fetched thread (`last_delivered_at`)
- **Read** — participant marked read (`last_read_at`)

No WhatsApp-style per-message receipts yet.

### Observability
Structured events via `ChatMetrics`:
- `chat.message.created` (+ `persistence_ms`)
- `chat.broadcast.sent` (+ `broadcast_ms`)
- `chat.archive.*`
- `chat.unread.reconciled`

## Explicitly not added (by design)

- Elasticsearch / Kafka / separate chat microservice
- End-to-end encryption
- Complex message search
- Malware scanning (architecture leaves room; not blocking V1)

## Remaining before high-scale certification

See [LOAD_TESTING.md](./LOAD_TESTING.md) and [OBSERVABILITY.md](./OBSERVABILITY.md).

# Stage 17.5 Completion Report

**Status:** COMPLETE — Production-grade foundation  
**High-scale certification:** Pending load + archive staging validation  
**Date:** 2026-08-20

## Certification labels

| Label | Status |
|-------|--------|
| Production-grade foundation | ✅ |
| High-scale production validated | ⏳ Pending load tests |

See [QA_ASSESSMENT.md](./QA_ASSESSMENT.md) for reviewer matrix.

---

## Stage 17 (domain + realtime) — unchanged scope
- Conversation/message domain
- Reverb + Echo on Stage 16 stack
- Notification integration
- React chat UI

## Stage 17.5 (hardening) — delivered

### Architecture
- [x] No second chat infrastructure
- [x] Event listeners for broadcast + cache
- [x] QA audit documented

### UX & reliability
- [x] Cursor pagination + load older + scroll preservation
- [x] Optimistic send + idempotency (`conversation_id + idempotency_key` unique)
- [x] Reconnect reconciliation + cross-tab sync
- [x] Typing debounce (client + server)
- [x] Attachment authorized download

### Archive & lifecycle
- [x] `chat_archive_batches` with verifying lifecycle
- [x] SHA-256 checksum + line count verification
- [x] `CHAT_PURGE_AFTER_ARCHIVE=false` default
- [x] Purge requires `safe_to_purge` status
- [x] Conversation `lifecycle_status`
- [x] Business-critical retention protection

### Redis & coordination
- [x] Cache prefixes + targeted invalidation
- [x] `ChatLockService` for archive + unread reconciliation
- [x] `chat:reconcile-unread` command

### Delivery semantics (V1)
- [x] Sent / delivered / read via participant timestamps

### Observability
- [x] Structured `ChatMetrics` events + latency fields
- [ ] Dashboards/alerts (ops follow-up)

### Tests
- [x] `ChatApiTest` (9 tests)
- [x] `ChatArchiveTest` (3 tests — incl. verification + purge gate)
- [x] Frontend typecheck

---

## Ops toolbox

```bash
php artisan chat:archive --sync --force          # staging drill
php artisan chat:archive-status
php artisan chat:archive-verify {batchId}
php artisan chat:archive-mark-safe {batchId} --operator=ops --force
php artisan chat:reconcile-unread
```

Promotion rules:
- Only `verified` → `safe_to_purge`
- Records `promoted_by`, `promoted_via`, optional `--note`
- Production requires `--operator` and `--force`

## Remaining before high-scale certification

1. **Execute [STAGING_DRILL.md](./STAGING_DRILL.md)** — archive → verify → promote → recovery
2. **Execute [LOAD_TESTING.md](./LOAD_TESTING.md)** — document actual p50/p95/p99 results
3. Observability dashboards (ops follow-up)

---

## Verification

```bash
cd backend && php artisan migrate && php artisan test --filter=Chat
cd frontend && npm run typecheck
```

## Recommended env (production start)

```env
CHAT_ARCHIVE_ENABLED=false
CHAT_PURGE_AFTER_ARCHIVE=false
CHAT_PURGE_REQUIRES_SAFE_TO_PURGE=true
CHAT_AUTO_MARK_SAFE_TO_PURGE=false
```

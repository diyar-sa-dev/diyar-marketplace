# Staging Archive Drill

Final Stage 17.5 validation — **not a feature phase**. Run in staging only.

## Prerequisites

```env
CHAT_ARCHIVE_ENABLED=true
CHAT_ARCHIVE_AFTER_DAYS=1          # shorten for drill
CHAT_PURGE_AFTER_ARCHIVE=false     # keep false during drill
CHAT_PURGE_REQUIRES_SAFE_TO_PURGE=true
CHAT_AUTO_MARK_SAFE_TO_PURGE=false
QUEUE_CONNECTION=redis             # or database + worker running
```

Ensure `chat-low` queue worker is running:

```bash
php artisan queue:work --queue=chat-low,notifications-high,notifications,notifications-low,default
```

## Ops toolbox

| Command | Purpose |
|---------|---------|
| `php artisan chat:archive --sync --force` | Run archive synchronously (drill) |
| `php artisan chat:archive` | Dispatch `ArchiveOldMessagesJob` to `chat-low` |
| `php artisan chat:archive-status` | List recent batches |
| `php artisan chat:archive-status --batch={uuid}` | Verify single batch |
| `php artisan chat:archive-verify {batchId}` | Re-check checksum + line count |
| `php artisan chat:archive-mark-safe {batchId} --operator=you --force` | Promote verified → safe_to_purge |
| `php artisan chat:reconcile-unread` | Reconcile unread cache |

## Drill script

### 1. Create old test messages

Use two conversations:
- **Standard** — should archive
- **Business-critical** (`context_type=order`) — must NOT archive

Send messages, then backdate:

```sql
UPDATE messages SET created_at = DATE_SUB(NOW(), INTERVAL 10 DAY) WHERE ...;
```

Or use the feature test pattern (`ChatArchiveTest`).

### 2. Run archive

```bash
php artisan chat:archive --sync --force --limit=50
```

Expected batch lifecycle:

```text
archiving → uploaded → verified
```

Verify:

```bash
php artisan chat:archive-status
php artisan chat:archive-verify {batchId}
```

### 3. Manual promotion (production-safe gate)

```bash
php artisan chat:archive-mark-safe {batchId} --operator="staging-qa" --note="drill-$(date +%F)" --force
```

**Must refuse** if status is not `verified`:

```bash
# Should fail for uploading/archiving/failed batches
php artisan chat:archive-mark-safe {badBatchId} --operator=qa --force
```

### 4. Recovery check

1. Read file from `storage/app/chat-archives/{batchId}.jsonl`
2. Confirm line count = `message_count`
3. Confirm `sha256(file)` = batch `checksum`
4. Parse JSON lines — message IDs should match DB rows with `archive_batch_id`

```bash
php artisan chat:archive-verify {batchId}
```

### 5. Idempotency check

Run archive again:

```bash
php artisan chat:archive --sync --force
```

Expected: `archived=0` (no duplicate batches).

### 6. Lock check

In two terminals simultaneously:

```bash
php artisan chat:archive --sync --force
```

Second run should wait or skip via Redis lock (`chat.lock.timeout` in logs if contended).

### 7. Business-critical protection

Confirm order-context messages still have `archived_at IS NULL`.

### 8. Optional purge (staging only)

Only after recovery verified **and** batch is `safe_to_purge`:

```env
CHAT_PURGE_AFTER_ARCHIVE=true
```

Re-run purge logic manually in controlled staging — **never enable in production until legal/ops sign-off**.

## Pass criteria

- [ ] Batch reaches `verified` with matching checksum
- [ ] `chat:archive-mark-safe` only accepts `verified`
- [ ] Promotion records `promoted_by` / `promoted_via`
- [ ] Recovery verification passes
- [ ] Duplicate archive run is harmless
- [ ] Business-critical messages untouched
- [ ] Concurrent archive workers do not corrupt batches

## Results template

Record in `LOAD_TESTING.md` or staging ticket:

| Step | Result | Notes |
|------|--------|-------|
| Archive run | PASS/FAIL | |
| Verification | PASS/FAIL | |
| Promotion gate | PASS/FAIL | |
| Recovery | PASS/FAIL | |
| Idempotency | PASS/FAIL | |
| Lock | PASS/FAIL | |
| Business-critical | PASS/FAIL | |

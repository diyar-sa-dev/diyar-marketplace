# Message Retention & Archive

## Principles
- **MySQL/Postgres = source of truth** for active messages
- **Redis ≠ message history**
- **Never auto-purge by default**
- **Business-critical conversations protected**

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `CHAT_ARCHIVE_ENABLED` | false | Master archive switch |
| `CHAT_ARCHIVE_AFTER_DAYS` | 365 | Eligibility cutoff |
| `CHAT_PURGE_AFTER_ARCHIVE` | false | **Keep false until staging validates recovery** |
| `CHAT_PURGE_REQUIRES_SAFE_TO_PURGE` | true | Purge only after manual/ops promotion |
| `CHAT_AUTO_MARK_SAFE_TO_PURGE` | false | Never auto-promote in production initially |
| `CHAT_ARCHIVE_BATCH_SIZE` | 200 | Messages per batch |
| `CHAT_ARCHIVE_DISK` | local | Storage disk (use `s3` in prod) |

## Archive batch lifecycle

Table: `chat_archive_batches`

```text
archiving
   ↓
uploaded        (file written to storage)
   ↓
verified        (checksum + line count match)
   ↓
safe_to_purge   (manual promotion via ops / staging drill)
   ↓
(purge allowed when CHAT_PURGE_AFTER_ARCHIVE=true)
```

Each batch stores:
- `message_count`
- `checksum` (SHA-256)
- `storage_location`
- `status` + timestamps
- `error_message` on failure

## Safe operations flow

```text
DB messages
   ↓
ArchiveOldMessagesJob (Redis lock: archive-job)
   ↓
JSONL file + batch record
   ↓
Verify checksum + line count
   ↓
Mark messages archived_at (still in DB)
   ↓
(Staging) recovery drill
   ↓
markBatchSafeToPurge()
   ↓
(Optional future) purge rows
```

## Business-critical protection

Conversations with protected context (`order`, `booking`, `return`, `dispute`, `payment`) get `retention_policy = business_critical` and are **never archived**.

## Idempotency

- Messages with `archived_at` set are skipped
- Failed batches marked `failed` — messages remain unarchived for retry
- Job protected by Redis distributed lock

## Manual commands (ops toolbox)

```bash
# Run archive (queue)
php artisan chat:archive --force

# Run archive synchronously (staging drill)
php artisan chat:archive --sync --force --limit=50

# Inspect batches
php artisan chat:archive-status
php artisan chat:archive-status --batch={uuid}

# Re-verify checksum + line count
php artisan chat:archive-verify {batchId}

# Promote verified → safe_to_purge (production requires --operator --force)
php artisan chat:archive-mark-safe {batchId} --operator="ops-name" --note="reason" --force

# Reconcile unread cache
php artisan chat:reconcile-unread
```

Promotion audit fields: `promoted_by`, `promoted_via`, `promotion_note`.

Only **`verified` → `safe_to_purge`** is allowed. Attempts on `archiving`, `uploaded`, or `failed` batches are rejected.

See [STAGING_DRILL.md](./STAGING_DRILL.md) for the full validation workflow.

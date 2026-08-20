# Conversation Lifecycle

## States

| Status | Meaning |
|--------|---------|
| `active` | Default — normal messaging |
| `inactive` | No recent activity (future automation) |
| `archivable` | Eligible for conversation-level archive policies |
| `archived` | Conversation frozen — excluded from live archival scans |
| `closed` | Resolved thread (support/order complete) |
| `blocked` | Abuse/moderation — no messaging |

New conversations start as **`active`**.

## Relationship to message archival

Message archival (`ArchiveOldMessagesJob`) skips conversations where:

```text
lifecycle_status IN (archived, closed, blocked)
OR retention_policy = business_critical
```

## Future transitions (not all exposed in UI yet)

```text
active → inactive → archivable → archived
active → closed
active → blocked
```

Conversation-level lifecycle is **separate** from per-message `archived_at`.

## API exposure

`lifecycle_status` is stored on `conversations` and can be surfaced in admin/ops tooling. Customer chat UI continues to show active threads only.

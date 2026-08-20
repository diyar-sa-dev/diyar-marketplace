# Observability

## Structured events

All chat metrics use `ChatMetrics` and include:

```json
{
  "domain": "chat",
  "recorded_at": "ISO8601",
  "...": "context fields"
}
```

### Core events

| Event | When |
|-------|------|
| `chat.message.created` | After successful DB persist (`persistence_ms`) |
| `chat.message.failed` | Send transaction failure |
| `chat.broadcast.sent` | Reverb broadcast success (`broadcast_ms`) |
| `chat.broadcast.failed` | Reverb broadcast failure |
| `chat.archive.started` | Archive job begins |
| `chat.archive.completed` | Archive job finishes (`duration_ms`) |
| `chat.archive.batch.completed` | Single batch archived |
| `chat.archive.promoted_safe_to_purge` | Ops promotion verified → safe_to_purge |
| `chat.unread.reconciled` | `chat:reconcile-unread` command |
| `chat.lock.timeout` | Redis lock could not be acquired |
| `chat.attachment.access_failed` | Unauthorized/missing attachment |
| `chat.redis.failed` | Cache invalidation failure |

## Latency fields (for future dashboards)

Measure these from logs or APM:

```text
HTTP send → DB commit        (persistence_ms)
DB commit → broadcast        (broadcast_ms)
broadcast → recipient UI     (client-side; future RUM)
```

## Commands

```bash
php artisan chat:reconcile-unread
php artisan chat:reconcile-unread --user=<uuid>
php artisan chat:archive [--sync] [--force] [--limit=N]
php artisan chat:archive-status [--batch=uuid]
php artisan chat:archive-verify {batchId}
php artisan chat:archive-mark-safe {batchId} --operator=name --force
```

Scheduled: `chat:reconcile-unread` weekly (Monday 03:00).

See [STAGING_DRILL.md](./STAGING_DRILL.md) for archive validation workflow.

## Next step

Wire log aggregation (Datadog, Grafana Loki, etc.) to alert on:
- `chat.broadcast.failed` rate spikes
- `chat.archive.failed`
- `chat.message.failed`

Do not log message bodies.

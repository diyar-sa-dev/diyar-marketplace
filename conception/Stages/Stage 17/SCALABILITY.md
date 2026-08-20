# Scalability

## Horizontal scaling compatibility
- Stateless Laravel API instances behind load balancer
- Shared Redis (cache, rate limits, typing TTL)
- Shared database
- Multiple Reverb nodes with Redis scaling (Stage 16 config)
- Multiple queue workers (`chat-low` for archive, notification queues unchanged)
- Object storage path ready (`chat-archives/` on local disk; swap to S3 disk in production)

## Data lifecycle
```
Recent messages → Primary DB (fast queries)
Older messages  → ArchiveOldMessagesJob → JSONL cold storage
Business-critical → retention_policy = business_critical (no auto-archive)
```

## Bottleneck awareness
| Component | Scales by |
|-----------|-----------|
| Message writes | DB write capacity + indexes |
| Realtime | Reverb instances + connection limits |
| Notifications | Queue workers (Stage 16) |
| Archive | Low-priority workers, batched chunks |
| Attachments | Storage disk / S3 + authorized download |

## Worker priorities
```
HIGH   → notifications-high
NORMAL → notifications, notifications-low side effects
LOW    → chat-low (ArchiveOldMessagesJob)
```

Dev queue listener includes `chat-low` in `AppServiceProvider`.

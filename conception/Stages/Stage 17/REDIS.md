# Redis

## Usage (performance / ephemeral only)

MySQL remains source of truth for messages and read state.

| Concern | Implementation |
|---------|----------------|
| Total unread cache | `ChatUnreadCounterService` via Laravel Cache |
| Typing indicators | `ChatTypingService` — short TTL keys |
| Rate limiting | Laravel `RateLimiter` (Redis when configured) |

## Key prefixes

- `diyar:chat:user:{id}:unread_total`
- `diyar:chat:typing:{conversationId}:{userId}`
- `diyar:chat:conversation:{id}:summary`
- `diyar:chat:lock:archive-job`
- `diyar:chat:lock:reconcile-unread`

## Distributed locks

`ChatLockService` uses Laravel cache locks (Redis when configured):

| Lock | Purpose |
|------|---------|
| `archive-job` | Prevent concurrent archive workers |
| `reconcile-unread` | Coordinate unread counter rebuild |

**Rule:** DB transactions = correctness. Redis locks = worker coordination only.

## What Redis must NOT store

- Message history
- Permanent read receipts
- Archive files (use object storage / local disk)

## Invalidation

- `MessageCreated` → increment unread cache for recipients, forget on mark-read
- Conversation created → forget participant totals

## Graceful degradation

If Redis/cache unavailable, unread totals fall back to DB aggregation. Chat send/list continues to work.

## Health

Use existing app health checks; verify cache read/write when Redis is the cache driver.

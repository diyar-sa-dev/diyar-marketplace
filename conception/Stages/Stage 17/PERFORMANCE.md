# Performance

## Backend
- Cursor pagination (no OFFSET scans) with composite index `(conversation_id, created_at, id)`
- Archived messages excluded from live queries (`whereNull archived_at`)
- Conversation list returns preview metadata only — not full histories
- Cache layer for unread totals + conversation summaries with targeted invalidation
- Typing debounce reduces Reverb fan-out
- Structured logs: `chat.message.created`, `chat.archive.*`

## Frontend
- `useInfiniteQuery` — initial 30 messages, load older on demand
- Scroll position preserved when prepending older pages
- Optimistic send with `idempotency_key` as client correlation id
- React Query `staleTime` + no polling while WebSocket connected
- Targeted `setQueryData` for conversation previews (reduced invalidations)
- Reconnect reconciliation refetches active thread

## Latency path (unchanged invariant)
```
POST /messages → DB commit → afterCommit → MessageCreated
                              ├── BroadcastChatMessageListener → Reverb
                              └── DispatchNotificationListener → queue
```

## Virtualization
Not enabled by default (30-message pages). Enable if profiling shows scroll jank above ~100 DOM nodes.

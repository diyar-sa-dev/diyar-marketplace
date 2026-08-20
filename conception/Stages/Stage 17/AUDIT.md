# Stage 17.5 Audit Summary

## Correct / Reusable
- Stage 16 Reverb + Echo + notification dispatcher reused without duplication
- afterCommit → `MessageCreated` → broadcast/notify separation preserved
- Cursor pagination with `(created_at, id)` ordering
- Participant authorization on API + WebSocket channels
- Idempotency keys with DB unique constraint

## Risks addressed in 17.5
| Area | Before | After |
|------|--------|-------|
| Message history growth | Unbounded `messages` table | Configurable archive job + retention policy |
| Attachment security | Public storage URLs | Authorized download endpoint |
| Idempotency races | Check outside transaction | `lockForUpdate` + duplicate key recovery |
| Broadcast coupling | `MessageService` called Reverb directly | `BroadcastChatMessageListener` |
| Cache invalidation | Unread forget only | `ChatCacheService` + listeners |
| Typing flood | Every keystroke broadcast | Server debounce + client debounce |
| Frontend gaps | No load-older, no optimistic UX | Infinite query, scroll preservation, pending/failed states |
| Reconnect | Connection label only | Re-subscribe + message reconciliation |
| Cross-tab | None | `BroadcastChannel('diyar-chat')` |

## Remaining follow-ups (optional)
- Queued broadcast (`ShouldBroadcast`) to reduce POST latency
- Redis INCR unread counters with periodic reconciliation command
- Message list virtualization (only needed above ~100 visible messages)
- Thumbnail queue for large attachments
- Presence indicators (Redis heartbeat)

See [STAGE_17.5_COMPLETION_REPORT.md](./STAGE_17.5_COMPLETION_REPORT.md).

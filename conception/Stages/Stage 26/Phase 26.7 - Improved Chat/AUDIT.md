# Stage 26.7 Chat — Initial Audit

**Date:** 2026-08-26  
**Scope:** Existing Stage 17 chat vs enterprise spec.

## Summary

Stage 17 chat is **already production-capable** for core marketplace messaging. Stage 26.7 adds moderation hooks and documents remaining enterprise gaps without replacing the working model.

## Existing assets (verified)

| Area | Status | Notes |
|------|--------|-------|
| Conversations + participants | ✅ | customer/vendor/provider/admin types |
| Messages + attachments | ✅ | cursor pagination, soft delete |
| Idempotency | ✅ | `(conversation_id, idempotency_key)` unique |
| Realtime | ✅ | Reverb/Echo, typing, unread counts |
| Reconnect reconciliation | ✅ | `ChatProvider` + message cache |
| Authorization | ✅ | participant-only access |
| Rate limiting | ✅ | messages, typing, attachments |
| Tests | ✅ | 18+ chat API tests |

## Gaps identified

| Gap | Severity | Resolution |
|-----|----------|------------|
| No message report endpoint | Medium | **Added** `POST .../report` |
| No admin read-only oversight | Medium | Deferred — requires audit trail |
| Per-message read receipts | Low | Conversation-level delivery exists |
| No frontend chat E2E | Low | Deferred |
| Conversation list offset pagination | Low | Messages already use cursor |
| Block user workflow | Low | Deferred |

## Draft conversation rule (important)

Non-creators cannot access a conversation until the first message is sent (`ensureVisibleInInbox`). This prevents vendor inbox spam but affects test/API ordering.

## Realtime principle (verified)

```text
API persists message → DB commit → broadcast
```

WebSocket failure does not lose messages; client reconciles via REST on reconnect.

## Verdict

**Incremental hardening.** Core architecture is sound; 26.7 adds moderation foundation and documents admin/ops gaps.

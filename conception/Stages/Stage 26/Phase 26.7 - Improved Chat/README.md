# Phase 26.7 — Improved Chat

Enterprise hardening of the Stage 17 chat system.

## Status

**PARTIAL** — moderation hook added; core chat already production-capable from Stage 17.

## Documents

| File | Purpose |
|------|---------|
| [AUDIT.md](./AUDIT.md) | Initial audit vs enterprise spec |
| [CHAT_ARCHITECTURE.md](./CHAT_ARCHITECTURE.md) | Conversation/message/realtime model |
| [REALTIME_OPERATIONS.md](./REALTIME_OPERATIONS.md) | Reverb/Echo/reconnect ops |
| [MESSAGING_SECURITY_AUDIT.md](./MESSAGING_SECURITY_AUDIT.md) | Shared security notes |
| [ACCEPTANCE_MATRIX.md](./ACCEPTANCE_MATRIX.md) | Gate checklist |
| [COMPLETION_REPORT.md](./COMPLETION_REPORT.md) | Final verdict |

## What shipped in this pass

- `POST /profile/conversations/{id}/messages/{messageId}/report`
- `chat_message_reports` table + idempotent report per user/message
- `ChatModerationService` + tests

## What remains

- Admin read-only conversation oversight (audited)
- Per-message read receipts (conversation-level exists)
- Frontend chat E2E (Playwright)
- Conversation list cursor pagination
- Block user / admin moderation workflow UI

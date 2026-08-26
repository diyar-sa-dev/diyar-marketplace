# Chat Architecture

## Flow

```text
Client POST /conversations/{id}/messages
        ↓
MessageService::send (DB transaction)
        ↓
MessageCreated domain event
        ↓
Chat side effects (unread, delivery state)
        ↓
ChatRealtimeBroadcaster → Reverb private channel
        ↓
Echo clients (acceleration only)
```

## Domain model

### Conversation

- Typed: `customer_vendor`, `customer_provider`, `customer_admin`
- `last_message_id`, `last_message_at` for inbox ordering
- Participants via `conversation_participants`

### Message

- `idempotency_key` unique per conversation — client retry safe
- Cursor pagination: `created_at` + `id` descending
- Soft delete via `deleted_at`; archive via `archived_at`

### Moderation (26.7)

- `chat_message_reports` — one report per `(message, reporter)`
- Reasons: spam, harassment, inappropriate, scam, other
- Status: pending → reviewed/dismissed (admin workflow deferred)

## Realtime events

- `MessageCreated`, `MessageUpdated`, `MessageDeleted`
- `TypingStarted`, `TypingStopped`
- `ConversationUpdated`, unread count updates

Channel: `private-conversation.{conversationId}` — server authorized.

## Draft conversation rule

Until the first message is sent, only the creator can open the conversation. Prevents empty threads appearing in vendor/provider inboxes.

## Unread counts

Maintained on participant records — not computed with `COUNT(*)` per request.

## Reconnection

1. WebSocket disconnect detected
2. Exponential backoff reconnect (with jitter)
3. Fetch missed messages via REST cursor
4. Merge into React Query cache (`messageCache.ts`)

## API

```text
GET  /profile/conversations
POST /profile/conversations
GET  /profile/conversations/{id}/messages?cursor=
POST /profile/conversations/{id}/messages
POST /profile/conversations/{id}/messages/{messageId}/report
```

## Critical rule

**Database is authoritative.** Realtime is an acceleration layer; never assume WS delivery implies persistence.

# Architecture

## Shared realtime layer

```
Business domains (orders, bookings, chat)
        │
   Domain events
        │
   ┌────┴────┐
   │         │
Notifications  Chat (MessageCreated)
   │         │
   │    afterCommit
   │         │
   │    ┌────┴────┐
   │ Reverb   NotificationDispatcher
   │    │         │
   └───┬┴─────────┘
       │
 Laravel Echo (frontend)
       │
 ┌─────┴─────┐
 │           │
Bell UI    Chat UI
```

## Backend layers

| Layer | Responsibility |
|-------|----------------|
| Models | `Conversation`, `ConversationParticipant`, `Message`, `MessageAttachment` |
| Services | Authorization, conversation lifecycle, message send/list, attachments, unread cache, typing |
| Events | `MessageCreated` (notifications), `ConversationMessageCreated` (broadcast) |
| HTTP | `/api/v1/profile/conversations/*` |
| Channels | `conversations.{id}` private authorization |

## Frontend layers

| Layer | Path |
|-------|------|
| API client | `frontend/src/api/chat.ts` |
| React Query hooks | `frontend/src/hooks/chat/useChat.ts` |
| Realtime provider | `frontend/src/context/ChatProvider.tsx` (reuses `createEcho()`) |
| UI | `frontend/src/pages/ChatPage.tsx` |

## Message send flow

1. `POST /conversations/{id}/messages` with optional `idempotency_key`
2. Authorization + DB transaction (message, attachments, participant unread++)
3. `DB::afterCommit` → `MessageCreated` + `ConversationMessageCreated`
4. HTTP returns persisted message; Echo may also deliver the same `message_id` (frontend dedupes)

## What we did not build

- Separate chat WebSocket server
- Polling-based chat
- Duplicate notification dispatcher
- Permanent typing/presence in MySQL

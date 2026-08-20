# Realtime

## Infrastructure (reused from Stage 16)

- Laravel Reverb
- Laravel Echo + pusher-js
- `frontend/src/lib/realtime/echo.ts` singleton
- Broadcast auth via Sanctum (`/broadcasting/auth`)

## Channel

```
private-conversations.{conversationId}
```

Registered in `backend/routes/channels.php`:

```php
Broadcast::channel('conversations.{conversationId}', ...);
```

## Broadcast event

`ConversationMessageCreated`:

- Event name: `.message.created`
- Payload: `message_id`, `conversation_id`, `sender_id`, `sender_name`, `body`, `message_type`, `created_at`, `attachments` (minimal)

Dispatched in `ChatRealtimeBroadcaster::messageCreated()` **after** DB commit.

## Frontend subscription

`ChatProvider` subscribes when user opens a conversation:

```ts
createEcho().private(`conversations.${conversationId}`)
  .listen('.message.created', handler);
```

Dedupes by `message_id` when merging into React Query cache.

## Connection state

Shared Echo connector exposes `connected | connecting | disconnected | failed` to chat UI for localized status strings.

## Typing (V1)

- `POST /conversations/{id}/typing` sets Redis TTL key
- Broadcasts `ConversationTypingUpdated` (debounce on frontend recommended)

## Reconnection

Echo/Pusher handles reconnect; chat invalidates conversation list/unread on new events.

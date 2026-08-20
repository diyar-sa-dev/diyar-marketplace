# API

Base: `/api/v1/profile` (authenticated)

## Conversations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | Paginated list for current user |
| POST | `/conversations` | Create conversation |
| GET | `/conversations/unread-count` | Total unread across conversations |
| GET | `/conversations/{id}` | Conversation detail |
| PATCH | `/conversations/{id}/read` | Mark read (participant unread → 0) |
| POST | `/conversations/{id}/typing` | `{ "typing": true|false }` |

### Create conversation body

```json
{
  "type": "customer_vendor",
  "vendor_account_id": "uuid",
  "subject": "optional",
  "context_type": "order",
  "context_id": "uuid"
}
```

## Messages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations/{id}/messages?cursor=&limit=30` | Cursor pagination (newest page first) |
| POST | `/conversations/{id}/messages` | Send text and/or attachment |

### Send message

Multipart or JSON:

- `body` (optional if attachment present)
- `idempotency_key` (recommended)
- `attachment` (file)

Response includes full `message` resource.

## Response envelope

Standard Diyar `ApiResponse` success wrapper.

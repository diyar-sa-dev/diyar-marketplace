# Chat Domain

## Entities

### conversations

- UUID primary key
- `type`: `customer_vendor` | `customer_provider` | `customer_admin`
- Optional `context_type` / `context_id` (order, booking, etc.)
- `vendor_account_id` / `provider_account_id` when applicable
- Denormalized `last_message_id`, `last_message_at`

### conversation_participants

- Links `user_id` to `conversation_id`
- `participant_role`: customer, vendor, provider, admin
- Read state: `unread_count`, `last_read_at`, `left_at`

### messages

- Belongs to conversation
- `sender_id`, `body`, `message_type` (text, attachment, system)
- `idempotency_key` unique per conversation

### message_attachments

- Storage metadata linked to message
- Uploaded via HTTP before/at message creation

## Conversation creation rules

| Type | Customer initiates | Counterparty resolved from |
|------|-------------------|----------------------------|
| customer_vendor | yes | `vendor_account_id` |
| customer_provider | yes | `provider_account_id` |
| customer_admin | yes | first active admin user |

Vendors/providers/admins may initiate toward a known `customer_user_id` when authorized.

## Authorization

- API: participant check on every conversation/message route
- WebSocket: `ChatAuthorizationService::canSubscribe()` — conversation ID alone is never sufficient

## Separation from notifications

Chat owns messages and read state. Notifications reference `conversation_id` in payload for deep-linking but do not store message bodies as notification source of truth.

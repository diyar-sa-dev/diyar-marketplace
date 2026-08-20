# Security

## API authorization

Every chat route requires authenticated user + active participant.

Tested scenarios:

- Customer A cannot read Customer B conversation
- Customer cannot send to conversation they do not belong to
- Vendor A cannot access Vendor B conversation
- Non-participant channel subscription rejected

## WebSocket authorization

`routes/channels.php` delegates to `ChatAuthorizationService::canSubscribe()`.

## Attachments

- HTTP upload only (never WebSocket)
- Validated MIME/size in `ChatAttachmentService`
- Stored under Diyar media conventions
- Download URLs require participant access

## Rate limits

Configured in `AppServiceProvider`:

- `chat-messages`
- `chat-conversations`
- `chat-typing`

## Admin chat

Admin must be explicit conversation participant; no global admin snoop channel in V1.

## Logging

Structured events: `chat.message.created`, failures for broadcast/attachment/notification — no sensitive message body in logs by default.

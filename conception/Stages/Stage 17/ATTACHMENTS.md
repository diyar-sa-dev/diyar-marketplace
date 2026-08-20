# Attachments

## Flow

1. Client selects file in chat composer
2. `POST /conversations/{id}/messages` as `multipart/form-data`
3. Server validates type/size and stores via existing media/storage stack
4. `message_attachments` row created in same transaction as message
5. After commit: broadcast + notification (if enabled)

## Rules

- Do not upload over WebSocket
- Do not trust client MIME alone — server validates
- Attachment URLs returned in `MessageResource` for authorized participants

## V1 UI

Chat page includes attach button; wire file input to `sendMessage(..., attachment)` when enabling uploads in UI.

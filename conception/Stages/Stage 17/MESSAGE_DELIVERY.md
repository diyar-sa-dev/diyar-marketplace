# Message Delivery Semantics (V1)

## Model

| State | Meaning | Implementation |
|-------|---------|----------------|
| **Sent** | Message persisted | `POST /messages` success |
| **Delivered** | Recipient fetched thread | `conversation_participants.last_delivered_at` |
| **Read** | Recipient viewed thread | `conversation_participants.last_read_at` + `unread_count = 0` |

## What V1 does not include

- Per-message read receipts table
- WhatsApp-style ✓✓ indicators per bubble
- Push-level delivery acknowledgements from FCM/APNs

## Updates

- Listing messages (`GET .../messages`) marks participant **delivered**
- Mark read (`PATCH .../read`) marks **read** and clears unread count

## Future (post V1)

Optional per-message receipts if product requires:

```text
sent → delivered → read
```

without changing the core message domain.

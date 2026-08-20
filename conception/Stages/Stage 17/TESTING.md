# Testing

## Backend (`backend/tests/Feature/Chat/ChatApiTest.php`)

- Conversation create (customer ↔ vendor)
- Participant authorization (403 for intruder)
- Message send + list
- Idempotency key dedupe
- Cursor pagination
- Mark read + unread count
- Notification to recipient, not sender
- Broadcast event dispatched
- Vendor isolation

Run:

```bash
cd backend && php artisan test --filter=ChatApiTest
```

## Manual realtime

1. Start Reverb + queue worker + frontend dev server
2. Browser A: customer sends message
3. Browser B: vendor on same conversation — message appears without refresh
4. Disconnect network → verify reconnect copy
5. Two tabs — no duplicate rows (same `message_id`)

## Redis

- Verify typing key expires after TTL
- Verify unread cache invalidates on mark-read

## Frontend

```bash
cd frontend && npm run typecheck
```

# Messaging Performance Audit

**Date:** 2026-08-26

## Database indexes (existing)

### Notifications

- `user_notifications(user_id, read_at, created_at)`
- `user_notifications(user_id, dedupe_key)` unique
- `notification_deliveries(dedupe_key)` unique
- `notification_deliveries(user_id, channel, status)`

### Chat

- `messages(conversation_id, created_at)` — cursor pagination
- `messages(conversation_id, idempotency_key)` unique

### New (26.6/26.7 migration)

- `notification_broadcasts(status, scheduled_at)`
- `chat_message_reports(conversation_id, status)`

## Query patterns

| Endpoint | Pattern | N+1 risk |
|----------|---------|----------|
| Notification list | paginate + user | Low |
| Admin notification show | with deliveries | Low |
| Conversation messages | cursor + sender + attachments eager load | Low |
| Unread count | participant counter | O(1) |

## Deferred measurements

- API p50/p95/p99 under load
- WS broadcast latency
- k6 profiles (100–25K users)
- Query regression gates for 100+ notification list

## Recommendations

1. Keep delivery fan-out async — never sync SMTP in HTTP
2. Use broadcast queue isolation for campaigns
3. Add Horizon when Redis production deployment confirmed
4. Conversation list: migrate to cursor pagination when inbox >100 threads common

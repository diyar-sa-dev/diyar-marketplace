# Realtime Operations

## Stack

- **Server:** Laravel Reverb (`config/reverb.php`)
- **Client:** Laravel Echo + pusher-js protocol
- **Broadcast driver:** `BROADCAST_CONNECTION=reverb`

## Channels

| Channel | Auth | Events |
|---------|------|--------|
| `private-user.{userId}` | User ID match | `notification.created` |
| `private-conversation.{conversationId}` | Participant check | message, typing, read |

## Connection states (frontend)

`ChatProvider` tracks: connected → disconnected → reconnecting → reconnected | failed

Backoff: exponential with jitter (cap ~30s).

## Operations

### Health

- Reverb process running (`php artisan reverb:start`)
- Redis available (presence, typing, circuit breaker)
- `BROADCAST_CONNECTION` not `null` in staging/prod

### Failure modes

| Failure | Expected behavior |
|---------|-------------------|
| Reverb down | Messages persist via REST; UI shows disconnected |
| Redis down | Typing/presence degraded; core chat REST works |
| Queue worker down | Notifications queue; in-app may still persist synchronously |

### Troubleshooting

1. Check Reverb logs
2. Verify channel authorization (`routes/channels.php`)
3. Confirm Echo auth endpoint returns 200
4. Client reconnect + cursor fetch for missed messages

## Latency targets (measure, don't assume)

Track p50/p95 for:

- Message POST → DB commit
- Message POST → WS event received (connected client)
- Notification created → WS unread update

## Security

- All channels private — no public chat/notification channels
- Auth middleware on broadcasting routes
- No message bodies in server logs by default

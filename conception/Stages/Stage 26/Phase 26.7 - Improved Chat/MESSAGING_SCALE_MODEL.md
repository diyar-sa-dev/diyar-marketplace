# Messaging Scale Model

**Status:** Engineering model — **not a capacity claim**

## Assumptions

- Database: MySQL/PostgreSQL (authoritative)
- Redis: cache, counters, circuit breaker, presence, typing, queue backend
- Workers: Laravel queue workers (Horizon optional)
- Realtime: Laravel Reverb (WebSocket acceleration)

## Horizontal scaling axes

| Component | Scale strategy |
|-----------|----------------|
| API | Stateless PHP-FPM / Octane replicas behind load balancer |
| Workers | Add workers per queue: `critical`, `notifications-high`, `notifications`, `broadcast`, `chat` |
| Redis | Redis Cluster or dedicated instance; namespaced keys `diyar:*` |
| Reverb | Multiple Reverb nodes + sticky sessions or shared pub/sub |
| DB | Read replicas for notification list; primary for writes |

## Fan-out model (broadcasts)

```text
Broadcast (1 row)
  → ProcessNotificationBroadcastJob
  → audience resolver
  → chunks of 200 users (configurable)
  → N × DeliverNotificationChannelJob
```

Backpressure: monitor queue depth; pause low-priority broadcasts when depth exceeds threshold (manual/ops — not auto-implemented).

## Counter model

- Unread notifications: `diyar:notifications:unread:{userId}` TTL 300s
- Chat unread: per-conversation Redis keys + weekly `chat:reconcile-unread`
- Loss of Redis: rebuild from DB; no message/notification loss

## Targets (engineering goals, unverified)

| Metric | Target |
|--------|--------|
| GET unread-count p95 | < 100ms |
| GET notifications p95 | < 300ms |
| POST message p95 | < 300ms (excl. WS propagation) |
| Realtime propagation | sub-second under healthy infra |

## Evidence required before production claims

- k6 scenarios for reads, sends, broadcast fan-out, reconnect storms
- DB slow-query log under load
- Queue depth + worker utilization dashboards
- Redis memory/CPU under peak

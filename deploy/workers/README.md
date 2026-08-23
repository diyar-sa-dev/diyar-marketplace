# DIYAR — Production Workers

## Required processes

| Process | Command | Purpose |
|---------|---------|---------|
| API | `php-fpm` + Nginx | HTTP API |
| Queue (notifications) | `queue:work --queue=notifications-high,notifications,notifications-low` | Email/push/in-app |
| Queue (chat) | `queue:work --queue=chat-low` | Chat archive / low priority |
| Queue (default) | `queue:work --queue=default` | Webhooks, reports |
| Scheduler | `* * * * * php artisan schedule:run` | Cron |
| Reverb (optional) | `php artisan reverb:start` | Realtime chat/notifications |

## Supervisor

Templates: [`../supervisor/diyar-notifications.conf`](../supervisor/diyar-notifications.conf)

Production requirements:

- `CACHE_STORE=redis`
- `QUEUE_CONNECTION=redis`
- `REDIS_PREFIX` unique per environment
- Failed jobs table monitored (`failed_jobs`)
- Auto-restart on crash (`autorestart=true`)

## Health

- Liveness: `GET /api/v1/health`
- Readiness: `GET /api/v1/readiness` (DB + cache + queue probes)

## Staging isolation

Staging workers must use staging Redis prefix and must not consume production queues.

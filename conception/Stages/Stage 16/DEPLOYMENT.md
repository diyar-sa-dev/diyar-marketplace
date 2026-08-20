# Production Deployment — Notifications

## Process layout

```
                    Nginx
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
         Laravel             Reverb
         (PHP-FPM)          (WebSocket)
            │                   │
            ▼                   │
          Redis ◄────────────────┘
            │
            ▼
    Queue Workers (Supervisor)
```

## Required services

| Service | Command | Manager |
|---------|---------|---------|
| API | PHP-FPM + Nginx | systemd |
| Queue | `queue:work --queue=notifications-high,notifications,notifications-low` | Supervisor |
| Reverb | `reverb:start` | Supervisor |
| Redis | (optional, for Reverb scaling / future Horizon) | systemd |

Supervisor config: `deploy/supervisor/diyar-notifications.conf`

## Environment checklist

```
QUEUE_CONNECTION=database   # or redis in production
BROADCAST_CONNECTION=reverb
REVERB_*                    # see .env.example
DIYAR_PUSH_DRIVER=fcm       # production
DIYAR_FCM_*                 # service account path
DIYAR_NOTIFICATIONS_REALTIME=true
```

## Startup on reboot

Supervisor `autostart=true` + `autorestart=true` ensures:

- Server reboot → workers start automatically
- Worker crash → automatic restart

## Monitoring

- Queue depth: `php artisan queue:monitor notifications-high notifications notifications-low`
- Failed jobs: `php artisan queue:failed`
- Logs: `notifications.*` log keys (created, delivered, failed, realtime, push.invalid_tokens)

## Security

- Reverb credentials in environment only
- `/broadcasting/auth` requires authenticated session (Sanctum SPA)
- Rate limits on device registration and preference updates
- No notification creation from public API (events only)

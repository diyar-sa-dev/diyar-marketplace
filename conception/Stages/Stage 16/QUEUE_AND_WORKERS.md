# Queue & Workers

## Development

Laravel 13 registers dev processes automatically:

```bash
cd backend && composer dev
# or: php artisan dev
```

Processes started:

| Name | Command |
|------|---------|
| server | `php artisan serve` |
| queue | `php artisan queue:listen --tries=1 --timeout=0` |
| reverb | `php artisan reverb:start` |
| vite | `npm run dev` |

## Queue names

Configured in `config/diyar.php`:

| Priority | Queue name | Examples |
|----------|------------|----------|
| High | `notifications-high` | OTP, payment failed, system alert |
| Normal | `notifications` | Orders, bookings, offers |
| Low | `notifications-low` | Bulk / future digests |

Jobs are assigned in `NotificationDispatcher` via `NotificationQueue::forPriority()`.

## Worker parameters (production)

From `config/diyar.php` → `notifications.worker`:

| Setting | Default | Rationale |
|---------|---------|-----------|
| tries | 5 | Transient email/push failures |
| timeout | 120s | External provider latency |
| backoff | 30,60,120,300,600 | Exponential recovery |
| max_jobs | 1000 | Prevent memory leaks |
| max_time | 3600s | Worker rotation |
| memory | 128MB | PHP worker limit |
| sleep | 3s | Idle poll interval |

## Production (Supervisor)

See `deploy/supervisor/diyar-notifications.conf`:

```ini
php artisan queue:work --queue=notifications-high,notifications,notifications-low ...
php artisan reverb:start
```

**Never** launch workers from HTTP controllers (`exec`, `shell_exec`, etc.).

## Horizon (optional)

If Redis is adopted for queues in production, Laravel Horizon is recommended for monitoring. Protect `/horizon` with admin auth.

## Failure recovery

Supervisor/systemd `autorestart=true` ensures crash recovery. Failed jobs land in `failed_jobs` for `queue:retry`.

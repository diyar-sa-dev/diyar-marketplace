# Deployment

## Processes

Same as Stage 16:

- Laravel app (PHP-FPM / Octane)
- `php artisan reverb:start` (or container equivalent)
- Queue workers for notification queues

Development: `composer dev` if configured.

## Environment

```env
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=...
REVERB_APP_KEY=...
REVERB_APP_SECRET=...
REVERB_HOST=...
REVERB_PORT=8080
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"

DIYAR_CHAT_REALTIME_ENABLED=true
```

Use a single `BROADCAST_CONNECTION` value (remove duplicate overrides).

## Redis

Recommended for production cache + rate limiting. Chat remains functional with database cache driver at reduced performance.

## Scaling

Reverb scaling via Redis pub/sub (`REVERB_SCALING_ENABLED`) when multiple Reverb nodes are required — same config as Stage 16.

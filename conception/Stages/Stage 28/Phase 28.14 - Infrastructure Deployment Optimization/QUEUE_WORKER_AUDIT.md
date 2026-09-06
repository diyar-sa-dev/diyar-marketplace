# Queue Worker Audit — Phase 28.14

## Supervisor topology (`deploy/supervisor/diyar-notifications.conf`)

| Program | Queues | Workers | Timeout |
|---------|--------|---------|---------|
| critical | critical | 1 | 120s |
| high | notifications-high, notifications | 2 | 120s |
| broadcast | notifications-low, broadcast | 1 | 180s |
| chat | chat, chat-low, default | 2 | 120s |
| reverb | WebSocket | 1 | — |
| scheduler | schedule:run loop | 1 | — |

## Job safety (cross-ref 28.6, 28.11)

- Payment webhooks: idempotency via webhook event leases
- Notifications: delivery state machine with leases
- Retries: `--tries=5` with `--max-jobs=1000` worker recycle

## Operational model

- **Process manager:** Supervisor (recommended for Hostinger VPS)
- **Horizon:** Not installed — not required for current scale
- **Restart policy:** `autorestart=true`, deploy triggers `supervisorctl restart`

## Failure recovery

1. Check `failed_jobs` table
2. `php artisan queue:retry all` (review payment jobs individually)
3. Restart workers after Redis recovery

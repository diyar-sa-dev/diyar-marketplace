# Stage 16.5 — Production Notification Infrastructure

Stage 16.5 upgrades the V1 notification platform into a production-grade system while **extending** (not replacing) the existing architecture:

```
Domain Event → afterCommit → DispatchNotificationListener
  → NotificationDispatcher
      → In-App (persist) → Realtime broadcast (Reverb)
      → Queue (email / push by priority)
```

## What changed in 16.5

| Area | V1 | 16.5 |
|------|----|------|
| Realtime | 30s polling | Laravel Reverb WebSocket (primary) + 120s reconciliation |
| Workers | Manual `queue:work` | `composer dev` / Supervisor-managed workers |
| Push | Log provider | FCM/APNs provider architecture (`CompositePushProvider`) |
| Preferences | Flat profile JSON | Category × channel matrix from backend registry |
| Queues | Single queue | `notifications-high`, `notifications`, `notifications-low` |

## Developer workflow

From `backend/`:

```bash
composer dev
```

This runs (via Laravel 13 `artisan dev`):

- `php artisan serve`
- `php artisan queue:listen` (notification queues + default)
- `php artisan reverb:start` (default port **8090** — avoids Windows 8080 restrictions)
- `npm run dev` in `../frontend` (React app on port 3000)

### Windows notes

- **Port 8080 EACCES:** Windows often reserves 8080 (Hyper-V). Diyar defaults to **8090** via `REVERB_SERVER_PORT`.
- **PHP sodium warning:** Harmless for local dev. To silence: comment out `extension=sodium` in `php.ini`, or install matching `php_sodium.dll` for your PHP build.
- **Frontend Reverb vars:** copy `frontend/.env.example` → `frontend/.env.local` and set `VITE_REVERB_APP_KEY` to match `backend/.env`.

## Documentation map

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design
- [QUEUE_AND_WORKERS.md](./QUEUE_AND_WORKERS.md) — queue priorities & worker config
- [REALTIME.md](./REALTIME.md) — Reverb, private channels, frontend Echo
- [PUSH.md](./PUSH.md) — FCM/APNs providers & token handling
- [NOTIFICATION_SETTINGS.md](./NOTIFICATION_SETTINGS.md) — preferences API & UI
- [DEPLOYMENT.md](./DEPLOYMENT.md) — production process layout
- [STAGE_16_COMPLETION_REPORT.md](./STAGE_16_COMPLETION_REPORT.md) — verification checklist

## API additions

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/profile/notification-preferences` | Registry + user matrix |
| PATCH | `/api/v1/profile/notification-preferences` | Update preferences |

Existing notification APIs remain unchanged.

## Tests

```bash
cd backend && php artisan test --filter=Notification
```

Current suite: **384 tests passing** (includes 6 new notification tests).

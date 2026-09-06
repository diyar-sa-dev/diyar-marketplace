# Messaging Security Audit

**Date:** 2026-08-26

## Notifications

| Test | Result |
|------|--------|
| User A cannot read User B notifications | ✅ API scoped to auth user |
| Private channel auth rejects other users | ✅ Tested in `NotificationBroadcastTest` |
| Admin without permission blocked | ✅ `notifications.manage` for broadcast/retry |
| Provider credentials in API responses | ✅ Not exposed |
| Dedupe prevents duplicate sends | ✅ DB unique + job idempotency |

## Chat

| Test | Result |
|------|--------|
| Non-participant read/send | ✅ 403 |
| Non-participant report | ✅ 403 |
| Cross-vendor conversation | ✅ Authorization enforced |
| Attachment download | ✅ Participant-only |
| Admin impersonation | ⚠️ Not implemented (by design in Stage 17) |
| Message report idempotency | ✅ Unique (message, reporter) |

## Rate limiting

| Endpoint | Limiter |
|----------|---------|
| Chat messages | `chat-messages` per minute |
| Typing | `chat-typing` (tighter) |
| Admin broadcast | `admin-broadcasts` 10/hour |
| Device registration | `notification-devices` |

## Privacy

- Do not log SMTP/SMS credentials
- Minimize notification `data` payload
- Report `details` stored for moderation — access control deferred to admin oversight phase

## Remaining work

- Admin audited read-only conversation access
- Block user / abuse escalation workflow
- Security concurrency tests at 100+ parallel messages (partial coverage exists)

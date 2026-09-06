# Stage 26.6 Notifications — Initial Audit

**Date:** 2026-08-26  
**Scope:** Existing notification infrastructure vs enterprise messaging spec.

## Summary

Stage 16 delivered a **solid foundation** — not a greenfield rewrite. The pipeline already matches the target architecture at a high level:

```text
Domain Event → DispatchNotificationListener → NotificationDispatcher
  → in-app persist + DeliverNotificationChannelJob (email/push)
  → NotificationDelivery tracking + circuit breaker
  → Reverb broadcast (UserNotificationCreated)
```

## Existing assets (verified)

| Area | Status | Location |
|------|--------|----------|
| `user_notifications` | ✅ | UUID, dedupe, priority, soft delete, indexes |
| `notification_deliveries` | ✅ | dedupe unique, attempts, last_error |
| `notification_devices` | ✅ | push tokens |
| Category taxonomy | ✅ | 17 categories in `config/diyar.php` |
| Preference matrix | ✅ | category × channel in user preferences |
| Idempotency | ✅ | `dedupe_key` on notifications + deliveries |
| Circuit breaker | ✅ | `NotificationCircuitBreaker` |
| Priority queues | ✅ | `notifications-high`, `notifications`, `notifications-low` |
| Realtime | ✅ | Reverb + private user channels |
| Admin read | ✅ | `AdminNotificationController` index/show |
| Chat suppression | ✅ | presence-aware chat notification skip |

## Gaps identified (pre-implementation)

| Gap | Severity | Resolution |
|-----|----------|------------|
| Job dispatch without `afterCommit()` | **Critical** | Fixed in `NotificationDispatcher` |
| No admin broadcast/campaign | High | Added chunked `ProcessNotificationBroadcastJob` |
| No delivery admin visibility/retry | High | Added deliveries index + retry endpoint |
| No `notifications.manage` permission | Medium | Added enum + routes |
| No `mail:test` command | Medium | Added `MailTestCommand` |
| No SMS notification channel | Medium | Deferred — OTP SMS only |
| Delivery statuses incomplete vs spec | Low | Pending/delivered/failed/skipped exist |
| No Horizon | Low | Deferred — env dependent |
| No Playwright notification E2E | Low | Deferred |

## Mail configuration (verified)

- Default mailer: `env('MAIL_MAILER', 'log')` — **log driver in dev**
- Supports SMTP, Resend, Mailgun, Postmark, SES via Laravel mailers
- Production requires explicit `MAIL_*` in environment (never committed)
- Test path: `php artisan mail:test someone@example.com`

## Failure isolation (verified)

Notification dispatch is **never synchronous** in HTTP handlers for email/push. Order/payment flows dispatch domain events; listener queues channel jobs. Provider failure does not roll back business transactions.

## Verdict

**Upgrade path, not rewrite.** Stage 26.6 focuses on operational gaps (afterCommit, broadcast, delivery ops, mail test) while preserving Stage 16 contracts.

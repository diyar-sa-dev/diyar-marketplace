# Phase 0 — Enterprise Messaging & Notifications Audit

**Date:** 2026-08-26  
**Branch:** `dev`  
**Scope:** Stage 16 (notifications), Stage 17 (chat), Stage 26.6, Stage 26.7

## Dependency map

```text
Business domain events (orders, payments, reviews, chat, …)
    ↓
DispatchNotificationListener / direct NotificationDispatcher::dispatch()
    ↓
NotificationDispatcher
    ├── NotificationCatalog (channels, priority, preference overrides)
    ├── NotificationRenderer
    ├── NotificationPreferenceResolver
    ├── NotificationAggregationService (review.created grouping)
    ├── NotificationUnreadCounterService (Redis diyar:notifications:unread:{user})
    ├── persist UserNotification (DB authoritative)
    ├── NotificationRealtimeBroadcaster → Reverb UserNotificationCreated
    └── DeliverNotificationChannelJob::dispatch()->afterCommit()
            ↓
        NotificationDeliveryStateMachine
        NotificationCircuitBreaker (diyar:circuit:{provider})
            ↓
        Channel adapters: InApp, Email, Push, Sms

Chat (parallel stack):
REST MessageController → MessageService (DB commit first)
    ↓
broadcast message.created (Reverb)
Redis: typing, presence, unread (ChatUnreadCounterService)
```

## Repository state (verified locally)

| Layer | Key paths |
|-------|-----------|
| Models | `UserNotification`, `NotificationDelivery`, `NotificationDevice`, `NotificationBroadcast`, `ChatMessageReport` |
| Migrations | `080000_create_notification_infrastructure`, `260700`, `260800`, `260900` |
| Services | `NotificationDispatcher`, `NotificationService`, `NotificationBroadcastService`, `ChatModerationService` |
| Jobs | `DeliverNotificationChannelJob`, `ProcessNotificationBroadcastJob` |
| Commands | `mail:test`, `notifications:prune`, `notifications:reconcile-deliveries`, `notifications:reconcile-unread`, `notifications:broadcasts:dispatch-scheduled` |
| Frontend | `useNotifications`, `useChat`, `ChatMessageActions`, `MessagingSectionErrorBoundary` |
| Tests | 39 messaging-specific tests **PASS**; full suite **683/684** (1 unrelated coupon test) |

## Risk register

| Risk | Severity | Mitigation status |
|------|----------|-------------------|
| Duplicate external delivery | High | DB unique `dedupe_key` on notifications/deliveries; job idempotency via `claimForProcessing()` |
| Lost in-app notifications | High | DB persist before queue/realtime; Redis loss → list still works |
| Stale unread counts | Medium | Redis cache + `notifications:reconcile-unread`; DB rebuild on cache miss |
| Duplicate unread increment | Medium | **Fixed** — cold-cache increment uses rebuild only (no double add) |
| Aggregated notification re-fan-out | Medium | **Fixed** — aggregated updates skip channel delivery loop |
| Queue starvation by broadcasts | Medium | Dedicated `broadcast` queue; chunk size 200; priority queues |
| Retry storms | Medium | Exponential backoff `[30,60,120,300,600]` + circuit breaker |
| Redis failure | Medium | Graceful degrade: COUNT rebuild, presence/typing offline |
| WebSocket failure | Medium | REST remains source of truth; frontend reconciliation |
| IDOR on notifications | High | `findOwned()` user scoping — tested |
| IDOR on chat | High | Participant checks — tested |
| SMS mandatory for business | High | SMS disabled by default; suppressed when unconfigured |
| N+1 on hot paths | Medium | Unread counter removes per-request COUNT; message cursor pagination |
| Provider failover | Low | **NOT IMPLEMENTED** — single provider per channel |
| Horizon | Low | **NOT VERIFIED** — standard workers only |
| Load / latency claims | N/A | **NOT MEASURED** — no k6 run |

## Query budgets (hot endpoints)

| Endpoint | Budget | Notes |
|----------|--------|-------|
| GET unread-count | ≤2 queries | Redis hit = 0 DB; miss = 1 COUNT |
| GET notifications (page) | ≤3 queries | paginate + user |
| POST read / read-all | ≤3 queries | update + counter sync |
| GET messages (cursor) | ≤4 queries | indexed `(conversation_id, created_at, id)` |

## What must not break

- Existing notification API contracts (`/api/v1/profile/notifications/*`)
- Dedupe keys on domain events
- Order/payment HTTP responses independent of mail/SMS/push/WS
- Chat REST persistence before broadcast

## Verdict

**Upgrade in progress — PARTIAL.** Foundation from Stages 16/17 is production-oriented. Stage 26.6 adds state machine, aggregation, unread counters, SMS adapter (config-gated), broadcast ops, and reconciliation. Infrastructure verification (real SMTP, FCM, k6, Playwright) remains **INFRASTRUCTURE REQUIRED**.

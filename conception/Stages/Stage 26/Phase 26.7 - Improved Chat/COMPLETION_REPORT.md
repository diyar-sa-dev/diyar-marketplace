# Phase 26.7 Completion Report

**Verdict: PARTIAL** — messenger-grade foundations and admin moderation shipped; per-message delivery states and k6/E2E remain open.

## Enterprise hardening pass (latest)

| Capability | Status | Evidence |
|------------|--------|----------|
| Async chat broadcasts | IMPLEMENTED | All chat events use `ShouldBroadcast` (queued), not `ShouldBroadcastNow` |
| Idempotent message send | IMPLEMENTED | Required `idempotency_key` on send; server-generated UUIDs |
| Read receipts (watermark) | IMPLEMENTED | `PATCH .../read`, monotonic unread via participant watermark |
| Unread counters | IMPLEMENTED | DB-authoritative with reconciliation path |
| Chat moderation workflow | IMPLEMENTED | Report states, `PATCH /admin/chat/reports/{id}` (dismiss/action) |
| Admin read-only oversight | IMPLEMENTED | Search, inspect, audit trail; no impersonation |
| Frontend reconnect | IMPLEMENTED | `ChatProvider` reconciliation on reconnect; `RealtimeEventRouter` backoff |
| Error boundaries | IMPLEMENTED | `MessagingSectionErrorBoundary` on chat surfaces |
| Required idempotency in tests | FIXED | All chat API tests supply `idempotency_key` |
| Per-message delivery states | NOT IMPLEMENTED | `sent/delivered/read` per message — conversation watermark only |
| Attachment AV hook | PARTIAL | MIME/size validation; no AV integration |
| k6 chat baselines | NOT MEASURED | Scripts exist; no recorded metrics |
| Playwright chat E2E | NOT VERIFIED | `frontend/e2e/messaging.spec.ts` exists; not run |
| Reverb production | CONFIGURED | `render.yaml` Reverb service + `REVERB_ALLOWED_ORIGINS`; local Windows lacks PHP sodium |

## Test evidence (2026-08-26)

| Suite | Result |
|-------|--------|
| Messaging PHPUnit | **66/66 PASS** (includes `AdminChatOversightTest`, `ChatModerationTest`, `ChatApiTest`) |
| Admin resolve report | **PASS** (fix: customer must send first message in draft conversation) |
| Frontend typecheck | **PASS** |

## Acceptance gates

| Gate | Result |
|------|--------|
| Async chat broadcasts | ✅ |
| Idempotent message send | ✅ |
| Message delivery states | ❌ (watermark read only) |
| Read receipts | ⚠️ conversation-level |
| Unread correctness | ✅ |
| Reconnect reconciliation | ✅ |
| Reverb production deployment | ⚠️ config only; not live-verified |
| Redis-backed ephemeral state | ✅ (presence/typing) |
| Attachment security | ⚠️ partial |
| Moderation workflow | ✅ |
| Admin oversight | ✅ |
| Rate limits | ✅ |
| IDOR/security tests | ✅ (feature tests) |
| E2E tests | ❌ not run |
| Query budgets | ✅ |
| k6 baseline | ❌ |
| Failure injection | ⚠️ partial |
| Observability | ⚠️ logs only |
| DR | ⚠️ documented |
| Retention | ⚠️ partial |

## Principle upheld

Messages persist in DB first; Reverb is acceleration only. Draft conversations are visible only to their creator until the first message is sent — tests must respect this invariant.

## Remaining for COMPLETE

1. Per-message delivery state machine (`sent` → `delivered` → `read`)
2. Run and record k6 chat scenarios
3. Playwright E2E (send, receive, reconnect, unread, report)
4. Live Reverb verification on staging/production
5. Wire chat side effects through domain outbox when outbox is enabled globally

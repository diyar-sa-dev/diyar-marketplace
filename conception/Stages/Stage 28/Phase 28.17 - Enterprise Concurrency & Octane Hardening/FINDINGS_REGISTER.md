# Findings Register — Phase 28.17

**Date:** 2026-09-03  
**Severity:** P0 (critical) · P1 (high) · P2 (medium) · P3 (low)

---

| ID | Severity | Area | Problem | Risk | Fix | Status |
|----|----------|------|---------|------|-----|--------|
| F-001 | P0 | Octane auth | In-memory auth/session leaked between Swoole requests | User A identity in User B request | `FlushAuthAndSessionState`, `EnsureCleanAuthState`, Octane flush bindings | **FIXED** |
| F-002 | P0 | Octane session | Session not persisted after Octane response | Random logouts, stale session | `PersistApplicationSession` on `RequestTerminated` | **FIXED** |
| F-003 | P0 | Octane session | `forgetInstance('session')` caused dual SessionManager | Login OK but `/auth/me` 401 | Use `forgetDrivers()` only — never forget session instance | **FIXED** |
| F-004 | P0 | Payments | Webhook concurrent processing could double-apply | Duplicate payment finalization | Processing lease on `payment_webhook_events` | **FIXED** |
| F-005 | P0 | Payments | `PaymentApplicationService::submit` race on concurrent submit | Double charge attempts | Row locks + idempotency key in transaction | **FIXED** |
| F-006 | P1 | Locale | `app()->setLocale()` could leak across Octane requests | Wrong language for user | `ResetRequestScopedState` + `LocaleIsolationTest` | **FIXED** |
| F-007 | P1 | Scheduler | Scheduled tasks lacked `onOneServer()` | Duplicate cron on N nodes | `$oneServer()` wrapper in `routes/console.php` | **FIXED** |
| F-008 | P1 | Scheduler | Minute tasks could overlap on slow runs | Double inventory release / outbox | `withoutOverlapping(N)` on high-frequency tasks | **FIXED** |
| F-009 | P1 | Queue | `ProcessPaymentWebhookJob` duplicate dispatch | Double webhook processing | `ShouldBeUnique` + processor idempotency + lease | **FIXED** |
| F-010 | P1 | Payments | `markFailed()` without transaction lock | Race on failure path | `DB::transaction` + `lockForUpdate` | **FIXED** |
| F-011 | P1 | Checkout | Last-unit oversell under parallel HTTP unproven | Overselling inventory | DB parallel test passes; HTTP Octane pending | **PARTIAL** |
| F-011b | P1 | Payouts | Concurrent full-balance payout requests | Double pending payout | `PayoutConcurrencyTest` — 4 workers → 1 success | **FIXED** |
| F-012 | P1 | Multi-node | Session/auth across LB nodes not runtime-tested | Auth failure when scaled horizontally | Redis sessions + Octane flush — needs 2-node compose test | **OPEN** |
| F-013 | P1 | Services | Service booking payment locks untested for concurrency | Duplicate booking payment | Audit code exists; add concurrency test | **OPEN** |
| F-014 | P1 | Orders | Order cancellation vs active payment race unreviewed | Cancel after pay edge case | Review `OrderCancellationService` + test | **OPEN** |
| F-015 | P2 | Queue | Non-critical jobs lack explicit idempotency audit | Duplicate notifications/reports | Document + test per job category | **OPEN** |
| F-016 | P2 | Inventory | Expired reservation release vs checkout race | Phantom stock / oversell | Concurrency test for release command | **OPEN** |
| F-017 | P2 | Octane | `max_request` mismatch config (1000) vs compose (2000) | Confusion in ops | Document; align in production env | **DOCUMENTED** |
| F-018 | P2 | Reverb | Not in loadtest compose | WS scale unproven | Add Reverb to staging loadtest | **OPEN** |
| F-019 | P2 | Storage | Local disk uploads in dev | Broken media on multi-node | Production → object storage (documented) | **PREPARED** |
| F-020 | P2 | API | Checkout lacks HTTP Idempotency-Key | Double-click duplicate orders | Evaluate checkout idempotency header | **OPEN** |
| F-021 | P3 | Dev statics | Fake gateway / log SMS static arrays | Test pollution under Octane | `FlushOctaneDevState` | **FIXED** |
| F-022 | P3 | Stash | `stash@{0}` incomplete (missing listener classes) | Blind apply breaks build | Working tree wins; stash reference-only | **MITIGATED** |
| F-023 | P3 | CI | CI uses `artisan serve` not Octane | Octane regressions not caught in CI | Optional Octane job in CI (future) | **OPEN** |
| F-024 | P1 | Performance | k6 baseline not run post-hardening | Unknown latency under load | Deferred by phase scope — run in later gate | **DEFERRED** |

---

## Summary

| Severity | Total | Fixed | Partial | Open | Deferred |
|----------|-------|-------|---------|------|----------|
| P0 | 5 | 5 | 0 | 0 | 0 |
| P1 | 10 | 5 | 1 | 3 | 1 |
| P2 | 6 | 0 | 0 | 5 | 0 |
| P3 | 3 | 1 | 0 | 2 | 0 |

**P0/P1 code fixes:** Complete for in-scope items. **Runtime verification gates** (multi-node, HTTP parallel checkout, k6) remain open.

---

## Cross-references

- Fixes logged in [REMEDIATION_LOG.md](./REMEDIATION_LOG.md)
- Gates in [FINAL_CERTIFICATION.md](./FINAL_CERTIFICATION.md)
- Open items in [KNOWN_GAPS.md](./KNOWN_GAPS.md)

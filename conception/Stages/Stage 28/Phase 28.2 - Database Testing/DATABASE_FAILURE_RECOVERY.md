# Phase 28.2 — Database Failure & Recovery

**Date:** 2026-08-27

---

## Scope

Assess application behavior when the database is unavailable or transactions fail — **without destructive production testing**.

---

## Tests performed

| Scenario | Method | Result |
|----------|--------|--------|
| Health with DB up | `GET /api/v1/health` (Phase 28.1) | PASS — `database.ok: true` |
| Health with DB down | Simulate wrong host/port | **NOT TESTED** |
| Connection refused | Stop MySQL during request | **NOT TESTED** (would disrupt dev) |
| Query timeout | `max_statement_time` | **NOT TESTED** |
| Transaction deadlock | Induced deadlock | **NOT TESTED** |
| Partial transaction rollback | Exception mid-checkout | Covered indirectly by PHPUnit transaction tests |
| Readiness vs liveness | `/health/live` vs `/health/ready` | Documented in Phase 28.1 — readiness includes DB |

---

## Expected behavior (from code review)

| Component | Expected on DB failure |
|-----------|------------------------|
| `PlatformHealthService` | `database.ok: false` → readiness fails |
| Checkout/order creation | Exception → HTTP error, no success envelope |
| Queue jobs requiring DB | Fail + retry/failed_jobs |
| Migrations | Exit non-zero |

**Code review only — NOT runtime verified for failure paths in Phase 28.2.**

---

## Transaction rollback evidence (PHPUnit)

| Test area | Evidence |
|-----------|----------|
| Inventory audit | `InventoryTransactionAuditTest` — no partial stock state |
| Refund idempotency | No duplicate financial records |
| Payment flow | Single payment state per order |
| Multi-vendor returns | `ReturnRefundMultiVendorTest` — consistent breakdown |

These tests run on SQLite with transactions — **PASS** but not equivalent to MySQL failure modes.

---

## Safe isolation recommendation

For Phase 28.5+ failure testing:

```text
1. Use Docker MySQL 8 staging (port 3307)
2. Point test .env to invalid port → verify /health/ready returns 503
3. Stop container mid-request → verify no corrupt order state
4. Restore container → verify recovery
```

---

## Failure recovery gate

```text
NOT TESTED
```

Readiness architecture exists. **Runtime DB failure behavior NOT verified** in Phase 28.2.

---

## Risk note

Until failure testing completes, production readiness for DB outages is **NOT VERIFIED** — not assumed FAIL, but cannot claim PASS.

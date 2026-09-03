# Octane Architecture Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Prior pass:** [Final Enterprise Certification](../Phase%2028.17%20-%20Final%20Enterprise%20Certification/FINAL_ENTERPRISE_CERTIFICATION.md) (2026-08-29, 8.7/10, **NOT COMPLETE**)

---

## Runtime Topology

| Component | Location | Status |
|-----------|----------|--------|
| Server | Swoole via Laravel Octane | **VERIFIED** |
| Loadtest compose | `docker-compose.loadtest.yml` | **VERIFIED** |
| Octane image | `backend/Dockerfile.octane` (PHP 8.3, pecl swoole+redis) | **VERIFIED** |
| Workers | 4 HTTP + 2 task (env-overridable) | **VERIFIED** (28.17 pass) |
| Session store | Redis (`SESSION_DRIVER=redis`) in loadtest | **VERIFIED** |
| Native Windows dev | Swoole unavailable; use Docker stack | **VERIFIED** |

```text
k6 → api:8000 (Octane/Swoole, 4 workers)
       ├── Redis (cache, queue, session)
       └── MySQL 8.0 (loadtest DB)
```

---

## Listener Matrix (HEAD vs Stash vs Required)

| Listener | HEAD `octane.php` | Stash `octane.php` | Class exists in repo? | Status |
|----------|-------------------|--------------------|-----------------------|--------|
| Framework defaults (`FlushOnce`, `DisconnectFromDatabases`, …) | Yes | Yes | Yes | **VERIFIED** |
| `FlushOctaneDevState` | `OperationTerminated` | Same | Yes — clears dev OTP/SMS/fake gateway statics | **VERIFIED** |
| `FlushAuthAndSessionState` | **No** | `RequestReceived` | **No** | **NOT VERIFIED** |
| `PersistApplicationSession` | **No** | `RequestTerminated` | **No** | **NOT VERIFIED** |
| `EnsureCleanAuthState` | **No** | **No** | **No** | **NOT VERIFIED** |

### HEAD configuration (authoritative)

```96:96:backend/config/octane.php
            FlushOctaneDevState::class,
```

Only custom listener registered. `'flush' => []` — no auth/session container flush list.

### Stash configuration (incomplete blueprint)

- `RequestReceived` → `FlushAuthAndSessionState`
- `RequestTerminated` → `PersistApplicationSession`
- `'flush'` includes `auth`, `auth.driver`, `session.store`
- **Missing class files** → Octane would fail autoload if applied without implementation.

---

## Static-State & Request Isolation

| Concern | Mitigation today | Octane-safe? | Status |
|---------|------------------|--------------|--------|
| Dev OTP/SMS logs | `FlushOctaneDevState` (non-prod only) | Yes in dev loadtest | **VERIFIED** |
| Fake payment gateway statics | Same listener when `use_fake_gateway` | Yes in loadtest | **VERIFIED** |
| Auth guard singleton bleed | None in HEAD | **Unknown** | **NOT VERIFIED** |
| Session store reuse across requests | Redis-backed; no custom flush | **Unknown** | **PARTIALLY VERIFIED** |
| Service container auth bindings | No explicit flush | **Unknown** | **NOT VERIFIED** |

`FlushOctaneDevState` explicitly skips production — production Octane has **no** DIYAR custom termination listener.

---

## Capacity Evidence (inherited 2026-08-29)

| Profile | Result | Status |
|---------|--------|--------|
| ~25 RPS sustained | p95 ~118 ms | **VERIFIED** (dev Docker) |
| ~50 RPS | p95 ~825 ms, plateau ~50 RPS | **VERIFIED** |
| 278 RPS / 1M req·hour target | Never measured on target hardware | **NOT VERIFIED** |

Healthcheck in `docker-compose.loadtest.yml` uses PHP `file_get_contents` probe — fixed in prior 28.17 pass (**VERIFIED** healthy).

---

## Gaps Blocking Octane Hardening

1. Implement and register auth/session isolation listeners (see [AUTH_SESSION_AUDIT.md](./AUTH_SESSION_AUDIT.md)).
2. Add live Octane auth-isolation probe scripts (concurrent users, same worker).
3. Add `AuthSessionIsolationTest` under Octane or worker-simulation harness.
4. Re-run k6 on hardened stack; compare p95 at 25/50 RPS.
5. Document production listener set (dev-only `FlushOctaneDevState` is insufficient for auth bleed proof).

---

## Verdict

| Area | Status |
|------|--------|
| Octane boot path (HEAD) | **VERIFIED** |
| Auth/session hardening | **NOT VERIFIED** |
| Production-ready Octane | **NOT VERIFIED** |

**Production Ready:** No.

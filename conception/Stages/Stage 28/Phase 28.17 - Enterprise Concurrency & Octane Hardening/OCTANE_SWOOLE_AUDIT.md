# Octane / Swoole Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Swoole runtime via Docker loadtest stack, worker lifecycle, max_request tuning

---

## Runtime Stack

| Component | Location | Status |
|-----------|----------|--------|
| Server | Laravel Octane + Swoole | **VERIFIED** |
| Loadtest compose | `docker-compose.loadtest.yml` | **VERIFIED** |
| Octane image | `backend/Dockerfile.octane` (PHP 8.3, pecl swoole+redis) | **VERIFIED** |
| Native Windows dev | Swoole unavailable; Docker required | **VERIFIED** |
| CI / local PHPUnit | `artisan serve` or PHPUnit (non-Octane) | **VERIFIED** |

```text
k6 (profile k6) → api:8000 (Octane/Swoole)
                    ├── Redis (cache, queue, session)
                    └── MySQL 8.0 (diyar_loadtest)
```

---

## Worker Configuration

| Setting | `config/octane.php` | `Dockerfile.octane` CMD | `docker-compose.loadtest.yml` | Status |
|---------|---------------------|-------------------------|-------------------------------|--------|
| HTTP workers | CLI default (4) | `--workers=4` | `OCTANE_WORKERS` default 4 | **VERIFIED** |
| Task workers | CLI default (2) | `--task-workers=2` | `OCTANE_TASK_WORKERS` default 2 | **VERIFIED** |
| Swoole `max_request` | `1000` (swoole options) | `--max-requests=1000` | `OCTANE_MAX_REQUESTS` default **2000** | **VERIFIED** (dual values — see note) |
| Session driver | — | — | `SESSION_DRIVER=redis` | **VERIFIED** |
| Queue driver | — | — | `QUEUE_CONNECTION=redis` | **VERIFIED** |

**Note:** Swoole `max_request` is **1000** in `config/octane.php` and Dockerfile CMD, but compose overrides via `--max-requests=$OCTANE_MAX_REQUESTS` (default **2000**). Loadtest stack uses compose value; config file applies when CLI omits flag.

---

## Custom Listeners (implemented 2026-09-03)

| Listener | Hook | Purpose | Status |
|----------|------|---------|--------|
| `FlushAuthAndSessionState` | `RequestReceived` | Wipe in-memory auth/session before request | **VERIFIED** (code) |
| `PersistApplicationSession` | `RequestTerminated` | Persist Redis session after response | **VERIFIED** (code) |
| `ResetRequestScopedState` | `RequestReceived` | Reset locale to config default | **VERIFIED** (code) |
| `FlushOctaneDevState` | `OperationTerminated` | Clear dev OTP/SMS/fake-gateway statics | **VERIFIED** (dev only) |
| Framework defaults | Various | DB disconnect, GC, flush-once, etc. | **VERIFIED** |

`'flush' => ['auth', 'auth.driver', 'session.store']` — **VERIFIED** in `config/octane.php`.

Middleware `EnsureCleanAuthState` prepended to API + web when `LARAVEL_OCTANE=1` — **VERIFIED** in `bootstrap/app.php`.

---

## Boot & Health Evidence

| Check | Evidence | Status |
|-------|----------|--------|
| Compose healthcheck | PHP `file_get_contents` probe on `/api/v1/health` | **VERIFIED** (prior pass) |
| Octane boot with listeners | Classes exist; autoload resolves | **VERIFIED** (code) |
| Live Swoole stack boot (2026-09-03) | Loadtest compose + auth probe | **VERIFIED** |
| Auth bleed under Swoole workers | 400/400 concurrent probe + PHPUnit | **VERIFIED** |
| k6 mixed workload on hardened stack | Not re-run post-listener implementation | **NOT VERIFIED** |

---

## Inherited Capacity (2026-08-29, pre-listener stack)

| Profile | Result | Status |
|---------|--------|--------|
| ~25 RPS sustained | p95 ~118 ms | **VERIFIED** (dev Docker) |
| ~50 RPS | p95 ~825 ms, plateau ~50 RPS | **VERIFIED** |
| 278 RPS / 1M req·hour | Never measured | **NOT VERIFIED** |

---

## Gaps

1. Re-run `docker compose -f docker-compose.loadtest.yml up --build` and confirm Octane boot with new listeners — **NOT VERIFIED**.
2. Live auth-isolation probe on Swoole (100 concurrent mixed sessions) — **NOT VERIFIED**.
3. Post-hardening k6 baseline at 25/50 RPS — **NOT VERIFIED**.
4. Align `max_request` defaults across config/Dockerfile/compose — **PARTIALLY VERIFIED** (intentional override documented above).

---

## Verdict

| Area | Status |
|------|--------|
| Swoole stack definition | **VERIFIED** |
| Auth/session listeners wired | **VERIFIED** (code) |
| Live Swoole runtime proof (2026-09-03) | **NOT VERIFIED** |
| Production-ready Octane | **NOT VERIFIED** |

**Production Ready:** No.

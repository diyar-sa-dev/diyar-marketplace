# Auth & Session Concurrency Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Octane worker auth bleed, session persistence, dual-guard isolation

---

## Problem Statement

Laravel Octane keeps the application container alive across requests. Without explicit flush/persist, auth guards and session stores can leak identity between concurrent requests on the same Swoole worker.

---

## Implemented Controls (2026-09-03)

| Control | Path | Behavior | Status |
|---------|------|----------|--------|
| `FlushAuthAndSessionState` | `app/Listeners/Octane/FlushAuthAndSessionState.php` | `RequestReceived`: `Auth::forgetGuards()`, forget auth bindings, `session->forgetDrivers()`, forget `session.store` | **VERIFIED** |
| `PersistApplicationSession` | `app/Listeners/Octane/PersistApplicationSession.php` | `RequestTerminated`: save started session to Redis | **VERIFIED** |
| `EnsureCleanAuthState` | `app/Http/Middleware/EnsureCleanAuthState.php` | Pre-request guard reset when `LARAVEL_OCTANE=1`; skipped under PHPUnit | **VERIFIED** |
| Octane flush bindings | `config/octane.php` | `'flush' => ['auth', 'auth.driver', 'session.store']` | **VERIFIED** |
| Bootstrap wiring | `bootstrap/app.php` | Middleware prepended to API + web stacks | **VERIFIED** |
| Logout hardening | `app/Services/Identity/AuthService.php` | Remember token clear, session save, cookie forget | **VERIFIED** (code) |

**Design note:** Listener intentionally avoids `forgetInstance('session')` to prevent dual SessionManager instances (documented in class docblock).

---

## PHPUnit Evidence

| Test | File | Result | Status |
|------|------|--------|--------|
| Independent session cookies | `AuthSessionIsolationTest` | Pass | **VERIFIED** |
| Remember-me logout cannot restore stale cookie | `AuthSessionIsolationTest` | Pass | **VERIFIED** |
| Octane flush clears in-memory guard | `AuthSessionIsolationTest` | Pass (simulated `RequestReceived`) | **VERIFIED** |

```
AuthSessionIsolationTest: 3/3 pass
Full concurrency filter: 10/10 pass — see _raw/concurrency-tests-2026-09-03.txt
```

PHPUnit runs on **non-Octane** harness; listener unit behavior is simulated, not on a live Swoole worker.

---

## Live Probe Evidence

| Probe | Target | Status |
|-------|--------|--------|
| k6/curl concurrent mixed-auth on Swoole | 0 cross-user identity leaks | **NOT VERIFIED** |
| Admin + marketplace same worker | No guard cross-leak | **NOT VERIFIED** |
| Session fixation under worker reuse | Stable session ID + logout flush | **NOT VERIFIED** |
| Playwright E2E on Octane stack | Dual SPA isolation | **NOT VERIFIED** |

Prior Playwright `auth-isolation.spec.ts` passed on **artisan serve** (Phase 28.5/28.16) — **VERIFIED** (non-Octane only).

---

## Dual-Guard Baseline (non-Octane)

| Guard | Context | Prior evidence | Octane evidence |
|-------|---------|----------------|-----------------|
| `web` | Marketplace SPA | `AdminIsolationTest`, E2E | **NOT VERIFIED** |
| `admin` | Admin SPA | Same | **NOT VERIFIED** |
| Sanctum/token API | Stateless | PHPUnit auth suite | **PARTIALLY VERIFIED** |

---

## Acceptance Criteria vs Current State

| Criterion | Status |
|-----------|--------|
| All three controls implemented and registered | **VERIFIED** |
| `AuthSessionIsolationTest` 3/3 pass | **VERIFIED** |
| Live probe: 100 concurrent mixed-auth, 0 leaks | **NOT VERIFIED** |
| Production listener policy documented | **PARTIALLY VERIFIED** |

---

## Verdict

| Area | Status |
|------|--------|
| Code implementation | **VERIFIED** |
| PHPUnit isolation proof | **VERIFIED** (simulated Octane flush) |
| Live Swoole auth probe | **NOT VERIFIED** |
| Production-ready auth under Octane | **NOT VERIFIED** |

**Production Ready:** No.

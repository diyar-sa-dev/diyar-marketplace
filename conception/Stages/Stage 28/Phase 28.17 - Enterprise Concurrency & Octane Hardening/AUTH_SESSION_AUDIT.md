# Auth & Session Audit — Phase 28.17

**Date:** 2026-09-03  
**Phase:** 28.17 — Enterprise Concurrency & Octane Hardening  
**Scope:** Octane worker persistence vs marketplace/admin dual-guard auth

---

## Context

Laravel Octane keeps the application container alive across requests. Auth guards, session stores, and static OTP/provider state can leak between concurrent requests on the same worker unless explicitly flushed.

Prior phases verified **request-per-process** auth isolation (PHPUnit + Playwright). Phase 28.17 must prove the same under **Swoole workers**.

---

## Dual-Guard Model (baseline)

| Guard | Context | Prior evidence | Octane evidence |
|-------|---------|----------------|-----------------|
| `web` | Marketplace SPA | `AdminIsolationTest`, E2E 6/6 | **NOT VERIFIED** |
| `admin` | Admin SPA | Same | **NOT VERIFIED** |
| Sanctum/token API | Stateless | PHPUnit auth suite | **PARTIALLY VERIFIED** (non-Octane) |
| Session driver | Redis in loadtest | Integration tests | **PARTIALLY VERIFIED** |

Playwright `frontend/e2e/auth-isolation.spec.ts` — dual-session UI + API direct tests passed in Phase 28.5/28.16 on **artisan serve**, not Octane.

---

## Planned Octane Listeners (stash blueprint — not in repo)

| Class | Hook | Intended behavior | In repo? | Status |
|-------|------|-------------------|----------|--------|
| `FlushAuthAndSessionState` | `RequestReceived` | Reset auth/session before each request | **No** | **NOT VERIFIED** |
| `PersistApplicationSession` | `RequestTerminated` | Persist session mutations after response | **No** | **NOT VERIFIED** |
| `EnsureCleanAuthState` | (planned) | Post-request guard cleanup | **No** | **NOT VERIFIED** |

Stash also sets `octane.php` `'flush' => ['auth', 'auth.driver', 'session.store']` — requires listener cooperation; **not active in HEAD**.

---

## Services with Octane Risk

| Service | Risk | HEAD mitigation | Status |
|---------|------|-----------------|--------|
| `AuthService` | Guard/user cached on container | None Octane-specific | **NOT VERIFIED** |
| `EmailOtpService` / `OtpService` | Static/dev stores | Partial — dev flush via `FlushOctaneDevState` | **PARTIALLY VERIFIED** (dev only) |
| `LogSmsProvider` / `LogEmailOtpProvider` | Static arrays | `FlushOctaneDevState` (non-prod) | **VERIFIED** (dev) |
| Session middleware | Redis read/write per request | Standard Laravel | **PARTIALLY VERIFIED** |
| CSRF (`frontend/src/lib/csrf.ts`) | Cookie round-trip | Stash had tweaks; working tree may differ | **NOT VERIFIED** under Octane |

Stash modified `AuthService`, `session.php`, `bootstrap/app.php`, and `AuthenticationTest` — useful diff reference; **not applied**.

---

## Missing Test & Probe Artifacts

| Artifact | Purpose | Status |
|----------|---------|--------|
| `AuthSessionIsolationTest` | PHPUnit: User A request → User B must not see A's identity on same worker | **NOT VERIFIED** |
| Octane auth probe script | k6/curl: N concurrent sessions, assert `/api/v1/me` isolation | **NOT VERIFIED** |
| Admin/marketplace cross-leak probe | Same worker, alternating guards | **NOT VERIFIED** |
| Session fixation under reuse | Session ID stability + logout flush | **NOT VERIFIED** |

---

## Acceptance Criteria (28.17)

1. All three listener classes implemented, registered, and covered by unit tests.
2. `AuthSessionIsolationTest` passes in CI subset **and** manual Octane Docker run.
3. Live probe: 100 concurrent mixed-auth requests, 0 cross-user identity leaks.
4. Production listener policy documented (dev-only flush insufficient).

---

## Verdict

| Area | Status |
|------|--------|
| Classic (non-Octane) auth isolation | **VERIFIED** (prior phases) |
| Octane worker auth isolation | **NOT VERIFIED** |
| Session persistence correctness under Octane | **NOT VERIFIED** |
| Stash recovery for auth | **PARTIALLY VERIFIED** (incomplete) |

**Production Ready:** No.

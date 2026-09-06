# Octane + Swoole Full Codebase Audit — Phase 28.17

**Date:** 2026-09-03  
**Scope:** Entire Laravel `backend/app` runtime safety under FPM and Octane+Swoole  
**Method:** Static pattern search + targeted code review + PHPUnit + live Octane probe (no k6)

---

## Executive Summary

| Area | Finding | Status |
|------|---------|--------|
| Request-specific constructor injection | No `Request`/`Session`/`Guard` in service constructors | **VERIFIED** |
| Runtime `config([...])` mutation | None in `app/` | **VERIFIED** |
| Manual `DB::beginTransaction()` | None in `app/` — uses `DB::transaction()` | **VERIFIED** |
| Mutable static state (production) | Dev-only: `FakePaymentGateway`, `LogSmsProvider`, `LogEmailOtpProvider` — flushed by `FlushOctaneDevState` | **VERIFIED** |
| Singleton bindings | Infrastructure only (gateways, OTP, SMS) — stateless | **VERIFIED** |
| Auth/session isolation | Listeners + middleware + tests + live probe | **VERIFIED** |
| Locale isolation | `SetLocaleFromRequest` + `ResetRequestScopedState` + test | **VERIFIED** |
| Octane flush bindings | `auth`, `auth.driver`, `session.store` | **VERIFIED** |

**Verdict:** Codebase is **PREPARED** for Octane. Live multi-node and performance gates remain **NOT VERIFIED**.

---

## 1. Stateful Service Patterns

### Search: `singleton`, `bind`, `scoped`, `instance`

| Location | Bindings | Mutable state? | Verdict |
|----------|----------|----------------|---------|
| `AppServiceProvider` | OTP, SMS, AssemblyCalculator, Payment gateways | No request state | **Safe singleton** |
| `NotificationServiceProvider` | `PushProviderInterface` | Stateless | **Safe singleton** |

No `scoped()` bindings today. Business services resolve transiently via container auto-wiring — acceptable.

### High-risk domains reviewed

| Domain | State holder | Octane risk | Mitigation |
|--------|--------------|-------------|------------|
| Auth / current user | Laravel guards | Cross-request bleed | `FlushAuthAndSessionState`, `EnsureCleanAuthState`, Octane `flush` |
| Session | `SessionManager` | Dual manager if `forgetInstance('session')` | **Never** forget session instance; use `forgetDrivers()` |
| Cart | DB-backed (`CartService`) | Low if DB is authority | Row locks in cart mutations |
| Locale | `app()->getLocale()` | Leak between requests | `ResetRequestScopedState` on `RequestReceived` |
| Payment gateway clients | Singleton gateways | Must not store per-request headers | Gateways are stateless factories |
| Notification render context | Built per dispatch | Queue/HTTP separate workers | No singleton cache of user context |

---

## 2. Dependency Injection Audit

**Search:** constructor injection of `Request`, `Illuminate\Http\Request`, `Auth`, `Guard`, `Session`, `SessionManager`, `Application`, `Config`, current user models.

**Result:** **No unsafe constructor injection** found in `app/Services/**`.

Controllers and middleware correctly receive `Request` per dispatch — standard Laravel pattern.

---

## 3. Static State Audit

| File | Static property | Production? | Mitigation |
|------|-----------------|-------------|------------|
| `FakePaymentGateway` | `$referenceScenarios`, `$refundRequests` | Dev/test only | `FlushOctaneDevState` |
| `LogSmsProvider` | `$messages`, `$developmentOtps` | Dev only | `FlushOctaneDevState` |
| `LogEmailOtpProvider` | `$developmentOtps` | Dev only | `FlushOctaneDevState` |

No `private static $currentUser` or application-level in-memory caches in production services.

---

## 4. Authentication & Session Isolation

### Implementation

| Component | Hook | Action |
|-----------|------|--------|
| `FlushAuthAndSessionState` | `RequestReceived` | `Auth::forgetGuards()`, `session->forgetDrivers()` |
| `PersistApplicationSession` | `RequestTerminated` | `$session->save()` when started |
| `EnsureCleanAuthState` | Middleware (Octane only) | Guard reset when `LARAVEL_OCTANE=1` |
| `AuthService::logout` | Business | Remember token clear, cookie forget, session save |

### Evidence

| Test / probe | Result |
|--------------|--------|
| `AuthSessionIsolationTest` | 3/3 pass (PHPUnit) |
| Live Octane probe (4 workers, 400 concurrent checks) | 0 identity mismatches — `_raw/live-octane-auth-concurrency.txt` |

**Status:** **VERIFIED** (single-node Octane). Multi-node LB: **NOT VERIFIED**.

---

## 5. Localization Safety

| Layer | Behavior |
|-------|----------|
| `SetLocaleFromRequest` middleware | Sets locale from `Accept-Language` / user preference per request |
| `ResetRequestScopedState` | Resets to `config('app.locale')` at request start |
| `LocaleIsolationTest` | Simulates two Octane requests — locale does not leak |

**Status:** **VERIFIED** (PHPUnit). Live Octane locale probe: **NOT VERIFIED**.

---

## 6. Configuration Safety

No runtime `config([...])` mutations in application code.

Locale/currency must continue to use request middleware and explicit parameters — not global config mutation.

---

## 7. Database Connection Safety

Octane default listeners include `DisconnectFromDatabases` on `OperationTerminated`.

No open transactions survive requests (no manual `beginTransaction` without wrapper in app code).

**Status:** **VERIFIED** (pattern audit). Crash mid-transaction behavior: **PARTIALLY VERIFIED** (DB rollback on disconnect).

---

## 8. Cache Safety (spot check)

| Pattern | Example | Scoped? |
|---------|---------|---------|
| User dashboard | Keys include user/vendor/profile IDs | **Yes** |
| Catalog/home | Shared keys with stampede locks where needed | **Acceptable** |
| Health probe | Short TTL cache | **Global — intentional** |

No `Cache::remember('dashboard', ...)` without user scope found in money/auth paths.

---

## 9. External Clients

| Client | Binding | Request state retained? |
|--------|---------|-------------------------|
| `MyFatoorahGateway` | Singleton | **No** — configured from env |
| `PaymentGatewayManager` | Singleton | **No** — resolves gateway per call |
| SMS providers | Singleton factory | **No** |

---

## 10. Reverb / WebSocket

| Item | Status |
|------|--------|
| `config/reverb.php` + `ReverbAllowedOrigins` | **VERIFIED** (code) |
| Redis broadcasting for multi-node | **PREPARED** (config) |
| Reverb in loadtest compose | **NOT VERIFIED** |
| WS auth vs HTTP auth isolation | **PARTIALLY VERIFIED** (channel auth tests exist) |

---

## 11. Octane Worker Lifecycle

| Setting | Value | Notes |
|---------|-------|-------|
| `max_request` (config) | 1000 | `config/octane.php` |
| `--max-requests` (loadtest) | 2000 (env default) | Compose override |
| `garbage` | 50 | Octane GC threshold |
| `DisconnectFromDatabases` | Enabled | Per-operation |
| `CollectGarbage` | Enabled | Memory control |

Worker recycling is **PREPARED**. Memory leak soak: **NOT VERIFIED**.

---

## 12. FPM Compatibility

| Rule | Status |
|------|--------|
| Octane middleware inactive outside Octane | **VERIFIED** (`LARAVEL_OCTANE=1` gate) |
| Business logic does not depend on worker memory | **VERIFIED** |
| Same services under CLI/queue/tests | **VERIFIED** (PHPUnit uses non-Octane path) |

---

## Related Documents

- [OCTANE_SWOOLE_AUDIT.md](./OCTANE_SWOOLE_AUDIT.md) — stack-specific tuning
- [OCTANE_ARCHITECTURE_AUDIT.md](./OCTANE_ARCHITECTURE_AUDIT.md) — listener wiring
- [AUTH_SESSION_AUDIT.md](./AUTH_SESSION_AUDIT.md) — auth deep dive
- [FINDINGS_REGISTER.md](./FINDINGS_REGISTER.md) — P0–P3 table

---

## Verdict

| Certification level | Area |
|---------------------|------|
| **VERIFIED** | Auth/session/locale isolation code + single-node live auth |
| **PREPARED** | Full codebase static audit, worker recycling, Reverb config |
| **NOT VERIFIED** | Multi-node, k6, Reverb scale, memory soak |

**Production Octane certified:** No.

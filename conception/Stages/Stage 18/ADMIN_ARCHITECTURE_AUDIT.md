# Stage 18 — Admin Architecture Audit

**Date:** 2026-08-22  
**Auditor role:** Senior Staff Full-Stack / Security / Architecture  
**Rule:** **Code is the source of truth.** Documentation and completion reports may be stale.  
**Scope:** Phase 0 only — **no application code was modified during this audit.**

---

## Executive Summary

DIYAR Stage 18 is **partially started in uncommitted working tree work**, not in `git` HEAD (`0a16d23` — Stage 17.6). The repository has evolved significantly since `STAGE_18_ENTRY_AUDIT.md` was written (that document still claims “Filament not installed” and “no admin UI” — **both are now false or superseded in WIP**).

### Current state (verified in code)

| Area | Status |
|------|--------|
| **Identity** | ✅ Single `users` table — correct per Phase 1 |
| **Filament** | ⚠️ **Removed from `composer.json` in WIP** before API/UI parity — **violates Phase 27 strangler order** |
| **Admin React SPA** | ⚠️ **Shell only** — `/admin/login`, `/admin` dashboard placeholder |
| **Admin API** | ⚠️ **17 endpoints** — auth/session + categories CRUD + vendor/affiliate payouts |
| **Admin domain services** | ⚠️ **15 services exist**; most **not wired** to HTTP routes |
| **Granular permissions** | ⚠️ DB + enum + service exist; HTTP layer mostly uses `role:admin` only |
| **Session model** | ⚠️ **Single `web` guard + single session cookie** for both contexts — authorization split by middleware, **not** by separate sessions |
| **Stage 18 completion** | ❌ **Not complete** — see Phase 33 checklist at end |

### Critical architectural risks

1. **Filament removed before migration parity** — 32 Filament resources had no React/API equivalents when removed.
2. **Shared session cookie** — Marketplace logout and Admin logout both call `AuthService::logout()` → **full session invalidation** (Scenarios E/F fail isolation goal).
3. **`admin` guard is dead code** — config exists; runtime uses `web` only.
4. **Frontend route guards incomplete** — `canAccessPath()` blocks admin-only paths in helpers but **`ProtectedRoute` does not enforce it**.
5. **Docs vs code drift** — multiple Stage 18 completion reports claim done work that is WIP/uncommitted or removed (Filament).

---

## Git History Audit

### Committed baseline (HEAD)

```
0a16d23 Stage 17.6: Affiliate Changes, UI design polish
207b76c feat(stages): complete Stages 16–17.6 notifications, chat, and affiliate commerce
c46630e feat(stage-2): implement identity, authentication, RBAC and security foundation
```

**No committed Stage 18 admin/Filament/React-admin commits** appear in recent history. Admin foundation, Filament build-out, Filament removal, and React Admin SPA exist primarily as **uncommitted changes** (`git status` 2026-08-22).

### Why the architecture looks the way it does

| Period | Evidence | Architectural intent |
|--------|----------|----------------------|
| Stage 2 (`c46630e`) | `users`, `roles`, `user_roles`, Sanctum, `EnsureUserHasRole` | Unified identity + RBAC for marketplace |
| Pre–Stage 18 HEAD | Thin `/api/v1/admin/categories` + payout endpoints | JSON admin API without UI |
| Stage 18 WIP (uncommitted) | Filament resources added then **removed**; React `/admin/*` added; `AdminPermission` tables; 15 `Admin*Service` classes | Pivot from Filament panel → React Admin SPA |
| Recent session WIP | `AdminAuthController`, `AdminSessionController`, marketplace login returns generic `auth.failed` for admin-only | Separate **login endpoints**, shared **session** |

### Uncommitted Stage 18 artifacts (partial list)

**Backend (?? untracked):** `AdminPermission.php`, migrations, seeders, `AdminAuditLog`, `Services/Admin/*`, admin controllers, `tests/Feature/Admin/*`, `lang/*/admin.php`, leftover `lang/*/filament-panels/`

**Frontend (?? untracked):** `frontend/src/admin/*`, `frontend/src/api/adminAuth.ts`

**Removed in WIP (no longer in tree):** `app/Filament/`, `AdminPanelProvider`, Filament from `composer.json`

**Stale docs (modified, claim completion):** `Phase 18.1/18.2 COMPLETION_REPORT.md`, `STAGE_18_COMPLETION_REPORT.md` — **must not be treated as verified until code + QA pass Phase 33.**

---

## Phase 0 — Architecture Questionnaire (46 Answers)

Each answer cites **current code behavior**. “WIP” = uncommitted working tree unless noted.

### Identity & authorization model

**1. What is the current identity model?**  
Single Eloquent model `App\Models\User` (UUID PK). All actors share `users`. Related: `addresses`, `vendorAccount`, `providerAccount`, roles via pivot. File: `backend/app/Models/User.php`.

**2. What is the current role model?**  
Pivot `user_roles` (`user_id`, `role_id`, `status`). Roles table with `RoleName` enum: `customer`, `vendor`, `provider`, `marketer`, `admin`. Migration: `2026_08_16_000001_create_roles_tables.php`.

**3. What is the current permission model?**  
Admin-only granular permissions: `permissions` + `role_permissions` tables (WIP migration `2026_08_22_090000`). Keys from `AdminPermission` enum (~40 cases). Seeded onto admin role via `AdminPermissionSeeder`. Resolved by `AdminPermissionService` with cache.

**4. What authentication guards exist?**  
`web` and `admin` — both session drivers, same `users` provider. Config: `backend/config/auth.php`. **`web` is the only guard used at runtime.**

**5. What does Sanctum do?**  
Enables stateful SPA cookie auth on API routes via `EnsureFrontendRequestsAreStateful`. Checks `web` guard only (`config/sanctum.php` → `'guard' => ['web']`). Issues API tokens via `HasApiTokens` but SPA uses session cookies, not bearer tokens in frontend.

**6. What does the current admin guard do?**  
**Nothing in runtime.** No routes use `auth:admin`. `EnsureAdminUserIsActive` references `auth('admin')` but is **not registered** in `bootstrap/app.php`. Leftover from Filament era.

**7. How does Filament authenticate?**  
**Filament is removed (WIP).** Previously used `admin` guard + Livewire session at `/admin`. Static assets remain under `backend/public/css|js|fonts/filament/`.

**8. How does React Marketplace authenticate?**  
`POST /api/v1/auth/login` → `AuthService::attempt()` → `Auth::guard('web')->login()` + session regenerate. Session refresh: `GET /api/v1/auth/me` (inside `marketplace.access` group). Frontend: `AuthContext` + `api/auth.ts`, CSRF via `/sanctum/csrf-cookie`.

**9. How does React Admin authenticate?**  
`POST /api/v1/admin/auth/login` → `AuthService::attemptForAdminPanel()` → same `web` guard + `establishSession()`. Session refresh on `/admin/*` paths: `GET /api/v1/admin/session`. Frontend: `adminAuth.ts`, `AdminLoginPage`, `AuthContext` branch on `pathname.startsWith('/admin')`.

**10. Which cookies/sessions/tokens are used?**  
- `{app}-session` cookie (database session driver, 120 min, path `/`, SameSite `lax`, HttpOnly)  
- `XSRF-TOKEN` for CSRF  
- **No separate admin cookie**  
- **No auth tokens in localStorage** (verified in frontend auth modules)

**11. What domains/subdomains are assumed?**  
Same-origin SPA model. `SANCTUM_STATEFUL_DOMAINS` defaults include `localhost`, `localhost:3000`, `127.0.0.1:8000`, app URL. `.env.example` adds `localhost:5173`. **No `admin.diyar.com` split documented in code** — single domain assumed.

**12. How is CSRF handled?**  
Laravel Sanctum CSRF cookie + `X-XSRF-TOKEN` header on mutating requests. `apiClient` in `frontend/src/api/client.ts` attaches token; 419 retry with cookie refresh.

**13. How is logout handled?**  
Both `POST /api/v1/auth/logout` and `POST /api/v1/admin/auth/logout` call **`AuthService::logout()`** → `web` guard logout + **session invalidate**. Marketplace logout route is inside `marketplace.access` (admin-only cannot reach it). Admin logout is under `role:admin`.

**14. How is session expiration handled?**  
Session lifetime 120 minutes (`config/session.php`). Sanctum `AuthenticateSession` middleware configured. No custom frontend idle timeout beyond failed `/me` or `/admin/session` → unauthenticated state.

**15. How is admin authorization enforced?**  
Route stack: `auth:sanctum` → `account.active` → `role:admin` → controller/policy. `AdminSessionController` re-checks `MarketplaceAccess::canAccessAdminPanel()`. Granular `AdminPermissionService::has()` used in some services (e.g. `AdminReturnService`) but **not consistently on HTTP layer**.

**16. How is marketplace authorization enforced?**  
`auth:sanctum` → `account.active` → `marketplace.access` (blocks admin-only) → route-specific `role:vendor|provider|…` → policies.

**17. Can Admin access marketplace APIs?**  
- **Admin-only:** ❌ Authenticated marketplace routes blocked by `EnsureMarketplaceAccess` (403). Public catalog/cart routes ✅.  
- **Admin + partner role:** ✅ Passes `canAccessMarketplace()`. Test: `AdminIsolationTest::test_dual_role_admin_vendor_can_access_marketplace_and_admin_api`.

**18. Can marketplace users access Admin APIs?**  
❌ Without `admin` role → `role:admin` middleware 403. Verified for vendor in `AdminIsolationTest`.

**19–21. Can Admin access vendor/provider/affiliate APIs?**  
- **Admin-only:** ❌ Partner dashboard APIs 403 (`/dashboard/vendor/access`, etc.).  
- **Admin + that partner role:** ✅ Same as dual-role user.

**22. Can Admin become a customer accidentally?**  
**Not via role assignment on login.** Admin-only accounts do not gain `customer` role automatically. **However**, if an admin-only user navigates to a marketplace `ProtectedRoute` page (e.g. `/checkout`), the route guard does **not** block them — only API calls fail. Frontend gap.

**23. Can Admin appear in customer profile?**  
Admin-only hitting `/profile` API → 403. Frontend `CustomerProfileRoute` redirects non-customers to account hub → `/admin` for admin-only. **Public profile UI mostly blocked; not all routes guarded.**

**24–26. Can Admin appear in affiliate/vendor/provider dashboards?**  
Admin-only: `DashboardLayout` redirects to `/403`. Sidebar/dashboard links hidden via `shouldShowStorefrontDashboardLink`. **Direct URL to `/dashboard/*` blocked at layout, not all nested routes individually tested.**

**27. Can customer access `/admin`?**  
React: `ProtectedAdminRoute` → `/403` if authenticated without admin role; `/admin/login` if guest. API: 403 on `/admin/*`.

**28–30. Can vendor/provider/marketer access `/admin`?**  
Same as customer — need `admin` role. Partner role alone ❌.

**31. Can an account have multiple roles?**  
✅ Yes — `user_roles` pivot allows multiple rows. Tests attach admin + vendor.

**32. Admin + vendor?**  
✅ Supported. Marketplace + admin API both accessible. Frontend shows partner dashboard **and** admin panel link. **No explicit context switch UI** — same session, user chooses navigation.

**33. Admin + marketer?**  
✅ Possible in schema; same dual-access pattern as admin+vendor if both roles active.

**34. Admin logs into marketplace login?**  
**Admin-only + correct credentials:** `AuthService::attempt()` logs out and throws **`auth.failed`** (generic — security fix in WIP). **Does not reveal admin-only status.**  
**Dual-role admin+vendor:** ✅ Marketplace login succeeds.

**35. Customer logs into admin login?**  
`attemptForAdminPanel()` requires `canAccessAdminPanel()` → fails with **`auth.failed`** (generic). Does not reveal whether email exists.

**36. Admin opens public store?**  
✅ Public routes (`/`, `/product/*`, `/services`, etc.) work without marketplace auth. Store chrome visible except on `/admin/*` paths.

**37. Admin opens `/profile`?**  
Admin-only: API 403; frontend redirects via account hub logic. **Direct navigation may render some profile routes before API failure** — depends on route wrapper.

**38. Admin opens `/dashboard`?**  
Admin-only: `DashboardLayout` → `/403`. `canAccessPath` returns false.

**39. Admin opens `/dashboard/affiliate`?**  
Same — blocked at dashboard layout for admin-only.

**40. Admin calls `/api/v1/admin/*`?**  
✅ With active admin role + Sanctum session. Admin-only verified in tests.

**41. Customer calls `/api/v1/admin/*`?**  
❌ 403 (no admin role) or 401 (guest).

**42. Vendor calls admin endpoint?**  
❌ 403 — `AdminIsolationTest`.

**43. Marketplace + Admin open in same browser?**  
**Same `laravel_session` cookie.** One authenticated user at a time. Logging in on one context **replaces** session user. **Not two parallel sessions.**

**44. Can sessions/cookies collide?**  
**They are the same session.** Not a collision — **shared by design today.** Subdomain cookie scope not split (`SESSION_DOMAIN` null).

**45. Can Admin session accidentally authenticate marketplace requests?**  
**Dual-role:** ✅ Yes — intended. **Admin-only:** Session exists but `marketplace.access` returns 403 on protected marketplace APIs. **Public marketplace pages still load.**

**46. Can marketplace auth accidentally authenticate Admin requests?**  
Any user with `admin` role + valid session can call admin APIs — regardless of which login endpoint was used. User without admin role ❌ even with marketplace session.

---

## Phase 1 — Identity Architecture Decision

**Decision: KEEP single `users` table.** ✅ Already implemented.

No `admin_users` table exists or is needed for current threat model. Separation is achieved via:

- `MarketplaceAccess` helper (`backend/app/Support/Identity/MarketplaceAccess.php`)
- Route middleware (`marketplace.access` vs `role:admin`)
- Frontend role helpers (`isAdminOnlyAccount`, `ProtectedAdminRoute`)

**Do not create duplicate identity** unless future SSO mandates separate IdP claims — document deferred.

---

## Phase 2–9 — Application & Session Isolation

### Target vs actual

| Principle | Target | Actual (code) |
|-----------|--------|----------------|
| Two SPAs | Marketplace + Admin | ✅ React routes exist |
| Two login endpoints | `/auth/login` + `/admin/auth/login` | ✅ WIP |
| Two authorization contexts | Marketplace roles vs Admin permissions | ⚠️ Middleware split; **same session** |
| Separate sessions | Scenarios E/F independent logout | ❌ **Shared session invalidate** |
| Separate guards | Optional | ❌ `admin` guard unused |

### Session scenario matrix (Phase 8)

| Scenario | Expected (spec) | Actual behavior |
|----------|-----------------|-----------------|
| A — Customer logged in, open `/admin/login` | Admin login establishes Admin context | New login **replaces session user** on same cookie. Prior customer session **overwritten** if different credentials. |
| B — Admin logged in, open `/login` | Must not become marketplace customer | Admin-only: `GuestRoute` redirects to `/admin`. **Does not auto-create customer role.** Dual-role: marketplace login allowed. |
| C — Customer opens `/admin` | 401/403 or admin login | ✅ Redirect to `/admin/login` or `/403` |
| D — Admin + Customer simultaneous | Sessions must not confuse | **Single session — only one user identity at a time.** |
| E — Logout marketplace, admin stays | Independent | ❌ **Both die** — same `AuthService::logout()` invalidates session |
| F — Logout admin, marketplace stays | Independent | ❌ **Same failure** |

### Cookie / domain (Phase 9)

| Setting | Value |
|---------|-------|
| `SESSION_DRIVER` | database |
| `SESSION_DOMAIN` | null (current host only) |
| `SESSION_PATH` | `/` |
| `SESSION_SAME_SITE` | lax |
| `SANCTUM_STATEFUL_DOMAINS` | localhost variants + app URL |

**Production risk:** If marketplace and admin were on different subdomains without adjusting Sanctum/stateful domains, cookie auth would break — **not configured today.**

---

## Phase 10–21 — Admin UI & API (Current Coverage)

### Filament status (Phase 27 deviation)

| Item | Status |
|------|--------|
| `filament/filament` in composer | ❌ Removed (WIP) |
| `app/Filament/` | ❌ Deleted |
| Filament tests | ❌ Deleted |
| Public filament assets | ⚠️ Still present |
| `lang/*/filament-panels/` | ⚠️ Still present |
| React Admin parity | ❌ **~5%** (login + placeholder dashboard) |

**Verdict:** Filament removed **before** strangler migration completed — **must be treated as architectural debt**, not success.

### Admin API endpoints wired (actual)

```
POST /admin/auth/login                    (public)
GET  /admin/session                       (auth + admin)
POST /admin/auth/logout                   (auth + admin)
GET|POST|PATCH|DELETE /admin/categories/*
GET /admin/payouts + approve/reject/mark-paid
GET /admin/affiliate/payouts + lifecycle actions
```

**Total: 17 routes.** All other Stage 18 resources have **service classes only** — no HTTP controllers/routes.

### Admin React SPA (actual)

| Route | Component | Status |
|-------|-----------|--------|
| `/admin/login` | `AdminLoginPage` | ✅ Functional |
| `/admin` | `AdminDashboardPage` | ⚠️ Placeholder cards |
| All other `/admin/*` | — | ❌ 404 → marketplace `NotFoundPage` |

**Permissions from `/admin/session`:** returned by API, **ignored by frontend**.

### Admin services exist but unwired (sample)

`AdminUserService`, `AdminOrderService`, `AdminProductService`, `AdminReturnService`, `AdminCouponService`, `AdminReviewModerationService`, `AdminVendorAccountService`, `AdminProviderAccountService`, `AdminAffiliateProfileService`, `AdminAffiliateLinkService`, `SystemSettingService`, `AdminAuditService`, etc.

### Known frontend defects (audit-only, not fixed)

1. `App.tsx` line ~345 uses `env.adminPanelUrl` in header **without importing `env`** — runtime error risk on admin panel link in desktop nav.
2. `ProtectedRoute` does not call `isAdminOnlyAccount` / `canAccessPath`.
3. Admin permissions unused in UI gating.
4. Placeholder copy references Filament migration (Phase 13 violation).
5. `(قريباً)` sidebar items (Phase 12 violation).

---

## Phase 22–23 — Permissions & Audit

| Layer | Status |
|-------|--------|
| `AdminPermission` enum + DB seed | ✅ WIP |
| `AdminPermissionService` | ✅ Cached resolution |
| HTTP enforcement | ⚠️ Mostly `role:admin` + policies checking `hasRole('admin')` |
| Frontend UX gating | ❌ Not implemented |
| `AdminAuditService` | ✅ Exists + tests for redaction |
| Audit on all mutations | ⚠️ Wired in services; not all routes exist |

**Policy note:** `User::hasRole()` ignores pivot `status`; `MarketplaceAccess::hasActiveRole()` respects it — **potential inconsistency** if role suspended but still attached.

---

## Phase 29–30 — Security Test Matrix (automated coverage)

| Test file | Covers |
|-----------|--------|
| `AdminIsolationTest` | Admin-only marketplace block, admin API allow, dual-role, generic failed marketplace login |
| `AdminSpaAuthTest` | Admin login/session, suspended admin, permissions in session payload |
| `AdminSecurityHardeningTest` | Permission stripping, vendor blocked from admin API |
| `AdminFoundationTest` | Audit redaction, permission seeding |
| `SystemSettingServiceTest` | Settings service (not full HTTP) |
| `CategoryAdminTest` | Category CRUD authorization |

**Not automated today:** Session isolation scenarios A–F, frontend route matrix, IDOR across all resources, full Phase 31 UI QA.

---

## Phase 33 — Final Acceptance Checklist (honest status)

| Item | Status |
|------|--------|
| Architecture audited | ✅ This document |
| Git history audited | ✅ |
| Identity model verified | ✅ Single `users` |
| Admin authentication verified | ⚠️ WIP — works for login/session; shared session |
| Marketplace authentication verified | ✅ |
| Admin/Marketplace isolation verified | ⚠️ API strong; frontend gaps; shared logout |
| Session isolation verified | ❌ **Fails E/F; shared cookie** |
| Cookie/domain isolation verified | ⚠️ Same-origin only documented |
| Admin API coverage complete | ❌ ~5% of Stage 18 resources |
| Dashboard complete | ❌ Placeholder |
| All admin resources (users…settings) | ❌ |
| Vendor/provider/user workspaces | ❌ |
| Admin login/logout/profile/language/topbar/sidebar | ⚠️ Login only; shell sidebar |
| Arabic/English, RTL/LTR, responsive, a11y | ⚠️ Partial on login only |
| Performance/security reviewed | ❌ Phase 18.4 docs exist; not re-verified post-migration |
| Full backend tests pass | ⚠️ 30 admin tests pass in WIP; full suite not run in audit |
| Frontend typecheck/build | ❌ Not run in audit; `env` bug in App.tsx |
| Filament removed | ⚠️ **Yes — prematurely** |
| Manual QA completed | ❌ |
| Documentation finalized | ❌ Stale reports contradict code |

**Stage 18 status: NOT COMPLETE / NOT VERIFIED**

---

## Recommended correction order (implementation phases — not started)

1. **Freeze architecture docs** — mark old completion reports as superseded by this audit.
2. **Fix session model decision** — either accept single session + document, or implement true context isolation (separate cookies/guards) before scaling admin UI.
3. **Remove dead code** — `admin` guard, `EnsureAdminUserIsActive`, Filament assets/lang leftovers.
4. **API-first expansion** — wire existing `Admin*Service` classes to controllers with `AdminPermission` checks.
5. **Aggregated dashboard endpoint** — real metrics, no mocks.
6. **Complete React Admin** — sidebar, topbar, resources, workspaces (Phases 12–19).
7. **Harden frontend guards** — `ProtectedRoute` + admin-only path blocking; permission-aware nav.
8. **Remove developer copy** — Filament/migration strings (Phase 13).
9. **Security matrix automation** — session scenarios, IDOR suite.
10. **Manual QA + update Phase 32 docs** — only after Phase 33 checklist passes.

---

## Appendix A — Key file reference

| Concern | Path |
|---------|------|
| Identity access rules | `backend/app/Support/Identity/MarketplaceAccess.php` |
| Marketplace login | `backend/app/Services/Identity/AuthService.php` → `attempt()` |
| Admin login | `backend/app/Services/Identity/AuthService.php` → `attemptForAdminPanel()` |
| API routes | `backend/routes/api.php` |
| Sanctum | `backend/config/sanctum.php` |
| Session | `backend/config/session.php` |
| Role middleware | `backend/app/Http/Middleware/EnsureUserHasRole.php` |
| Marketplace block | `backend/app/Http/Middleware/EnsureMarketplaceAccess.php` |
| Frontend roles | `frontend/src/lib/auth/roles.ts` |
| Admin SPA routes | `frontend/src/App.tsx` |
| Admin auth client | `frontend/src/api/adminAuth.ts` |
| Auth context | `frontend/src/context/AuthContext.tsx` |

---

## Appendix B — Documentation drift warning

The following documents **contradict the codebase** and must be rewritten after implementation, not trusted today:

- `STAGE_18_ENTRY_AUDIT.md` — claims no Filament, no admin UI, no SystemSetting
- `Phase 18.1/18.2 COMPLETION_REPORT.md` — claim Filament resources complete
- `STAGE_18_COMPLETION_REPORT.md` — claims Stage 18 complete

**This audit supersedes them for architectural truth as of 2026-08-22.**

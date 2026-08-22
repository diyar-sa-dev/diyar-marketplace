# Stage 18 — Admin Implementation Audit

**Date:** 2026-08-22  
**HEAD (committed):** `0a16d23` Stage 17.6  
**Working tree:** Stage 18 WIP (uncommitted)  
**Rule:** Code is truth; this document drives implementation order.

---

## Executive Summary

| Layer | Exists | Functional | Missing |
|-------|--------|------------|---------|
| Identity (`users` + roles + permissions) | ✅ | ✅ | — |
| Admin domain services (15) | ✅ WIP | ⚠️ Partial | HTTP wiring |
| Admin API routes | ⚠️ 17 | ✅ Categories + payouts | ~30 resource groups |
| Auth isolation (web vs admin guard) | ⚠️ Config only | ❌ Shared web session | **Fix in 18.4.1** |
| React Admin SPA | ⚠️ Shell | ⚠️ Login only | All resources |
| Filament | ❌ Removed | — | Cleanup assets/lang |
| Tests | ⚠️ 30 admin tests | ✅ Isolation basics | Session matrix, UI |

**Stage 18 status:** IN PROGRESS — not COMPLETE / VERIFIED.

---

## Implementation Matrix

| Area | Existing | Broken | Missing | Reuse | Change | Tests |
|------|----------|--------|---------|-------|--------|-------|
| **Auth — marketplace** | `AuthService::attempt`, Sanctum web | Logout invalidates whole session | — | Keep | Split logout | ✅ partial |
| **Auth — admin** | `attemptForAdminPanel`, `/admin/auth/*` | Uses **web** guard not admin | Admin guard session | Keep endpoints | **admin guard login/logout** | ⚠️ update |
| **Session isolation** | Single cookie | E/F fail | Independent contexts | Laravel dual guard | **No session invalidate on logout** | ❌ add |
| **Admin permissions** | Enum + DB + service | HTTP uses `role:admin` only | `EnsureAdminPermission` | `AdminPermissionService` | Middleware | ⚠️ partial |
| **Admin audit** | `AdminAuditService` + model | — | HTTP coverage | All admin mutations | Wire services | ✅ redaction |
| **System settings** | Model + service + seeder | — | Admin API + UI | `SystemSettingService` | Controllers | ✅ service |
| **Categories API** | Full CRUD | — | React UI | `CategoryController` | List page | ✅ API |
| **Payouts API** | Vendor + affiliate | — | React UI | Existing controllers | List pages | ✅ API |
| **Users** | `AdminUserService` | — | API + UI + workspace | Service | Controller | ❌ |
| **Vendors/Providers** | Suspend services | — | API + UI + workspace | Services | Controllers | ❌ |
| **Orders/Products/…** | Domain services | — | All layers | `Admin*Service` | Full stack | ❌ |
| **Dashboard** | Placeholder React | Fake copy | Aggregated API | DB models | `AdminDashboardService` | ❌ |
| **React shell** | Login + layout stub | `env` bug in App.tsx | Sidebar, topbar, nav | Tailwind tokens | Full shell | ❌ |
| **i18n** | admin.* keys | Filament migration text | Resource labels | Locale system | Remove dev copy | — |
| **Filament cleanup** | Removed from composer | — | public assets, lang | — | Delete | — |

---

## Milestone Plan (dependency order)

1. **18.4.1** Auth/session isolation ← **current**
2. **18.4.2** Admin API core (dashboard, permission middleware, users/vendors/providers index)
3. **18.4.3** React Admin shell (AdminAuthProvider, design tokens, nav)
4. **18.4.4–18.4.6** Resource parity (iterative)
5. **18.4.7–18.4.11** UX, security, performance, QA, docs

---

## Reuse List (do NOT duplicate)

- `App\Services\Admin\*` — all admin mutations
- `App\Services\Order\*`, `PayoutService`, `InventoryService`, etc. — domain layer
- `App\Policies\*` — extend with `AdminPermission` checks where needed
- `App\Support\Identity\MarketplaceAccess` — context rules
- `frontend/src/api/client.ts` — CSRF + axios (admin uses same origin)
- `frontend/src/lib/i18n/*` — locale/RTL

---

## Dead Code to Remove

- `EnsureAdminUserIsActive` session invalidate (fix, keep middleware)
- `public/css|js|fonts/filament/*`
- `lang/*/filament-panels/*`
- `tools/fix-admin-table-defaults.php` (Filament refs)
- Placeholder i18n (Filament, قريباً)

---

## Security Risks (pre-fix)

1. Shared web session for admin + marketplace login
2. Full session invalidate on marketplace logout kills admin
3. `ProtectedRoute` does not block admin-only on `/checkout` etc.
4. `hasRole()` ignores pivot status in middleware
5. Admin permissions not enforced on HTTP layer

---

## Test Gaps

- Session isolation E/F (marketplace logout vs admin logout)
- Full permission matrix per endpoint
- IDOR on all resources
- Frontend route guards
- Manual QA matrix (Phase 33)

---

*Updated during Stage 18 implementation. Supersedes stale completion reports until Phase 33 gate passes.*

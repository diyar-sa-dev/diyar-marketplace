# Stage 19 — Route Guards

## Implementation

| Route prefix | Guard | Auth source | Role check |
|--------------|-------|-------------|------------|
| `/admin/*` | `ProtectedAdminRoute` | `AdminAuthContext` / `/api/v1/admin/session` | Admin role + permissions |
| `/customer/*`, `/profile/*`, `/checkout/*` | `ProtectedRoute` | `AuthContext` / `/api/v1/auth/me` | Authenticated marketplace user |
| `/dashboard/vendor/*` | `ProtectedRoute` | `AuthContext` | `RoleName.Vendor` |
| `/dashboard/provider/*` | `ProtectedRoute` | `AuthContext` | `RoleName.Provider` |
| `/dashboard/affiliate/*` | `ProtectedRoute` | `AuthContext` | `RoleName.Marketer` |

## Rules

1. **Never use pathname alone** as authentication truth.
2. **Admin sessions** do not satisfy marketplace `ProtectedRoute` — admin-only accounts are blocked at `/api/v1/auth/me` (`AdminIsolationTest`).
3. **Marketplace sessions** do not satisfy `ProtectedAdminRoute`.
4. Role checks are **additive** to authentication — `hasRole()` runs only after `isAuthenticated`.
5. Account status redirects (`pending`, `suspended`) apply before role checks.

## Backend mirror

- `EnsureMarketplaceAccess` — blocks admin-only users from marketplace APIs.
- `EnsureUserHasRole` — vendor/provider/marketer dashboard routes.
- `EnsureAdminPermission` — granular admin operations.

## Tests

- `frontend/src/components/routes/routes.test.tsx`
- `frontend/src/context/AuthContext.test.tsx`
- `frontend/src/admin/auth/AdminAuthContext.test.tsx`
- `backend/tests/Feature/Admin/AdminIsolationTest.php`

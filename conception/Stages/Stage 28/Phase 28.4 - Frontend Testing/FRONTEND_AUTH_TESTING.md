# Phase 28.4 — Frontend Authentication Testing

---

## Auth contexts

| Context | File | Surface |
|---------|------|---------|
| Marketplace | `context/AuthContext.tsx` | Cookie session, `/auth/me` |
| Admin | `admin/auth/AdminAuthContext.tsx` | `/admin/session` |

---

## Automated evidence

### Vitest

| Test file | Tests | Result |
|-----------|-------|--------|
| `AuthContext.test.tsx` | 5 | **PASS** (act() warnings) |
| `AdminAuthContext.test.tsx` | 2 | **PASS** |
| `routes.test.tsx` | 6 | **PASS** |

Behaviors verified:
- Loading state while session checked (Arabic loading text)
- Unauthenticated → redirect `/auth`
- Pending user → `/account/pending`
- Guest route redirects authenticated users
- Vendor registration link → vendor B2B dashboard
- Logout clears session
- Unauthorized event clears session

### Playwright

| Spec | Result |
|------|--------|
| `auth-isolation.spec.ts` (6 tests) | **6/6 PASS** |
| Dual marketplace/admin sessions isolated | PASS |
| Logout preserves other session | PASS |
| Refresh preserves identity | PASS |
| API: admin cannot access marketplace `/me` | PASS |
| API: customer cannot access admin session | PASS |

---

## Role-based UI routing

| Role | Dashboard entry | Guard |
|------|-----------------|-------|
| customer | Profile, orders, checkout | `CustomerProfileRoute` |
| vendor | `/dashboard/vendor/*` | `ProtectedRoute roles={[Vendor]}` |
| provider | `/dashboard/service/*` | `ProtectedRoute roles={[Provider]}` |
| marketer | `/dashboard/affiliate/*` | `ProtectedRoute roles={[Marketer]}` |
| admin | `/admin/*` only — **blocked from marketplace `/auth/me`** | `AdminIsolation` (backend + UI) |

---

## Scenarios NOT fully E2E tested

| Scenario | Status |
|----------|--------|
| Expired session mid-checkout | **NOT VERIFIED** |
| Token refresh (N/A — session cookies) | N/A |
| Direct URL to `/dashboard/vendor` as customer | Partial — route guard source exists |

---

## Gate

```text
PASS
```

Route guards and admin/marketplace separation have strong automated coverage.

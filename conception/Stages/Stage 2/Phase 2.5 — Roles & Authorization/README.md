# Phase 2.5 — Roles & Authorization

> **Status:** COMPLETE / FINALIZED

## Objective

Server-side role enforcement, ownership policies, and IDOR protection for identity account stubs.

## Implemented Functionality

- Roles: `customer`, `vendor`, `provider`, `marketer`, `admin`
- Registration role keys mapped server-side (`merchant` → `vendor`, `service_provider` → `provider`)
- `EnsureUserHasRole` middleware
- `VendorAccountPolicy`, `ProviderAccountPolicy`
- Ownership routes:
  - `GET /api/v1/vendor/accounts/{vendorAccount}`
  - `GET /api/v1/provider/accounts/{providerAccount}`
- Admin bypass on role middleware where configured
- Frontend dashboard RBAC:
  - `getAccessibleDashboardPortals()`
  - Single-role auto-entry; multi-role portal picker
  - Role switcher limited to user's roles
  - `/403` on unauthorized portal URLs

## Architecture

```text
Request → auth:sanctum → role middleware (optional) → controller
Ownership routes → policy → owner or admin only
```

## Important Decisions

- Authorization is **server-side**; frontend RBAC is UX-only
- Customer role does not gate storefront browsing in Stage 2
- Dashboard URL segments: `vendor`, `service` (provider), `affiliate` (marketer)

## API / Frontend Impact

- `ProtectedRoute` with optional `roles` prop
- Forbidden → `/403` with status page template

## Security Considerations

- IDOR tests for vendor/provider account endpoints
- Admin role not self-assignable via registration
- Pivot role status returned in API but full approval workflow deferred

## Tests

- `OwnershipAuthorizationTest.php`
- `frontend/src/lib/auth/roles.test.ts`
- `frontend/src/components/routes/routes.test.tsx`

## Current Limitations

- Role status (`pending`/`suspended`) not fully enforced on every dashboard action
- No admin UI for role approval

## Completion Status

**FINALIZED**

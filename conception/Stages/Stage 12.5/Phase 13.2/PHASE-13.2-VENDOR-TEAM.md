# Phase 13.2 — Vendor Team & RBAC

> **Status:** Implemented

## Roles

| Role | Scope |
|------|--------|
| `owner` | Store account holder — full access |
| `manager` | Products (no delete), orders, finance read, no settings/team |
| `customer_service` | Reviews reply, read-only products/orders |

## Backend

- `VendorTeamService` — list, invite, update role, remove (transactional)
- `VendorTeamRoleSync` — grant vendor role on accept; revoke on last-team removal if `vendor_role_granted`
- `VendorAccessService` — resolve account/role; multi-membership safe queries
- `VendorTeamPermissions` — permission matrix for dashboard
- Table: `vendor_team_members` + `vendor_role_granted` column

## Frontend

- `/dashboard/vendor/team` — invite, role change, remove
- `/team-invite?token=` — accept/reject flow
- Sidebar nav filtered by `GET /dashboard/vendor/access` permissions

## Security

- On removal: DB transaction + `VendorTeamRoleSync` revokes `vendor` role when user has no own store and no other active team membership
- Store owners (`vendorAccount` present) always keep the role

## Tests

- `VendorTeamTest` — 12 cases including role lifecycle

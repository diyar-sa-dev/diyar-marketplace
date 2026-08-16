# Phase 2.1 — Identity Model

> **Status:** COMPLETE / FINALIZED

## Objective

Establish UUID-based identity tables, role catalog, and account ownership stubs for vendors and service providers.

## Implemented Functionality

- `users` table — UUID PK, phone (unique), optional email, password, status enum, verification timestamps
- `roles` + `user_roles` pivot with pivot status (`pending`, `active`, `suspended`, `rejected`)
- `vendor_accounts` and `provider_accounts` ownership stubs (UUID PK, linked to user)
- Eloquent models: `User`, `Role`, `UserRole`, `VendorAccount`, `ProviderAccount`
- Enums: `UserStatus`, `RoleName`, `RoleStatus`
- `UserResource` exposes roles when loaded
- Seeders: `RoleSeeder`, `AdminSeeder`

## Architecture

```text
User (1) ──< user_roles >── (N) Role
User (1) ── (0..1) VendorAccount
User (1) ── (0..1) ProviderAccount
```

All primary keys are UUIDs. No OTP data is stored in the database.

## Important Decisions

- Phone is the primary identity anchor for Saudi market registration
- Roles are assigned **after** OTP verification, not at register time
- Vendor/provider account rows are created only when the verified user requested those roles

## API / Frontend Impact

- `GET /api/v1/auth/me` returns user + roles array
- Frontend `AuthUser` type mirrors `UserResource`

## Security Considerations

- `$fillable` guarded; mass assignment limited
- Admin role cannot be self-registered

## Tests

- Covered indirectly via registration, authentication, and ownership feature tests
- Migration assertions in `RegistrationTest::test_otp_verifications_table_does_not_exist`

## Current Limitations

- Role approval workflow (pending → active by admin) is schema-ready but not operational in UI
- Email is optional at registration

## Completion Status

**FINALIZED** — migrations and models verified in repository.

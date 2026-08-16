# Phase 2.6 — Frontend Authentication

> **Status:** COMPLETE / FINALIZED

## Objective

Replace mock auth UX with real Sanctum session integration, protected routing, and auth API client.

## Implemented Functionality

- `AuthContext` + `useAuth` hook
- `frontend/src/api/auth.ts` — register, login, logout, me, OTP, password recovery
- `frontend/src/lib/csrf.ts` — CSRF cookie bootstrap
- `AuthPage` — login, register, OTP, forgot, reset flows
- Phone/email login switcher
- `SaudiPhoneInput`, password strength field, role selection at register
- `ProtectedRoute`, `GuestRoute`
- Profile pages wired to session (`ProfilePage`, `SecurityPage`, etc.)
- Dashboard avatar links to `/profile` for all authenticated roles

## Architecture

```text
AuthProvider → AuthContext → pages/components
Axios client (credentials + CSRF + Accept-Language)
TanStack Query available; auth uses direct API calls in context
```

## Important Decisions

- No token persistence in browser storage
- Post-auth redirect uses `resolveDashboardEntryPath()` based on roles
- Auth field direction follows locale (RTL/LTR)

## API / Frontend Impact

- All Stage 2 auth endpoints consumed from SPA
- Vite proxy in dev for same-origin API

## Security Considerations

- 401 interceptor clears session
- Client validation is UX-only; server remains authoritative

## Tests

- `AuthContext.test.tsx`
- `routes.test.tsx`
- `validation.test.ts`

## Current Limitations

- Profile sub-pages still largely mock data for non-auth fields
- Marketplace pages remain mock catalog data

## Completion Status

**FINALIZED**

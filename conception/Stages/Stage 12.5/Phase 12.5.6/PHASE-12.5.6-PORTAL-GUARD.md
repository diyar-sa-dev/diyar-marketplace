# Phase 12.5.6 — Portal Access Guard & Session Sync

> **Status:** Implemented (2026-08-18 rev 2)

## Problem

Removed team members kept stale `vendor` role client-side → `ProtectedRoute` allowed dashboard → `/access` returned 403 → soft `navigate()` looped back to vendor paths via `resolvePostAuthPath()`.

## Solution

1. **Backend:** `VendorTeamRoleSync` removes `vendor` role when no store account + no active membership (no `vendor_role_granted` flag required).
2. **Frontend:** `VendorPortalGuard` on 403:
   - Cancel + **remove** vendor query caches
   - `refreshUser()` from `/auth/me`
   - `stripVendorRole()` client-side as safety net
   - Toast: *لم يعد لديك صلاحية الوصول إلى لوحة التاجر*
   - **`window.location.replace('/profile')`** for customer accounts (hard redirect)

## Files

- `VendorPortalGuard.tsx`
- `VendorTeamRoleSync.php`

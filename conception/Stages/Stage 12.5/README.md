# Stage 12.5 — Identity, Vendor Team & Marketplace Engagement

> **Date started:** 2026-08-18  
> **Status:** **IN PROGRESS** (core deliverables implemented; sign-off pending)  
> **Previous stage:** [Stage 12 — Vendor Portal Completion](../Stage%2012/README.md) — COMPLETE  
> **Next stage:** [Stage 13 — Service Marketplace](../Stage%2013/README.md) — NOT STARTED

---

## Stage objective

Extension to Stage 12: email identity, vendor teams with RBAC, preorders, notification preferences, and storefront/dashboard polish.

---

## Phases

| Phase | Document | Status |
|-------|----------|--------|
| 12.5.1 Email & transactional mail | [Phase 13.1/PHASE-13.1-EMAIL-AND-MAIL.md](./Phase%2013.1/PHASE-13.1-EMAIL-AND-MAIL.md) | Implemented |
| 12.5.2 Vendor team & RBAC | [Phase 13.2/PHASE-13.2-VENDOR-TEAM.md](./Phase%2013.2/PHASE-13.2-VENDOR-TEAM.md) | Implemented |
| 12.5.3 Product preorders | [Phase 13.3/PHASE-13.3-PREORDERS.md](./Phase%2013.3/PHASE-13.3-PREORDERS.md) | Implemented |
| 12.5.4 Store engagement & UX | [Phase 13.4/PHASE-13.4-STORE-ENGAGEMENT.md](./Phase%2013.4/PHASE-13.4-STORE-ENGAGEMENT.md) | Implemented |
| 12.5.5 Notification preferences | [Phase 13.5/PHASE-13.5-NOTIFICATION-PREFERENCES.md](./Phase%2013.5/PHASE-13.5-NOTIFICATION-PREFERENCES.md) | Implemented |
| 12.5.6 Portal access guard | [Phase 13.6/PHASE-13.6-PORTAL-GUARD.md](./Phase%2013.6/PHASE-13.6-PORTAL-GUARD.md) | Implemented |

Supporting artifacts:

- [STAGE_12.5_PROGRESS_REPORT.md](./STAGE_12.5_PROGRESS_REPORT.md)
- [TEST-RESULTS.md](./TEST-RESULTS.md)

---

## Key fixes (2026-08-18 follow-up)

### Backend — team removal role sync

`VendorTeamRoleSync::onMembershipDeactivated()` now **always removes** the `vendor` role when:

- user has **no** `vendorAccount` (not a store owner), and
- user has **no** active team membership

Store owners (registration vendors with `vendorAccount`) keep the role.

### Frontend — portal redirect loop

`VendorPortalGuard` on 403:

1. Cancels + removes all vendor React Query caches
2. Refreshes user from `/auth/me`
3. Strips stale `vendor` role client-side if API still returns it
4. Shows toast: *"لم يعد لديك صلاحية الوصول إلى لوحة التاجر"*
5. **`window.location.replace('/profile')`** — hard redirect (fixes stuck "جاري تحويلك..." loop)

---

*Maintained by development team.*

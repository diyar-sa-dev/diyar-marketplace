# Phase 18.4B — Detail-Page UX

**Status:** Pending (after 18.4A shell polish)  
**Prerequisite:** Operational relation managers exist (functional ✅)

## Purpose

Turn Vendor, Provider, and User **view** pages into operational command centers — not infolist + raw relation-manager tabs.

## Target layouts

### Vendor

```
┌──────────────────────────────────────────┐
│ Profile / status / actions               │
├──────────────────────────────────────────┤
│ Profile │ Products │ Orders │ Finance    │
│ Payouts │ Reviews │ Affiliate │ Activity │
├──────────────────────────────────────────┤
│        Active selected tab panel         │
└──────────────────────────────────────────┘
```

### Provider

```
Profile │ Services │ Requests │ Bookings │ Reviews │ Activity
```

### User

```
Profile │ Roles │ Orders │ Reviews │ Bookings │ Activity
```

## Work items

- [ ] Profile header block (status badges, key metrics, safe actions)
- [ ] Tab strip styling aligned with DIYAR theme (18.4A CSS)
- [ ] Finance tab: summary blocks via `VendorBalanceService` (not table description only)
- [ ] Empty/loading/error states per tab
- [ ] Drill-down links to standalone resources preserved

## Acceptance

- [ ] Each entity view feels like one operational workspace
- [ ] Tabs are permission-aware and domain-scoped (already enforced in code)
- [ ] No cosmetic-only tabs — each tab shows real scoped data

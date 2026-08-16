# Phase 3.2 — Addresses

**Status:** IMPLEMENTED / VERIFIED — WAITING FOR PO REVIEW

## Objective

User-owned shipping addresses with CRUD and single default address.

## Delivered

- `addresses` migration + `Address` model
- REST endpoints under `/api/v1/profile/addresses`
- IDOR protection (403 on cross-user access) — incl. set-default
- Default address logic with transactions + row locking
- `/profile/addresses` API-connected UI (AR/EN, RTL breadcrumbs, +966 phone display)

## Tests

- `backend/tests/Feature/Api/V1/Profile/AddressTest.php`

## Audit

See [STAGE_3_AUDIT_REPORT.md](../STAGE_3_AUDIT_REPORT.md)

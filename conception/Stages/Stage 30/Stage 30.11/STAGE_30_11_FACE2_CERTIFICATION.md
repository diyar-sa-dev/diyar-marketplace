# Stage 30.11 — Face 2 Certification

**Date:** 2026-09-19

## Findings resolved in Face 2

| ID | Sev | Attack | Expected | Actual (before fix) | Fix | Regression |
|----|-----|--------|----------|---------------------|-----|------------|
| F2-01 | P1 | Customer POST try-in-room | 201 | 403 (`ProductPolicy::view` vendor-only) | Removed product `authorize('view')`; rely on `publiclyVisible()` in service | `TryInRoomTest::user_can_upload_*` |
| F2-02 | P1 | Create job after upload | DB rows | 500 NOT NULL `user_id` (empty `$fillable`) | Model fillable/guarded alignment | PHPUnit create test |
| F2-03 | P2 | Duplicate queue worker while processing | No spurious failed | Illegal transition → `markFailed` risk | `markProcessing` idempotent when already `processing` | queue idempotency manual review |

## Open / accepted (not P0/P1)

| ID | Sev | Item | Status |
|----|-----|------|--------|
| F2-04 | P2 | Idempotency race (two parallel same key) | Accepted — unique constraint + rare double upload |
| F2-05 | P3 | No EXIF stripping | Documented deferral |
| F2-06 | P3 | No scheduled cleanup | Documented deferral |

## Security matrix

| Area | Evidence | Status |
|------|----------|--------|
| Authentication | guest tests | VERIFIED |
| Authorization (IDOR) | `idor_poll_returns_not_found` | VERIFIED |
| Upload validation | invalid type test + ImageGuard | VERIFIED |
| Mass assignment | client status test | VERIFIED |
| Rate limiting | limiters registered | VERIFIED (not load-tested) |
| Job lifecycle | upload + dispatchSync | VERIFIED |
| Path traversal | server-generated paths | VERIFIED (inspection) |
| Cleanup | TTL column only | VERIFIED WITH LIMITATIONS |

**Certification:** VERIFIED WITH LIMITATIONS (no E2E run; cleanup/EXIF deferred).

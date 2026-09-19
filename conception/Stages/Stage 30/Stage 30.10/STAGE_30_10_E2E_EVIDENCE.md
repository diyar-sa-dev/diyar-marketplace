# Stage 30.10 — E2E Evidence

**Date:** 2026-09-19

## Spec added

`frontend/e2e/room-designer.spec.ts`

| Test | Intent |
|------|--------|
| API unauthenticated | 401/403 on list |
| API auth lifecycle | create → update → 409 conflict → cross-user 404 |
| UI desktop | `/profile/room-designer` auto-create + shell + canvas |
| UI tablet 900px | catalog panel visible |
| UI mobile 390px | catalog sheet + Escape closes |

## Infrastructure

- E2E bootstrap (`scripts/e2e/bootstrap-backend.sh`) sets `DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=true` for CI/local seeded runs
- Playwright CI starts backend + preview (existing `playwright.config.ts`)

## Local execution (this certification run)

```text
Result: NOT RUN — backend health at 127.0.0.1:8000 unreachable from agent environment
```

Specs skip gracefully when backend unavailable (`backendReachable` helper).

## NOT VERIFIED in E2E (by design / tooling limits)

- Fabric canvas drag / rotate gestures
- Full catalog search → add product → move → undo → save → reload → cart confirm
- Physical mobile devices

## Recommended CI verification

```bash
cd frontend && npm run test:e2e -- e2e/room-designer.spec.ts
```

(with Redis + seeded backend per existing E2E scripts)

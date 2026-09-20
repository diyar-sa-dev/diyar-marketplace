# Staging — Room Designer checklist (PS30-4)

Use with Stage 23 staging stack (`docker-compose.staging.yml`, `.env.staging.example`).

## Flags (default safe)

```text
DIYAR_FEATURE_ROOM_DESIGNER_ENABLED=false
DIYAR_FEATURE_ROOM_DESIGNER_AI_SPATIAL_ENABLED=false
DIYAR_FEATURE_TRY_IN_ROOM_ENABLED=false
DIYAR_FEATURE_AI_VISUALIZATION_ENABLED=false
DIYAR_VISUALIZATION_DRIVER=null
```

Enable selectively for QA; **do not** enable external OpenAI while legal approval is **PENDING**.

## Smoke

1. `scripts/staging/smoke.sh` — includes room-designs 401/403 gate
2. With flag on + demo customer: create → PUT save → 409 on stale version
3. `suggest-layout` returns 403 when AI spatial sub-flag off

## E2E

Playwright `room-designer.spec.ts` against staging URLs — **NOT VERIFIED** unless CI/staging host configured.

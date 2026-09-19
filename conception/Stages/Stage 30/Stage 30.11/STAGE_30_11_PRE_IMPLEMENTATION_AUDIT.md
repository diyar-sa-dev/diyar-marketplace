# Stage 30.11 — Try in My Room Foundation — Pre-Implementation Audit

**Date:** 2026-09-19  
**Authority:** `RoomDesigner/IMPLEMENTATION_ROADMAP.md`, `RoomDesigner/API_CONTRACT.md`

## Architecture

Separate async pipeline from `RoomDesignDocument` / spatial engine:

```text
POST upload (multipart) → TryInRoomImageGuard → private disk
  → try_in_room_source_images + try_in_room_jobs (queued)
  → ProcessTryInRoomJob (queue, afterCommit)
  → VisualizationProviderInterface → StubVisualizationProvider
  → GET poll (owner-only, bounded JSON)
```

Room design reference optional via `POST /room-designs/{id}/try-in-room` (same upload + job row).

## Data model

| Table | Role |
|-------|------|
| `try_in_room_source_images` | Private object metadata (user-scoped path) |
| `try_in_room_jobs` | Lifecycle, idempotency, product/design FKs, JSON stub result |

## State machine

`queued` → `processing` → `completed` | `failed` (strict enum transitions; client cannot set status).

## API matrix

| Method | Path | Auth | Rate limit |
|--------|------|------|------------|
| POST | `/api/v1/products/{product}/try-in-room` | Sanctum | 10/hour (`try-in-room-create`) |
| POST | `/api/v1/room-designs/{id}/try-in-room` | Sanctum + room designer | 10/hour |
| GET | `/api/v1/try-in-room/{jobId}` | Sanctum owner | 60/min (`try-in-room-poll`) |

Feature flag: `diyar.feature.try_in_room_enabled` (`DIYAR_FEATURE_TRY_IN_ROOM_ENABLED`, default **false**).

## Security model

- Server-side image validation (MIME + `getimagesize`, dimensions, pixels, size).
- Storage path `{userId}/{uuid}.{ext}` — no client path control.
- IDOR: `findOwned` → 404 for other users.
- Mass assignment: sensitive job fields guarded; tests assert client cannot set `status` / `user_id`.
- No raw image in `RoomDesignDocument`.

## Idempotency

Optional `idempotency_key` (max 128) with unique `(user_id, idempotency_key)`.

## Cleanup / retention

`expires_at` on jobs (default 72h). **Automated orphan sweeper deferred** — documented operational risk for 30.12+.

## EXIF / metadata

**Deferred:** no strip in 30.11; private storage only; no metadata in API responses.

## Test strategy

PHPUnit feature (flag, upload, queue, IDOR, idempotency, validation). Vitest (client file validation). Regression: Room Design 21 + room-designer 84.

## Acceptance criteria

1. Upload + private storage + job row + poll + stub worker wired under `/api/v1`.
2. Flag off → 403.
3. No P0/P1 security defects known after Face 2.
4. Production flags remain off by default.

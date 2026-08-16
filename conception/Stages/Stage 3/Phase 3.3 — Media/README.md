# Phase 3.3 — Media

**Status:** COMPLETE / FINALIZED

## Objective

Reusable media upload abstraction; profile avatar as first consumer.

## Delivered

- `config/diyar_media.php` + `media` filesystem disk
- `MediaUploadService` (validation, safe paths, delete, disk abstraction)
- `POST/DELETE /api/v1/profile/avatar`
- `UserAvatar` — initials fallback, `onDark`/`sm`, circular loading/hover overlays
- Dev delivery: `storage:link`, Vite `/storage` proxy, `resolveMediaUrl()`

## Storage path

`users/{user_uuid}/avatar/{uuid}.{ext}` on configurable disk (local now, S3-ready).

## Tests

Avatar upload/delete/MIME rejection in `ProfileTest.php`

## Audit

See [STAGE_3_AUDIT_REPORT.md](../STAGE_3_AUDIT_REPORT.md)

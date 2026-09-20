# PS30-3 — Test Evidence

**Date:** 2026-09-20

## Environment

| Field | Value |
|-------|--------|
| OS | Windows 10 (local dev) |
| PHP | 8.x (local; sodium ext warning in CLI) |
| Laravel | **13.26.1** |
| Database | SQLite `:memory:` (PHPUnit RefreshDatabase) |
| Measurement | PHPUnit `DB::getQueryLog()`, `hrtime` wall clock |

## PHPUnit — save path

Command:

```bash
cd backend && php artisan test tests/Feature/Api/V1/RoomDesign/RoomDesignSavePerformanceTest.php
```

| Test | Result |
|------|--------|
| `put_save_query_count_empty_document_is_bounded` | PASS — total queries **≤ 12**, wall **< 5000 ms** (local sqlite smoke) |
| `put_save_product_lookup_is_batch_not_n_plus_one` | PASS — **≤ 2** `products` SELECTs for 25 items (batch `whereIn`) |
| `concurrent_stale_version_second_writer_gets_409` | PASS |

Full RoomDesign feature folder:

```bash
php artisan test tests/Feature/Api/V1/RoomDesign
```

**33/33 PASS** (includes PS30-3 tests)

## Code change (query budget)

- `RoomDesignDocumentService::replaceDocument` returns locked model after `save()` instead of `fresh()` — removes one redundant SELECT per PUT.

## Frontend autosave

Existing Vitest (`roomDesignAutosave.test.ts`): debounce, coalesce, conflict no-reschedule — **131/131** room-designer Vitest (full suite).

## k6

Script: `scripts/performance/room-design-save-smoke.js`

**Execution: NOT VERIFIED** (requires running API + auth + `room_designer_enabled`).

## Production / 25K

```text
NOT VERIFIED
```

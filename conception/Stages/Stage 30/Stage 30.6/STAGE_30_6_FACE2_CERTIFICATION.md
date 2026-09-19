# Stage 30.6 — Face 2 Certification

**Date:** 2026-09-19  
**Overall:** **VERIFIED WITH LIMITATIONS**

---

## Adversarial matrix

| Attack / scenario | Result | Evidence |
|-------------------|--------|----------|
| User B reads/updates/deletes User A design | **Blocked (404)** | `RoomDesignTest::test_idor_returns_not_found` |
| Stale `expected_version` after newer save | **409, DB unchanged** | `test_stale_save_cannot_overwrite_newer_version` |
| Negative room dimensions | **422** | `test_malformed_document_rejected` |
| Unknown product UUID | **422** | `test_invalid_product_uuid_rejected` |
| Published product UUID | **201** | `test_visible_product_uuid_accepted` |
| Feature disabled | **403** | `test_feature_flag_disabled_returns_forbidden` |
| List payload bloat | **No document in list** | `test_list_returns_lightweight_items_without_full_documents` |
| Rapid save abuse | Rate limit registered | `room-design-save` 30/min/user |
| Mass assignment `user_id` | Not in request rules; model guarded | Service sets `user_id` |
| Save failure retains dirty (client) | **PASS** | `roomDesignAutosave.test.ts` ERROR + dirty |
| Edits during in-flight save | **PASS** | autosave test keeps dirty + reschedules |
| Debounce pointer storm | **PASS** | single save after 2.5s idle |

---

## Not fully verified (documented)

| Item | Status |
|------|--------|
| Integer `product_id` vs catalog UUID | **LIMITATION** — 30.7 |
| Production latency p95 PUT | **NOT MEASURED** (local sqlite only) |
| Playwright E2E save/reload | **NOT RUN** (no routed UI yet) |
| Full suite `php artisan test` | **NOT RUN** (room-design subset only) |

---

## Certification statement

Persistence API, ownership, optimistic concurrency, server validation, debounced client autosave, and bounded list projections are **VERIFIED** with PHPUnit/Vitest evidence above.

Stage **30.6** gate: **VERIFIED WITH LIMITATIONS** until 30.7 product-id alignment and production perf smoke.

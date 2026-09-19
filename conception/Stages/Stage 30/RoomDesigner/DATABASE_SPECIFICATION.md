# Database Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Design choice

**V1:** Single-table document storage (aligns with DIYAR JSON metadata patterns e.g. `LoyaltyTransaction.metadata`).

Normalized `room_design_items` table is **deferred** until query requirements exist (reporting, SQL analytics).

---

## Table: `room_designs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | FK users | indexed |
| `title` | string(255) | nullable |
| `document` | JSON | authoritative spatial doc |
| `schema_version` | unsigned smallint | denormalized from document for indexing |
| `version` | unsigned int | optimistic concurrency, default 1 |
| `item_count` | unsigned smallint | denormalized for list UI |
| `created_at` / `updated_at` | timestamps | |
| `deleted_at` | timestamp nullable | soft delete |

**Indexes:**

- `(user_id, updated_at DESC)` — list designs
- `(user_id, id)` — policy lookups

**No** public sharing columns in V1.

---

## Table: `try_in_room_jobs` (30.11+)

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | |
| `user_id` | FK | |
| `product_id` | FK | |
| `upload_path` | string | private disk |
| `status` | enum/string | |
| `provider` | string nullable | |
| `result_path` | string nullable | |
| `error_code` | string nullable | |
| `metadata` | JSON nullable | timings, no image bytes |
| `expires_at` | timestamp nullable | |
| timestamps | | |

Index: `(user_id, created_at)`.

---

## Document size limit

**512 KiB** (524288 bytes) UTF-8 JSON after normalization.

**Rationale:**

- ~100 items × ~2–3 KiB snapshot ≈ 200–300 KiB + room overhead << 512 KiB
- Below typical MySQL `max_allowed_packet` defaults when bundled with HTTP overhead
- PHP `memory_limit` headroom for validation duplicate

Adjust only via DECISION_LOG + load test evidence.

---

## Migrations

- Stage **30.6** only (after approval)
- Rollback: drop tables; no catalog FK beyond `product_id` validation at app layer

---

## Backup / DR

Designs are user data — include in standard MySQL backup. No separate store V1.

# Stage 30.11 — Post-Implementation Hardening Audit

**Date:** 2026-09-19  
**Scope:** Re-certify 30.11 before migration approval and 30.12 entry. **No 30.12 work. No production migration executed.**

## 1. Historical plan comparison

| Intent (roadmap 30.11) | Current code | Verdict |
|------------------------|--------------|---------|
| Upload + private storage + job + poll + stub | Implemented | Match |
| No external AI | `StubVisualizationProvider` only | Match |
| Separate from spatial engine | No `RoomDesignDocument` image bytes | Match |
| `try_in_room_enabled` flag | Middleware + config default false | Match |
| 10/hour create, poll limits | Rate limiters registered | Match |
| Signed `result_url` when complete | Stub returns `result_url: null` | Deferred (30.12+) |
| `ai_visualization_enabled` for provider | Not wired in 30.11 | Correct deferral |

## 2. 30.12 boundary review

No `VisualizationService`, capability model, quotas, or real providers added. Single interface + stub only.

## 3. Database / migration audit

**Tables:** `try_in_room_source_images`, `try_in_room_jobs`

| Check | Result |
|-------|--------|
| UUID PKs | Yes |
| User FK cascade delete | Yes |
| Source image FK cascade | Yes |
| Product/design FK | **No FK** (nullable UUID refs — loose coupling; stale IDs possible) |
| Unique `(user_id, idempotency_key)` | Yes (multiple NULL keys allowed) |
| Indexes | user+status, user+created_at, user+created_at on sources |

**Lifecycle on delete:** User delete cascades jobs + source rows; files may remain on disk (orphan files — operational cleanup deferred).

**Migration test:** PHPUnit `RefreshDatabase` (sqlite) applies full chain including 30.11; schema assertion test added. **MySQL production instance not migrated** (connection refused — intentional).

**Rollback:** `down()` drops jobs then sources — safe on empty DB; not executed against shared dev DB.

## 4. Security findings (Face 1)

| ID | Sev | Issue | Fix |
|----|-----|-------|-----|
| H-01 | P1 | Same idempotency key, different product returned wrong job | 409 `idempotency_conflict` |
| H-02 | P1 | `status` mass-assignable via `$fillable` | Removed; server `forceFill` only |
| H-03 | P2 | Race on unique idempotency insert | Catch `UniqueConstraintViolationException`, reconcile |
| H-04 | P2 | Expired jobs stayed queued/processing | `expireIfNeeded` on poll/worker |
| H-05 | P2 | Worker completed when source file missing | Fail with `source_missing` |
| H-06 | P2 | Worker rethrow caused pointless retries after terminal fail | Swallow after `markFailed` |
| H-07 | P3 | EXIF/GPS retained in private uploads | GD re-encode strips metadata on store |

## 5. Storage / privacy

- Private disk, server paths only.
- EXIF stripped via re-encode when GD available (fallback: raw bytes if no GD — test env requires GD).

## 6. Queue / state machine

- Transitions enforced in enum + idempotent `markProcessing`.
- `afterCommit` dispatch preserved.
- Timeout 120s, 3 tries.

## 7. Cleanup / retention

`expires_at` enforced logically (failed + `expired` error). **No sweeper command** — P2 operational debt documented for post-30.11 ops.

## 8. Tests added

`TryInRoomSecurityTest`, `TryInRoomJobServiceStateTest`; expanded coverage for 409, traversal filename, poll leakage, expiry, missing source, schema.

## 9. Migration readiness

**READY WITH LIMITATIONS** — validated on sqlite via test suite; MySQL-specific verification and rollback on shared DB not executed.

## 10. 30.12 entry

**READY WITH LIMITATIONS** — foundation hardened; signed URLs, provider service, and automated cleanup remain out of scope.

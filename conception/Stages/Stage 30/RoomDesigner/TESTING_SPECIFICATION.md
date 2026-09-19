# Testing Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Evidence labels

Use: **VERIFIED | PARTIALLY VERIFIED | NOT VERIFIED | NOT FOUND | UNKNOWN | BLOCKED | PREPARED**

---

## Unit tests

### Spatial (Vitest / optional PHP mirror)

| Case | |
|------|---|
| cm → m conversion | boundary 0, large |
| Room boundary BLOCK | item partially outside |
| Negative coordinates | rejected |
| Rotation 0/90/45 | OBB overlap |
| Zero / tiny dimensions | validation error |
| Very large room (30 m) | still valid |
| Overlap detection | WARN flag |
| Locked item move | rejected |
| Duplicate command | two items |
| Undo/redo | 50 cap drops oldest |
| CLEAR_ROOM | empty items |
| SET_ROOM_SIZE | clamp items or shift — define in 30.2 |
| Schema version unsupported | migrate or fail |

Consider property-based tests for geometry (fast-check) — **PREPARED**.

---

## Integration (PHPUnit)

- CRUD designs + policy
- 409 version conflict
- 422 invalid document / item cap
- add-to-cart skips OOS
- Feature flag middleware 404 when disabled

---

## Frontend

- Command reducer tests without DOM
- Save debounce mock (fake timers)
- Renderer adapter mocked in UI tests

---

## E2E (Playwright)

1. Create → add product → move → save → reload
2. Offline save retry (network offline API)
3. Try-in-room happy path (staging provider mock)

---

## Performance

- k6: PUT design at 10 RPS alongside mixed catalog — **30.10**
- Bundle analyze artifact committed to certification folder

---

## Failure matrix

| Condition | Expected behavior |
|-----------|-------------------|
| MySQL down | Save ERROR, local retained |
| Redis down | Queue jobs fail; designer still works |
| AI unavailable | Try-in-room fails gracefully; designer OK |
| Catalog timeout | Toast, retry catalog |
| Cart timeout | Show error, design intact |
| Network offline | LOCAL state, queue PUT |
| Refresh mid-edit | beforeunload warn if dirty |
| Deleted product | Item flagged missing |
| OOS | Cart skip with message |
| Expired session | Prompt login, preserve localStorage backup **PREPARED** |
| Version conflict | 409 UI |
| Invalid document server reject | 422, do not wipe canvas |

No silent data loss.

---

## Spatial test matrix (required)

All rows in user §46 covered in unit suite checklist above.

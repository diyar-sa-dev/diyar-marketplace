# Stage 30.11 — Post-Implementation Face 2

**Date:** 2026-09-19

## Attacks and outcomes

| Attack | Expected | Actual (after hardening) | Severity | Regression test |
|--------|----------|------------------------|----------|-----------------|
| Idempotency key reuse, different product | 409 conflict | 409 `idempotency_conflict` | P1 (fixed) | `idempotency_key_reused_for_different_product_returns_conflict` |
| Path traversal filename | Safe user prefix path | Path `{userId}/{uuid}.ext` | — | `malicious_filename_does_not_escape` |
| IDOR poll | 404 | 404 | — | existing `idor_poll_returns_not_found` |
| Poll JSON leakage | No storage paths | No path strings in JSON | — | `poll_response_does_not_expose_storage_internals` |
| Expired queued job | Not processed as success | `failed` + `expired` on poll | P2 (fixed) | `expired_queued_job_is_marked_failed_on_poll` |
| Missing source at worker | `failed` / `source_missing` | Marked failed, no throw loop | P2 (fixed) | `worker_marks_job_failed_when_source_file_missing` |
| Duplicate worker processing | Idempotent processing state | `markProcessing` no-op when processing | P2 (fixed) | `TryInRoomJobServiceStateTest` |
| Rapid poll / 429 | Rate limit | Limiters present; not load-tested | P3 | NOT VERIFIED |
| E2E PDP flow | Full journey | Backend not running locally | — | NOT VERIFIED |

**Unresolved P0/P1:** none known after fixes.

**Certification:** VERIFIED WITH LIMITATIONS (E2E, MySQL migration on real instance, automated cleanup sweeper).

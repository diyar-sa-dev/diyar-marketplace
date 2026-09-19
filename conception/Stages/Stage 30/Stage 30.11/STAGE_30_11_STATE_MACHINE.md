# Stage 30.11 — Job state machine (authoritative)

## Status enum (API + DB)

Only four values exist in `TryInRoomJobStatus`:

```text
queued | processing | completed | failed
```

There is **no** separate `expired` status.

## Expiry semantics

When `expires_at` is in the past and the job is still `queued` or `processing`:

- Service transitions to **`failed`**
- `error_code` = **`expired`**

Clients see `status: "failed"` and may inspect `error_code`.

## Legal transitions

```text
queued       → processing | failed
processing   → completed  | failed
completed    → (terminal)
failed       → (terminal)
```

`failed` includes business codes: `expired`, `source_missing`, `processing_failed`.

## Worker claim

Only one worker may run the provider: atomic `queued → processing` via `claimForProcessing()`.

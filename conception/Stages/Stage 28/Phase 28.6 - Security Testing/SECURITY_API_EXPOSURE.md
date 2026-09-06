# Phase 28.6 — Security API Data Exposure

---

## Model serialization

| Field | Protection |
|-------|------------|
| `User.password` | `$hidden` |
| `remember_token` | `$hidden` |
| Payment card PAN | Not stored in DIYAR fake gateway flow |

---

## Resource inspection (sample)

`ProfileResource` exposes `status`, `roles` — intentional for session user only.

---

## Error responses

| Code | Checked |
|------|---------|
| 422 validation | Standard Laravel envelope — no stack trace |
| 401/403 | Generic messages |
| 500 | **NOT VERIFIED** under APP_DEBUG=false |

Local `.env`: `APP_DEBUG=true` — stack traces possible in dev only.

---

## Gaps

| Area | Status |
|------|--------|
| Every admin list endpoint field audit | **NOT VERIFIED** |
| Internal path leakage in media URLs | Partial |
| PII in analytics exports | **NOT VERIFIED** |

---

## Gate

```text
PARTIAL
```

No password/hash leakage in tested paths; exhaustive response audit incomplete.

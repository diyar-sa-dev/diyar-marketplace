# API Contract

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)  
**Base:** `/api/v1` · JSON · Sanctum bearer/cookie per existing SPA

---

## Room designs

All routes gated by `diyar.feature.room_designer_enabled` middleware + policy.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/room-designs` | List current user's designs (paginated) |
| POST | `/room-designs` | Create with full `document` |
| GET | `/room-designs/{id}` | Get design + document + `version` |
| PUT | `/room-designs/{id}` | Replace document (autosave) |
| PATCH | `/room-designs/{id}` | Optional metadata only (title) |
| DELETE | `/room-designs/{id}` | Soft or hard delete — **PREPARED:** soft delete with `deleted_at` |

### Create body

```json
{
  "title": "غرفة المعيشة",
  "document": { "schema_version": 1, "room": { ... }, "items": [] }
}
```

### Update body (PUT)

```json
{
  "expected_version": 12,
  "document": { ... }
}
```

### Response (resource)

```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "version": 13,
    "document": { ... },
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```

### Errors

| HTTP | Code | When |
|------|------|------|
| 401 | — | Unauthenticated |
| 403 | — | Policy / feature disabled |
| 404 | — | Not found or not owner |
| 409 | `version_conflict` | `expected_version` mismatch |
| 422 | `validation_failed` | Schema, size, item cap, invalid product |
| 413 | `payload_too_large` | Document > 512 KiB |

409 body example:

```json
{
  "message": "Version conflict",
  "code": "version_conflict",
  "server_version": 13,
  "data": { "id": "...", "version": 13, "updated_at": "..." }
}
```

Client strategy: show merge dialog or force reload — **PREPARED** UX in 30.6.

---

## Cart from design

| Method | Path | Description |
|--------|------|-------------|
| POST | `/room-designs/{id}/add-to-cart` | Body: `{ "item_ids": ["uuid", ...] }` optional; default all eligible |

Response: standard cart summary resource + `skipped[]` with `{ product_id, reason: 'out_of_stock' | 'not_found' }`.

---

## Try in My Room

Gated by `try_in_room_enabled` + `ai_visualization_enabled` for provider execution.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/products/{product}/try-in-room` | multipart: `photo`; returns job |
| GET | `/try-in-room/{jobId}` | Status + signed `result_url` when complete |

### Job response

```json
{
  "data": {
    "id": "uuid",
    "status": "queued",
    "product_id": 123,
    "expires_at": null
  }
}
```

---

## Rate limits (recommended)

| Route | Limit |
|-------|-------|
| PUT `/room-designs/*` | 30/min/user (debounce client-side primary) |
| POST try-in-room | 10/hour/user |
| GET list designs | 60/min/user |

Register in `RouteServiceProvider` or route middleware groups matching visual search style.

---

## Versioning

Breaking document schema → increment `schema_version` with server-side migrator on read. API remains `/api/v1` until global v2.

# Backend Architecture

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Principles

- Follow existing Laravel 13 patterns: Form Requests, Policies, API Resources, service classes
- Routes under `/api/v1` with Sanctum for mutating user resources
- Document-centric persistence for V1 (JSON column + version)
- Try-in-Room and AI on **existing Redis queue** workers — no new container without justification

---

## Room Designer modules

```text
app/
  Models/RoomDesign.php
  Policies/RoomDesignPolicy.php
  Http/Controllers/Api/V1/RoomDesignController.php
  Http/Requests/RoomDesign/StoreRoomDesignRequest.php
  Http/Requests/RoomDesign/UpdateRoomDesignRequest.php
  Http/Resources/RoomDesignResource.php
  Services/RoomDesign/RoomDesignValidator.php   // schema + bounds + item cap
  Services/RoomDesign/RoomDesignDocumentService.php
```

**Validator responsibilities (server-side, never trust client):**

- `schema_version` supported set
- Room dimensions within configured min/max (e.g. 1.5 m – 30 m per edge)
- Item count ≤ 100
- JSON decoded size ≤ 512 KiB
- Each `product_id` exists and is visible to user (published)
- Rotations numeric, positions finite
- Strip unknown keys or reject — **PREPARED:** strict schema reject in V1

---

## Optimistic concurrency

- Column `version` (unsigned int, default 1), increment on each successful update
- Client sends `If-Match: <version>` or body `expected_version`
- Mismatch → **409 Conflict** with server copy optional (see API contract)

---

## Cart integration

- **No** RoomDesign-owned inventory
- Endpoint or reuse: `POST /api/v1/cart/items` batch — **PREPARED** thin wrapper `POST /room-designs/{id}/add-to-cart` that resolves live products then delegates to existing `CartController` logic
- Reuse existing stock/price validation in cart services

---

## Try in My Room modules

```text
app/
  Models/TryInRoomJob.php          // or VisualizationJob generic name
  Models/TryInRoomUpload.php       // private media reference
  Services/Visualization/VisualizationService.php
  Services/Visualization/VisualizationProvider.php (interface)
  Services/Visualization/Providers/NullProvider.php
  Jobs/ProcessVisualizationJob.php
```

**Flow:**

```text
POST try-in-room → store upload (private disk) → dispatch job → 202 + job id
GET  try-in-room/{id} → status + result URL (signed, short TTL)
```

**Provider selection:** capability-based (`product_compositing`, `image_editing`, …) from config.

**States:** `queued | processing | completed | failed | expired`

---

## AI cost / abuse

- Middleware: `auth:sanctum` + throttle (dedicated limiter like `visual-search`)
- Max upload bytes (e.g. 8 MiB), max dimension 4096 px, MIME allowlist JPEG/PNG/WebP
- Per-user daily quota in Redis
- Job timeout (e.g. 120 s), max attempts 2, expire results after 7 days (configurable)
- Circuit breaker when provider error rate high — set `DEGRADED` flag, return 503 with retry-after

---

## Privacy

- Uploads: `storage/app/private/try-in-room/{user_id}/…`
- Signed temporary URLs for result viewing
- Delete on user account deletion (listener) — **PREPARED** hook in roadmap
- Do not send photos to provider without documented retention in privacy policy

---

## Reverb / realtime

**V1:** polling for save status optional; Try-in-Room may use existing notification patterns if present — **NOT VERIFIED** for job push. Prefer simple GET poll in V1.

---

## Feature flags

Add to `config/diyar.php` `feature` array (defaults **false**):

```php
'room_designer_enabled' => ...
'try_in_room_enabled' => ...
'ai_visualization_enabled' => ...
'room_designer_3d_enabled' => ...
'room_designer_sharing_enabled' => ...
```

Expose via existing public config/bootstrap endpoint if storefront reads flags — mirror visual search pattern.

---

## Docker / workers

No change to compose for V1. AI jobs consume same `queue:work` containers. Monitor queue depth in 30.10.

# Observability Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## Product analytics events

Reuse `DIYAR_ANALYTICS_EVENTS_ENABLED` pipeline if compatible — **VERIFIED** config exists.

| Event | Properties (non-PII) |
|-------|----------------------|
| `room_designer_opened` | source: sidebar \| pdp \| route |
| `room_created` | preset_id? |
| `item_added` | product_id |
| `item_moved` | — |
| `item_rotated` | — |
| `item_removed` | — |
| `design_saved` | item_count, bytes_bucket |
| `design_load_failed` | reason |
| `design_save_failed` | http_status |
| `try_in_room_started` | product_id |
| `try_in_room_completed` | duration_ms |
| `try_in_room_failed` | error_code |
| `cart_from_design` | count_added, count_skipped |

No room photo URLs in analytics payloads.

---

## Engineering metrics

| Metric | Source |
|--------|--------|
| `designer_load_ms` | client perf mark |
| `catalog_latency_ms` | Query timing |
| `save_latency_ms` | PUT RTT |
| `AI_job_duration_ms` | job metadata |
| `AI_failure_rate` | job status aggregate |

---

## Logging (server)

- Structured logs for save conflicts, validation failures, job failures
- Sample rate full validation errors in production (1%) if noisy

---

## Dashboards

**V1:** optional admin widget — **YAGNI** unless Stage 26 ops dashboard extended in same PR.

---

## Alerts (production)

- Queue failed jobs for visualization > threshold
- 5xx rate on `/room-designs/*` — tie to existing health monitoring if any

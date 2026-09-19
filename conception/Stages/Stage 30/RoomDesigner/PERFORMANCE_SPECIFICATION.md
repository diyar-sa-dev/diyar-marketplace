# Performance Specification

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)  
**Evidence:** [`backend/storage/certification/kvm2-equivalent/DIYAR_LOCAL_KVM2_EQUIVALENT_VALIDATION_REPORT.md`](../../../../backend/storage/certification/kvm2-equivalent/DIYAR_LOCAL_KVM2_EQUIVALENT_VALIDATION_REPORT.md)

---

## Infrastructure baseline (KVM2-equivalent local)

| Profile | Status | Notes |
|---------|--------|-------|
| ~56 RPS mixed, p95 < 500 ms | **VERIFIED** | rps50 |
| ~25 VU mixed, p95 < 500 ms | **VERIFIED** | vu25 |
| ~100 RPS / ~100 VU, p95 > 2 s | **VERIFIED** | saturation without 5xx |
| Search-focused ~145 RPS, search p95 ~40 ms | **VERIFIED** | isolated |

**Hostinger production:** **NOT VERIFIED** — treat local as planning guardrail only.

---

## Division of labor

| Workload | Where |
|----------|-------|
| Drag, collision, undo, geometry | Browser |
| Persistence, auth, catalog, cart | Laravel |
| AI inference | External provider via queue |

**Forbidden:** HTTP request per pointer move.

---

## Request budget

| Action | Target |
|--------|--------|
| Open designer (returning user) | ≤ 1 GET design + catalog on demand |
| Open new | 0 design GET; catalog when panel opened |
| Autosave | ≤ 1 PUT / 2.5 s idle burst |
| Catalog browse | 1 page per scroll/search |
| Try-in-room | 1 POST + poll ≤ 1 req/3 s until done |

Avoid N+1 product fetches — batch or cache Query keys.

---

## Frontend budgets (measure in 30.10)

| Metric | Target (initial) |
|--------|------------------|
| Lazy chunk (designer route) | Measure; aim < 250 KiB gzip excluding Fabric |
| Fabric lazy chunk | Measure; document in DECISION_LOG |
| Time to interactive designer | **PREPARED:** p75 < 3 s on 4G throttled |
| Drag frame budget | p75 < 16 ms desktop; best effort mobile |

Do **not** invent benchmark numbers in docs — replace with measured artifacts.

---

## Server budgets (new endpoints)

Room design PUT should stay **< 50 ms p95** at low concurrency when document ≤ 512 KiB — **validate in 30.10** with k6 scenario added to certification folder.

Designer traffic must not push mixed stack from ~56 RPS comfort zone into ~100 RPS degradation during campaigns without capacity review.

---

## Caching

- List designs: short private cache headers `Cache-Control: private, no-store` (user-specific)
- Catalog pages: existing CDN/cache
- No Redis cache for documents V1 unless read-heavy — **YAGNI**

---

## Asset performance

See [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md): thumbnails only, lazy load.

---

## 3D/AR (future)

Lazy load Three.js/GLB; never on initial storefront bundle.

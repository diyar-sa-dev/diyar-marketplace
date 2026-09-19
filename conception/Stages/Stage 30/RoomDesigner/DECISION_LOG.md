# Decision Log

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

Record architecture changes here **before** updating frozen rules in the master doc.

---

## Template

```text
### DEC-XXX — Title
- **Decision:** 
- **Current rule:** 
- **Problem discovered:** 
- **Evidence:** 
- **Proposed change:** 
- **Impact:** 
- **Migration required:** 
- **Performance impact:** 
- **Security impact:** 
- **Approval status:** PENDING | APPROVED | REJECTED
```

---

## Initial decisions (Stage 30 planning)

### DEC-001 — Canonical unit meters

- **Decision:** Store spatial truth in meters; convert cm at catalog boundary only.
- **Current rule:** Master F-2.
- **Problem discovered:** Existing sidebar uses px/%.
- **Evidence:** `SidebarAiStudioCanvas.tsx` audit.
- **Proposed change:** N/A (initial).
- **Impact:** Full spatial rebuild.
- **Migration required:** None (no legacy designs).
- **Performance impact:** Neutral.
- **Security impact:** Neutral.
- **Approval status:** PENDING (Stage 30 package)

### DEC-002 — Document JSON in single column

- **Decision:** `room_designs.document` JSON + denormalized counters.
- **Current rule:** DATABASE_SPECIFICATION.
- **Problem discovered:** No existing room_design pattern in repo.
- **Evidence:** grep `room_designs` NOT FOUND.
- **Proposed change:** N/A.
- **Impact:** Simple V1; harder SQL analytics.
- **Migration required:** 30.6 migration.
- **Performance impact:** Single row read/write efficient for autosave.
- **Security impact:** Validate size server-side.
- **Approval status:** PENDING

### DEC-003 — Fabric.js V1 renderer

- **Decision:** Lazy-loaded Fabric adapter behind `RoomRenderer` interface.
- **Current rule:** Master F-11.
- **Problem discovered:** No canvas library in package.json.
- **Evidence:** `fabric@6` + `STAGE_30_4_BUNDLE_EVIDENCE.md`; main build has no fabric chunk until designer wired.
- **Proposed change:** Konva if mobile/FPS fails in 30.9/30.10.
- **Impact:** `fabric` prod dependency; `canvas` dev-only for tests.
- **Migration required:** None.
- **Performance impact:** ~309 KiB min.mjs lazy chunk (measured).
- **Security impact:** Low.
- **Approval status:** APPROVED (30.4 Face 2)

### DEC-004 — No Zustand in early stages

- **Decision:** Pure TS store + React binding until 30.5 retrospective.
- **Current rule:** Master F-10.
- **Problem discovered:** No Zustand in project today.
- **Evidence:** package.json.
- **Proposed change:** Add Zustand only if measured complexity warrants.
- **Impact:** Avoid dependency churn.
- **Migration required:** N/A.
- **Performance impact:** Neutral.
- **Security impact:** Neutral.
- **Approval status:** PENDING

### DEC-006 — CLEAR_ROOM undo + item center anchor (30.1)

- **Decision:** Use internal `RESTORE_ITEMS` command for CLEAR undo; item `position_m` is footprint **center**.
- **Current rule:** DOMAIN / 30.1 implementation.
- **Problem discovered:** Inverse of CLEAR requires full item list; corner anchor unspecified in Stage 30.
- **Evidence:** Stage 30.1 implementation + tests.
- **Proposed change:** Document center anchor for renderer stage 30.4.
- **Impact:** Renderer adapter must offset sprites by half dimensions.
- **Migration required:** None.
- **Performance impact:** Neutral.
- **Security impact:** Neutral.
- **Approval status:** APPROVED (Face 2 re-validation 2026-09-19)

### DEC-008 — Interaction gesture boundary (30.5)

- **Decision:** Authoritative domain updates on Fabric `object:modified` only; preview during drag stays in Fabric.
- **Context:** Avoid command/history storms on pointermove.
- **Alternatives:** Live domain MOVE on each move event.
- **Reason:** Meets Stage 30 debounce/history rules; reject invalid moves via re-render.
- **Impact:** One undo step per drag/rotate gesture (BATCH if both change).
- **Reversibility:** High — interaction adapter swappable.
- **Stage:** 30.5
- **Status:** APPROVED

### DEC-007 — Default room preset dimensions (30.2)

- **Decision:** Engineering defaults for `majlis` / `salon` / `bedroom` in meters (see STAGE_30_2_IMPLEMENTATION_REPORT).
- **Context:** Sidebar mocks had images only, no sizes.
- **Alternatives:** Wait for product/content team measurements.
- **Reason:** Unblocks planner + persistence contract; tunable without schema change.
- **Impact:** UI may show labels from preset metadata until i18n wiring.
- **Reversibility:** High — adjust constants in `presets.ts`.
- **Stage:** 30.2
- **Status:** APPROVED (engineering default; product tuning optional)

### DEC-009 — Catalog product_id is UUID string (30.7)

- **Decision:** `RoomDesignItem.product_id` is the marketplace `Product.id` UUID string end-to-end (picker → document → API → DB JSON).
- **Current rule:** DOMAIN_ARCHITECTURE listed `product_id: number` (planning artifact).
- **Problem discovered:** DIYAR catalog uses UUID PKs; integer parsing in 30.3 adapter was invalid for real products.
- **Evidence:** `Product` model `HasUuids`; Stage 30.6 limitation note; 30.7 integration tests.
- **Proposed change:** Validate with `isCatalogProductId` / Laravel `Str::isUuid`; reject legacy integers on save.
- **Impact:** No production room designs with integer refs (feature flag off); no silent integer→UUID migration.
- **Migration required:** None (schema_version remains 1; field type correction only).
- **Performance impact:** Neutral.
- **Security impact:** Positive — aligns server product batch validation.
- **Approval status:** APPROVED (30.7 Face 1)

### DEC-005 — Item overlap WARN default

- **Decision:** WARN on collision; BLOCK on room edge.
- **Current rule:** DOMAIN_ARCHITECTURE constraints.
- **Problem discovered:** UX unknown for Arab market layouts.
- **Evidence:** None yet.
- **Proposed change:** Switch to BLOCK after 30.9 testing if needed.
- **Impact:** UX only.
- **Migration required:** None.
- **Performance impact:** Neutral.
- **Security impact:** Neutral.
- **Approval status:** PENDING

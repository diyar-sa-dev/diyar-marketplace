# Product Specification — Room Designer & Try in My Room

**Parent:** [`STAGE_30_ROOM_DESIGNER_MASTER.md`](STAGE_30_ROOM_DESIGNER_MASTER.md)

---

## A. Interactive Room Designer

### Vision ladder (not V1 scope)

```text
V1   2D deterministic planner
V1.x constraints, assets, mobile polish
V2   2.5D visualization
V3   3D interactive room
V4   AI-assisted room understanding (commands only)
V5   AR / spatial capture
V6   large-scale spatial platform
```

### V1 product scope

**In scope**

- Open designer from sidebar (refactor existing modal/shell)
- Rectangular room: presets + custom width/depth (meters internally)
- Search-driven catalog picker (existing APIs)
- Place furniture with top-down Tier-1 assets (or footprint fallback)
- Drag, rotate, delete, duplicate, lock
- Undo/redo (50 ops)
- Grid optional 0.1 m
- Room boundary **BLOCK**; item overlap **WARN** (default)
- Save/load for authenticated users
- Autosave with sync indicator
- Add design items to cart (live price/stock)
- Graceful handling of deleted/OOS products in saved designs

**Out of scope V1**

- Walls/doors/windows, multi-room, materials, lighting
- Design sharing/public links
- 3D/AR
- AI layout apply (except Try-in-Room module)
- Replacing `/ai-designer` chat

### Personas

| Persona | Need |
|---------|------|
| Buyer | Visualize layout before purchase |
| Mobile buyer | Touch-first planning |
| Guest | Browse designer if flag allows; save requires login |
| Ops | Feature flags, cost control on AI |

### Success metrics (post-launch)

- `design_saved` / `cart_from_design` conversion
- `design_save_failed` rate
- p95 `designer_load_ms`, `save_latency_ms`
- Support tickets re: data loss (target: zero silent loss)

---

## B. Try in My Room (Separate module)

### V1 foundation (stages 30.11–30.13)

- CTA from `ProductDetailsPage` (replace placeholder)
- Upload/capture photo → validate → private storage
- Async job + status polling (or existing notification pattern)
- Provider behind `VisualizationService` / `VisualizationProvider`
- Quotas, rate limits, retention policy

**Must not** block Room Designer if AI down.

### Shared infrastructure only

Product IDs, dimensions, media URLs, Sanctum, cart, feature flags, analytics — **not** shared spatial document or canvas state.

---

## V1 acceptance (Designer)

1. User creates room, adds ≥3 real catalog products, moves/rotates, saves, reloads identical layout (meter precision ±1 mm in JSON).
2. Offline save failure retains local state + retry succeeds.
3. Version conflict returns structured error; client merges or user chooses (see API contract).
4. Cart add uses current price; OOS shows clear message.
5. With `room_designer_enabled=false`, entry points hidden/disabled.
6. Mobile: drag + pinch zoom on real device (evidence: manual QA checklist in 30.9).

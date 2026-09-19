# DIYAR Room Designer - Audit & Architecture Report

> **Errata (2026-09-19):** Parent QA pass corrected an under-scan in the initial audit. The **Interactive Room Designer UX prototype exists** in the sidebar (`SidebarAiStudioModal` / `SidebarAiStudioCanvas`). It is **mock/hard-coded**, not wired to catalog APIs or persistence. Verdict updated from GREENFIELD to **REFACTOR (shell) + REBUILD (engine/data)**.

## 1. Codebase Audit

**Mission:** Verify the current state of the Interactive Room Designer prototype within the `diyar-marketplace` codebase.

### Frontend
- **Interactive Room Designer (sidebar):** **VERIFIED — NOT PRODUCTION READY.** `SidebarAiStudioModal.tsx` + `SidebarAiStudioCanvas.tsx`, opened from `SidebarMenu.tsx`. Arabic copy matches product vision (مجلس / صالون / جناح، إفراغ الغرفة، scale/rotate/delete). Furniture and room backgrounds are **hard-coded** in `sidebarMenuConstants.ts` (`ROOM_BACKGROUNDS`, `STICKERS` — Unsplash URLs, not DIYAR `product_id`).
- **Coordinate model:** **VERIFIED — INCORRECT FOR PRODUCTION.** Items use `%` left/top and arbitrary `scale` (0.6–1.8) and pixel width — **not meters**. Initial placement uses pixel-like `x/y` (100, 120) while render uses `%`, inconsistent.
- **Drag to move:** **NOT VERIFIED / LIKELY MISSING.** Canvas shows `cursor-grab` but no pointer-drag handlers; only toolbar scale/rotate/delete on selection.
- **Try in room (Product Detail):** **PARTIALLY VERIFIED.** `ProductDetailsPage.tsx` renders CTA and opens `isAiModalOpen` modal — **placeholder UI only** (title + close), no upload, no product inject, no link to studio route.
- **AI Design route:** **VERIFIED (separate feature).** `/ai-designer` → `AIDesignerPage.tsx` (assistant/chat + image context), not the 2D room planner engine.
- **Design assistant (text):** **VERIFIED.** Backend `AssistantChatService` + API; not spatial layout.
- **three.js, r3f, konva, fabric, webgl:** **NOT FOUND** in `frontend/package.json`.
- **dnd-kit / react-dnd:** **NOT FOUND**.

### Backend
- **Models & Migrations for Designs:** <span style="color:red">**NOT FOUND**</span>. No `room_designs`, `user_designs`, or layout persistence tables exist.
- **Controllers & API Routes:** <span style="color:red">**NOT FOUND**</span>. `routes/api.php` does not contain endpoints for saving/loading room designs.
- **AI Endpoints:** <span style="color:orange">**PARTIALLY VERIFIED**</span>. A generalized `api.v1.assistant.chat` endpoint exists but has no spatial reasoning or layout capabilities.
- **Media, Queues, Policies for 3D Pipeline:** <span style="color:red">**NOT FOUND**</span>.

### Database (Products & Dimensions)
- **Product Dimensions (`width`, `height`, `depth`, `weight_kg`):** <span style="color:green">**VERIFIED**</span>. Columns exist directly on the `products` table (`2026_08_16_140003_create_products_table.php` and `2026_08_26_260400_create_advanced_shipping_tables.php`).
- **Variants (Colors/Materials):** <span style="color:green">**VERIFIED**</span>. Handled via the `ProductColor` relation. 
- **Media Metadata:** <span style="color:green">**VERIFIED**</span>. Handled via the generic `media_files` table, but currently lacks 3D-specific indicators (like GLTF/USDZ asset flags).

---

## 2. Prototype Audit Table

| Component | Status | Data Source | Scale Risk (1k-100k products) |
| :--- | :--- | :--- | :--- |
| **Sidebar Room Studio UI** | EXISTS — NOT PRODUCTION READY | Mock `STICKERS` / Unsplash | N/A until catalog-backed |
| **2D placement (scale/rotate/clear)** | EXISTS — PARTIAL | Local React state only | Must replace with meter-based engine |
| **Product Detail → Try in room** | EXISTS — MOCK | Placeholder modal | Must route to designer + `product_id` |
| **3D WebGL Viewer** | NOT FOUND | N/A | High if added later |
| **AR Placement Mode** | NOT FOUND | Marketing copy only (`arDesc` i18n) | Separate track |
| **Undo/redo / persistence** | NOT FOUND | N/A | Required for V1 |
| **Saved Layout DB** | NOT FOUND | Missing | Medium |
| **Catalog API Link** | NOT FOUND in studio | Laravel catalog **VERIFIED** elsewhere | Low — reuse search/products APIs |

---

## 3. External Research: Architecture Patterns

Based on web research of industry leaders:
- **Planner 5D / Apple RoomPlan ([link](https://developer.apple.com/augmented-reality/roomplan/)):** LiDAR scanning captures parametric 3D bounding boxes. Generates USDZ format. *UX Pattern:* Capture -> Auto-Generate Layout -> Furnish -> Render.
- **IKEA Kreativ ([link](https://www.ikea.com/us/en/planners/)):** Mobile scanning mixed reality. AI removes existing furniture from a photo, substituting a 3D overlay of IKEA products. *UX Pattern:* Scan Photo -> Erase -> 2D/3D drag-and-drop replacement.
- **Houzz / Wayfair:** Primarily "View in Room" (AR single-product projection). *UX Pattern:* Product Detail -> Camera AR overlay -> Add to Cart.

**Crucial Takeaway for DIYAR:** Do not mix "AR Projection" with "Room Layout". They are separate technical flows. Room Planning must start in strict 2D (orthographic) before graduating to 3D/AR.

---

## 4. Architecture Design (Sections 7-51)

### Physical Coordinate System (Layer 1)
All data must be stored in **Meters**, utilizing a physical coordinate system (World Space). UI pixels are exclusively for rendering and scale relative to viewport zoom. A `DesignEngine` abstraction handles `(x_meters * scale_factor = pixel)`.

### Product Asset Tiers
To gracefully degrade and manage performance:
1. **Tier 1 (2D):** Top-down orthographic transparent PNGs (Required for V1).
2. **Tier 2 (2.5D):** Isometric renders.
3. **Tier 3 (3D):** Highly optimized `.glb` / `.gltf` formats.
4. **Tier 4 (AR):** `.usdz` formats exclusively mapped for iOS.

### Integration Flow
`Product Detail Page` -> `Try in Room CTA` -> Loads `Studio Canvas` (injects active product) -> `Add to Cart directly from Canvas`.

### Saved Design Data Model (Proposed)
```sql
CREATE TABLE room_designs (
    id UUID PRIMARY KEY,
    user_id UUID,
    name VARCHAR(255),
    floor_dimensions_json JSONB, -- { width_m, depth_m }
    snapshot_media_id UUID NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE room_design_items (
    id UUID PRIMARY KEY,
    room_design_id UUID,
    product_id UUID,
    pos_x DECIMAL(8,4), -- Meters from center
    pos_z DECIMAL(8,4), -- Meters from center (depth)
    rotation_y DECIMAL(8,4), -- Radians
    is_locked BOOLEAN
);
```

### State Management & Sync
- **Local:** `Zustand` store holding the spatial graph.
- **History:** Local array-based Undo/Redo stack (max 50 steps).
- **Network:** Debounced PUT requests (every 3 seconds of inactivity) to sync changes to the backend.

### Rendering Tech Comparison
| Tech | Paradigm | Recommendation |
| :--- | :--- | :--- |
| **Fabric.js** | 2D Canvas Object Model | **Recommended (V1)**. Mature, excellent for top-down layouts, fast. |
| **Konva.js** | 2D Canvas | Good alternative, but React-Konva can have heavy reconciliation. |
| **Vanilla Three.js** | 3D WebGL | Too low-level for rapid React iteration. |
| **React Three Fiber (R3F)** | 3D WebGL React | **Recommended (V2)**. Best ecosystem for React 3D. |
| **Model-Viewer** | Single-item AR | Recommended for the "View in AR" quick feature. |

### AI Integration
- **Room Understanding:** V1 should skip AI scanning. V2 can integrate with RoomPlan/LiDAR.
- **Deterministic Validation:** A math engine (AABB collision detection) runs on placement to ensure objects do not physically overlap or clip through walls. Must remain client-side for zero-latency feedback.

### RTL & LTR Parity
- **UI:** Inherits current system (Tailwind LTR/RTL flipping).
- **World Canvas:** Must remain **strictly LTR** (Cartesian standard). `X: 0, Y: 0` is the top-left or center of the physical room regardless of user language to ensure design coordinates don't flip and corrupt when shared across languages.

---

## 5. Deliverables A-R (Checklist)

A. Database Schema (See above)
B. API Endpoint definitions (`/api/v1/designs/*`)
C. State Management Architecture (Zustand)
D. Canvas Rendering Strategy (Fabric.js -> R3F)
E. Asset Tiers definition
F. AR vs 3D vs 2D boundaries defined
G. RTL World-Space isolation strategy
H. Collision math overview
I. Debounce persistence parameters
J. Auth & Sharing scope
K. Integration with current Product Catalog
L. Pricing / Stock sync strategy (Live check before Add to Cart)
M. UI/UX Flow map
N. External dependencies lock (Fabric.js, Zustand)
O. AI strategy deferred to V2
P. Mobile-first touch mechanics (Pan/Pinch-to-zoom)
Q. Observability/Analytics funnels (Room started -> Item added -> Cart)
R. Phased execution plan

---

## 6. Roadmap Phases 0-7

*Adjusted after prototype correction: reuse sidebar UX shell; replace mock data and rendering engine.*

- **Phase 0: Foundation.** Domain model (meters), DB migrations, CRUD API routes; map `SidebarAiStudioModal` flows to real routes (optional: keep modal entry from sidebar + deep link from PDP).
- **Phase 1: 2D Grid & Catalog.** Fabric.js (or Konva) canvas; **replace** `STICKERS` with paginated DIYAR products + design-relevant metadata; top-down assets Tier 1.
- **Phase 2: Mechanics.** Drag & drop, snap-to-wall, collision detection, rotation.
- **Phase 3: E-Commerce Sync.** Live stock checks, multi-item "Add to Cart" checkout integration.
- **Phase 4: Persistence.** Debounced saving, user dashboard integration, design sharing.
- **Phase 5: 3D/AR Upgrade (V2).** React Three Fiber dual-render mode (Toggle 2D/3D).
- **Phase 6: Spatial AI.** Room layout inference from photos.
- **Phase 7: Optimization.** WebGL shader tuning, asset CDNs.

---

## 7. Final Verdict (Section 51)

**VERDICT: REFACTOR (product UX) + REBUILD (spatial engine, data, API)**

| Area | Verdict |
| :--- | :--- |
| **Sidebar studio shell** (room presets, furniture picker, Arabic UX) | **KEEP** — refactor into `features/room-design/` |
| **Canvas implementation** (%/px stickers) | **REBUILD** — meter-based world space + proper drag/snap/collision |
| **Mock catalog (`sidebarMenuConstants`)** | **DELETE** from production path |
| **Product Detail CTA** | **REFACTOR** — wire to designer with `product_id`, replace placeholder modal |
| **Backend persistence** | **GREENFIELD** (no `room_designs` today) |

**V1 Scope:** 2D top-down planner (Fabric.js recommended in this report). Deterministic collision; no AI/3D in V1. AI photo viz and AR remain deferred (Phases 3+).

### Top 5 Risks
1. **Asset Pipeline:** Vendors upload unoptimized images. Top-down PNG generation bottleneck.
2. **State Sync:** Race conditions between rapid user edits and debounced network saves.
3. **Cart Sync:** Products going out of stock while sitting inside a saved room design.
4. **Mobile Performance:** Heavy DOM/Canvas manipulation causing layout thrashing on low-end Androids.
5. **Scope Creep:** Bleeding 3D requirements into the 2D V1 timeline.

**Approval Gate:**
`STATUS: AWAITING APPROVAL.` No implementation (migrations, deps, or code) has been applied. Please approve this architecture to proceed with Phase 0.
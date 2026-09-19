# Stage 30 — Interactive Room Designer (Master Authority)

**Status:** PLANNING — architecture specification only  
**Product (AR):** مصمم الغرف التفاعلي — *تخيّل مكانك، ورتّب قطع أثاث ديار كيفما تشاء*  
**Git baseline verified:** `62cc1ad` (includes Day 29 search `df0e5e1`)  
**Performance evidence:** `backend/storage/certification/kvm2-equivalent/DIYAR_LOCAL_KVM2_EQUIVALENT_VALIDATION_REPORT.md` (local KVM2-equivalent, **NOT** Hostinger VPS)

---

## 0. Authority

After approval, **Stage 30 is the engineering contract** for Room Designer. Implementers must:

1. Read this master doc and linked Stage 30 specs  
2. Inspect current code before coding  
3. Follow DIYAR conventions (Laravel 13, React 19, TanStack Query, Sanctum, existing cart/catalog/media)  
4. **Never** silently change frozen decisions (§ Frozen Rules)  
5. Record deviations in [`DECISION_LOG.md`](DECISION_LOG.md) and obtain approval for architecture/security/API/DB changes  

**Forbidden during Stage 30 planning task:** feature implementation code, migrations, new runtime dependencies in production.

---

## 1. Mission Summary

Build a **meter-based spatial platform** integrated with DIYAR commerce:

| Capability | V1 | Later |
|------------|----|-------|
| Interactive 2D room planner | Yes | 2.5D / 3D / AR |
| Real catalog products | Yes | — |
| Save / load designs | Yes | sharing, history |
| Cart with live price/stock | Yes | — |
| Try in My Room (photo + AI) | Foundation only (30.11+) | full AI |
| AI layout suggestions | No | via **commands** through constraint engine |

Two **separate products** (shared product/cart/auth only): **A) Room Designer** · **B) Try in My Room** — see [`PRODUCT_SPECIFICATION.md`](PRODUCT_SPECIFICATION.md).

---

## 2. Repository Audit (Re-verified)

| Item | Status |
|------|--------|
| `SidebarAiStudioModal` / `SidebarAiStudioCanvas` / `SidebarMenu` | **VERIFIED** — UX shell, mock data |
| `sidebarMenuConstants.ts` (`ROOM_BACKGROUNDS`, `STICKERS`) | **VERIFIED** — Unsplash mocks, no `product_id` |
| Positioning (% / px / scale) | **VERIFIED** — not meters |
| Drag-to-move | **NOT VERIFIED** — toolbar scale/rotate/delete only |
| `ProductDetailsPage` try-in-room CTA | **VERIFIED** — placeholder modal |
| `/ai-designer` (`AIDesignerPage`) | **VERIFIED** — chat assistant, **separate** |
| Product `width`, `height`, `depth`, `weight_kg` | **VERIFIED** — `products` table + `ProductDetailResource` |
| Dimensions displayed as **cm** | **VERIFIED** — i18n `dimensionsValue` |
| Cart, media, Redis, queues, Reverb, Docker compose | **VERIFIED** |
| Feature flags (`diyar.feature.*`) | **VERIFIED** — `config/diyar.php` |
| `room_designs` / RoomDesign API | **NOT FOUND** |
| Fabric / Konva / Three / Zustand | **NOT FOUND** in `frontend/package.json` |

**Conclusion:** **REFACTOR** sidebar UX shell · **REBUILD** spatial engine · **REBUILD** persistence · **REBUILD** Try-in-Room.

Prior Stage 28 docs: [`../../RoomDesigner/DIYAR_ROOM_DESIGNER_ARCHITECTURE_AUDIT.md`](../../RoomDesigner/DIYAR_ROOM_DESIGNER_ARCHITECTURE_AUDIT.md) (superseded by Stage 30 for authority).

---

## 3. Frozen Rules (Change only via DECISION_LOG + approval)

| ID | Rule |
|----|------|
| F-1 | **Spatial domain first, renderer second** — domain never imports Fabric/Konva/Three/AI |
| F-2 | **Canonical unit: meter** in `RoomDesignDocument`; catalog boundary **cm** → `m = cm / 100` |
| F-3 | **Never** persist px, %, or CSS coords as authoritative spatial data |
| F-4 | **World X/Z** top-down; **Y** reserved for 3D; **RTL does not mirror** world axes |
| F-5 | **Commands only** mutate spatial state (renderer emits commands, does not own truth) |
| F-6 | **No API on drag** — debounced document PUT (2–3 s idle) |
| F-7 | **No price/stock** in design snapshots — cart revalidates live |
| F-8 | **AI async only** on queue — never block Octane/FPM on provider |
| F-9 | **Room Designer works** when AI unavailable |
| F-10 | **Stage 30.1–30.2:** no Zustand required — feature-local pure TS + React binding |
| F-11 | **V1 renderer:** Fabric.js **as lazy-loaded adapter** only after chunk budget measured |
| F-12 | **Separate modules** for Designer vs Try-in-Room |

---

## 4. Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│ Browser                                                  │
│  UI (RTL) ──► SpatialStore (pure TS) ──► ConstraintEngine│
│                      │                      │            │
│                      └──────────► RoomRenderer adapter   │
│                                   (Fabric V1, lazy)      │
└──────────────────────────┬──────────────────────────────┘
                           │ debounced PUT + version
┌──────────────────────────▼──────────────────────────────┐
│ Laravel /api/v1                                          │
│  RoomDesignController · Policies · FormRequest validation │
│  Catalog (existing) · Cart (existing)                      │
│  TryInRoom → VisualizationJob → Queue → Provider adapter   │
└──────────────────────────┬──────────────────────────────┘
                           │
                    MySQL · Redis · existing workers
```

Detail: [`DOMAIN_ARCHITECTURE.md`](DOMAIN_ARCHITECTURE.md), [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md), [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md).

---

## 5. Document Schema (Summary)

Full schema: [`DOMAIN_ARCHITECTURE.md`](DOMAIN_ARCHITECTURE.md).

```text
RoomDesignDocument v1
  schema_version: 1
  room: { preset_id?, width_m, depth_m, height_m?, origin: 'corner'|'center' }
  items[]: { id, product_id, variant_key?, position_m{x,z}, rotation_deg, locked, layer,
             snapshot{ name, width_m, depth_m, height_m, thumbnail_url, asset_ref? } }
  meta?: { locale?, client_build? }  // non-authoritative hints
```

**Max items V1:** **100** (hard server cap; target comfortable UX **50** — validate in 30.10).  
**Max JSON body:** **512 KiB** (server enforced; rationale in [`DATABASE_SPECIFICATION.md`](DATABASE_SPECIFICATION.md)).

---

## 6. Spec Index

| Document | Contents |
|----------|----------|
| [`PRODUCT_SPECIFICATION.md`](PRODUCT_SPECIFICATION.md) | Scope, personas, A vs B, V1 acceptance |
| [`UX_SPECIFICATION.md`](UX_SPECIFICATION.md) | Flows, mobile, a11y, RTL |
| [`DOMAIN_ARCHITECTURE.md`](DOMAIN_ARCHITECTURE.md) | Document, commands, constraints, geometry |
| [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md) | Routes, state, Fabric adapter, lazy load |
| [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md) | Services, jobs, AI abstraction |
| [`API_CONTRACT.md`](API_CONTRACT.md) | REST shapes, errors, versioning |
| [`DATABASE_SPECIFICATION.md`](DATABASE_SPECIFICATION.md) | Tables, indexes, migrations |
| [`ASSET_PIPELINE.md`](ASSET_PIPELINE.md) | Tier 1–4 assets, fallbacks |
| [`PERFORMANCE_SPECIFICATION.md`](PERFORMANCE_SPECIFICATION.md) | KVM2 budget, request budget |
| [`SECURITY_SPECIFICATION.md`](SECURITY_SPECIFICATION.md) | Auth, uploads, IDOR |
| [`TESTING_SPECIFICATION.md`](TESTING_SPECIFICATION.md) | Matrices, evidence labels |
| [`OBSERVABILITY_SPECIFICATION.md`](OBSERVABILITY_SPECIFICATION.md) | Events, metrics |
| [`DEPLOYMENT_AND_SCALING.md`](DEPLOYMENT_AND_SCALING.md) | Docker, flags, scale path |
| [`IMPLEMENTATION_ROADMAP.md`](IMPLEMENTATION_ROADMAP.md) | Stages 30.1–30.18 |
| [`RISK_REGISTER.md`](RISK_REGISTER.md) | Risks + mitigations |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Architecture change control |
| [`STAGE_30_COMPLETION_REPORT.md`](STAGE_30_COMPLETION_REPORT.md) | Approval gate |

---

## 7. Engineering Priority (Internal)

```text
1. No crash / no data loss
2. Performance
3. Correct spatial behavior
4. Security
5. Reliability
6. Maintainability
7. Scalability
8. AI
9. 3D
10. AR
```

---

## 8. KVM2 Baseline (Evidence)

From local kvm2-equivalent (Octane 2 workers, mixed workload, rate limits on):

| Level | Result |
|-------|--------|
| ~50–56 RPS mixed, 3m | p95 < 500 ms, 0% errors — **VERIFIED** |
| ~25 VU mixed | p95 < 500 ms — **VERIFIED** |
| ~100 RPS / ~100 VU mixed | p95 > 2 s, 0% 5xx/429 — **VERIFIED** |

Room Designer must stay **well below** aggregate save traffic that could stack with catalog peaks; see [`PERFORMANCE_SPECIFICATION.md`](PERFORMANCE_SPECIFICATION.md).

---

## 9. Feature Flags (Minimum)

```text
diyar.feature.room_designer_enabled              default: false
diyar.feature.try_in_room_enabled                default: false
diyar.feature.ai_visualization_enabled           default: false
diyar.feature.room_designer_3d_enabled           default: false
diyar.feature.room_designer_sharing_enabled      default: false
```

Register in `config/diyar.php` + optional admin system_settings mirror (pattern: visual search).

---

## 10. Implementation Gate

```text
READY FOR ARCHITECTURE APPROVAL: YES
READY FOR IMPLEMENTATION:        NO
```

First code: **Stage 30.1 Spatial Core** only, after explicit user approval of Stage 30 package.

See [`STAGE_30_COMPLETION_REPORT.md`](../Stage%2030.6/STAGE_30_COMPLETION_REPORT.md).

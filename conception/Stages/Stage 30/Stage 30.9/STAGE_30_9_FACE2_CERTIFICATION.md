# Stage 30.9 — Face 2 Certification

**Date:** 2026-09-19  
**Status:** **VERIFIED WITH LIMITATIONS**

---

## Adversarial matrix

| Area | Attack | Result |
|------|--------|--------|
| Gesture conflict | Pinch during drag | Pinch uses 2 touches; Fabric drag single-touch — **isolated** |
| Page scroll | Canvas drag | `touch-action: none` on canvas container only — **scoped** |
| Viewport zoom | Pinch zoom | `zoomToPoint` only — **no** MOVE/ROTATE commands (unit test) |
| History spam | Rapid touchmove | Commits on `object:modified` end — **unchanged 30.5** |
| RTL | Shell `dir=rtl`, canvas `dir=ltr` | World coords not mirrored — **preserved** |
| Orientation | `resizeViewport` | Re-render projection; document unchanged — **tested** |
| Narrow viewport | Shell test mobile | Catalog sheet + canvas — **PASS** |
| Desktop regression | Fabric interaction test | **PASS** |
| Autosave flush | Hook dispose | Calls `flush()` — **implemented** |
| Cart double submit | Modal disabled while pending | **unchanged 30.8** |
| Catalog preload | Panel unchanged | 12/page — **unchanged 30.7** |
| PHPUnit regression | RoomDesign filter | **20 PASS** (local) |

---

## Face 2 certification questions

1. Touch uses command pipeline? **Yes** — same Fabric → `fabricModifyToCommands` path.
2. One drag → one history op? **Yes** — on gesture end (`object:modified`).
3. No API during movement? **Yes**.
4. No React churn during movement? **Yes** — session in ref.
5. Pinch avoids document mutation? **Yes** — viewport only.
6. RTL world coords unchanged? **Yes**.
7. Desktop still works? **Yes** — tests green.
8. Orientation preserves state? **Yes** — resize reprojects only.
9. Essential controls on narrow viewport? **Yes** — toolbar + products sheet.
10. Modal accessible? **Partial** — dialog roles; focus trap not added (limitation).
11. Autosave flush? **Yes** — unmount hook.
12. Catalog search bounded? **Yes** — unchanged.
13. Cart authority preserved? **Yes** — no frontend price logic added.
14. Real device limits documented? **Yes** — NOT VERIFIED.
15. Regression suite? **Vitest 77 PASS; PHPUnit RoomDesign PASS**.

---

## Limitations

| Item | Impact |
|------|--------|
| No real-device QA | Gesture feel unverified on iOS/Android |
| No Playwright mobile E2E | Route/flag gap |
| Shell not in Sidebar mock | Integrators must mount `RoomDesignerShell` |
| Modal focus trap | Keyboard users may tab behind overlay |

---

## Certification

**VERIFIED WITH LIMITATIONS** — Mobile layout, responsive canvas, viewport pinch, and touch-friendly controls are implemented with automated evidence. Device matrix and storefront wiring remain for Stage 30.10 / UI integration.

# Phase 28.4 — Responsive Testing

---

## Method

Phase 28.4 did **not** execute automated viewport sweeps across all listed breakpoints.

Evidence sources:
- Tailwind responsive utility usage (source inspection)
- Playwright default viewport (1280×720 Chromium)
- Component patterns (`CartSidebar`, dashboards, modals)

---

## Breakpoints requested vs status

| Viewport | Tested in 28.4 |
|----------|----------------|
| 320×568 | **NOT VERIFIED** |
| 375×667 | **NOT VERIFIED** |
| 390×844 | **NOT VERIFIED** |
| 430×932 | **NOT VERIFIED** |
| 768×1024 | **NOT VERIFIED** |
| 1280×720 | **Playwright default** (implicit) |
| 1440×900 | **NOT VERIFIED** |
| 1920×1080 | **NOT VERIFIED** |

---

## Source inspection findings

| Pattern | Observation |
|---------|-------------|
| Tailwind `md:` / `lg:` breakpoints | Used extensively (cart, checkout, dashboards) |
| Admin tables | `AdminTablePagination`, horizontal scroll patterns |
| Modals | Fixed overlay + padding (`z-300`) |
| Charts (Recharts) | Large chunks — mobile chart readability **NOT VERIFIED** |

---

## Playwright-related UI defect

**KI-028-041** — `projects.spec.ts`: modal overlay intercepts Projects button (90s timeout) — may affect mobile + desktop.

---

## Gate

```text
NOT VERIFIED
```

Responsive matrix requires Phase 28.5 visual/manual or dedicated Playwright viewport projects.

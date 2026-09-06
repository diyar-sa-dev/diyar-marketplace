# Phase 28.5 — Responsive E2E Smoke (KI-028-045)

**Spec:** `frontend/e2e/responsive-smoke.spec.ts`  
**Run:** CI-parity stack — **29/29 PASS**

---

## Viewport matrix

| Viewport | Size | Routes tested |
|----------|------|---------------|
| mobile-320 | 320×800 | `/`, `/search`, `/services`, `/blog` |
| mobile-375 | 375×812 | same |
| tablet-768 | 768×1024 | same |
| tablet-1024 | 1024×768 | same |
| desktop-1280 | 1280×800 | same |
| desktop-1440 | 1440×900 | same |
| desktop-1920 | 1920×1080 | same |

Additional: `/auth` form visible @ 375×812

---

## Assertion

Horizontal overflow ≤ 2px:

```javascript
document.documentElement.scrollWidth - document.documentElement.clientWidth
```

---

## Not tested in smoke

| Surface | Status |
|---------|--------|
| Cart / checkout | **NOT VERIFIED** |
| Dashboard / admin shell | **NOT VERIFIED** |
| Modals / dialogs | **NOT VERIFIED** (except overflow on main routes) |
| RTL visual audit | **NOT VERIFIED** (locale ar-SA default in Playwright config) |
| Product detail | **NOT VERIFIED** in responsive spec |

---

## Gate

```text
PARTIAL
```

Core public routes pass overflow smoke across 7 viewports. Checkout/dashboard/modal surfaces deferred.

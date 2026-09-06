# Phase 28.4 — Dark / Light Mode

---

## Finding

DIYAR frontend does **not** implement a user-facing **dark/light mode toggle**.

What exists instead:

**`PlatformThemeProvider`** (`components/theme/PlatformThemeProvider.tsx`):
- Fetches **platform theme tokens** from API (`usePlatformThemeQuery`)
- Applies CSS variables: primary, surface, portal accent colors, font stacks
- Admin area excluded from public theme fetch
- This is **brand/theming**, not dark mode

`text-diyar-dark` Tailwind tokens refer to **brand color** `#1f3d3a`, not dark mode.

---

## Spec vs actual

| Requested | Status |
|-----------|--------|
| Light mode | Default light UI — **yes** |
| Dark mode | **NOT IMPLEMENTED** |
| `prefers-color-scheme` | **NOT FOUND** in source |

---

## Gate

```text
N/A (dark/light toggle)
PARTIAL (platform color theming only)
```

No contrast audit performed for hypothetical dark mode.

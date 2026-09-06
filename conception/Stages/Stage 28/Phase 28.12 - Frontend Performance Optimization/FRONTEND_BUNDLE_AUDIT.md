# Phase 28.12 — Frontend Bundle Audit

## Before (Phase 28.7 / 28.12 baseline)

```
index-*.js        499.27 KB │ gzip 143.59 KB  ← both locales + app core
index-*.css       248.85 KB │ gzip  34.36 KB
MarketplaceShell  189.81 KB │ gzip  59.29 KB
HomePage           67.39 KB │ gzip  15.48 KB
CartesianChart    324.78 KB │ gzip  98.89 KB
confirmDialog      86.13 KB │ gzip  22.32 KB
vendor-react      194.25 KB │ gzip  60.73 KB
```

**Root cause:** `translate.ts` statically imported `en.ts` + `ar.ts` (~389 KB source) into the main entry. SweetAlert2 CSS/JS loaded synchronously from `main.tsx` / `confirmDialog.ts`.

## After

```
index-*.js        111.27 KB │ gzip  36.91 KB  ← app core only
index-*.css       218.80 KB │ gzip  29.73 KB
en-*.js           166.75 KB │ gzip  49.55 KB  ← lazy locale
ar-*.js           222.20 KB │ gzip  57.23 KB  ← lazy locale
MarketplaceShell   60.74 KB │ gzip  16.64 KB
HomePage           21.73 KB │ gzip   6.75 KB
vendor-recharts   385.74 KB │ gzip 113.06 KB
vendor-sweetalert2 79.22 KB │ gzip  21.07 KB
vendor-motion     128.70 KB │ gzip  42.29 KB
vendor-react      194.25 KB │ gzip  60.73 KB
```

## Initial load comparison (Arabic default)

| Asset | Before (loaded immediately) | After (loaded immediately) |
|-------|----------------------------|----------------------------|
| Main JS | 499 KB | 111 KB + 222 KB (ar) = 333 KB |
| Main JS gzip | 144 KB | 37 KB + 57 KB (ar) = 94 KB |

**Net gzip savings on first load:** ~50 KB (−35%) while deferring English entirely.

**English locale switch:** loads `en-*.js` chunk on demand (~50 KB gzip).

## Chunk strategy (`vite.config.ts`)

| Chunk | Libraries |
|-------|-----------|
| `vendor-react` | react, react-dom |
| `vendor-query` | @tanstack/react-query |
| `vendor-router` | react-router |
| `vendor-icons` | lucide-react |
| `vendor-realtime` | laravel-echo, pusher-js |
| `vendor-recharts` | recharts (NEW) |
| `vendor-sweetalert2` | sweetalert2 (NEW) |
| `vendor-motion` | framer-motion (NEW) |
| `en` / `ar` | locale catalogs (dynamic import) |

## Admin/storefront isolation

- Recharts no longer co-located with main entry
- Admin shell remains async import from `App.tsx`
- Storefront `index` chunk does not include admin page modules (verified via build output)

## Recommendations deferred (P2)

- OPT-BUNDLE-001: Further split `SidebarMenu.tsx` (35 KB chunk) — maintainability + chunk size
- OPT-BUNDLE-002: Investigate shared chunk between lazy home sections and `HomePage` (SectionEmptyState dedupe)

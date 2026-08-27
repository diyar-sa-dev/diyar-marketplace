# Phase 28.12 — Frontend Performance Audit

**Status:** VERIFIED against source (2026-08-27)

## Architecture validated

| Layer | Finding |
|-------|---------|
| Entry | `main.tsx` bootstraps locale catalog before React render |
| Routing | `App.tsx` lazy-splits `AdminShell` vs `MarketplaceShell` |
| Storefront routes | `marketplace/lazyPages.ts` — 70+ lazy page imports |
| Dashboard | `/dashboard/*` via lazy `DashboardLayout` + page chunks |
| Admin | `admin/AdminShell.tsx` — all admin pages lazy |
| Query defaults | `queryClient.ts`: `staleTime: 60s`, `refetchOnWindowFocus: false` |
| Realtime | Echo/Pusher in `vendor-realtime` chunk |

## Critical journeys — network/query

| Journey | Optimization applied |
|---------|---------------------|
| Landing | Main bundle −78%; homepage sections code-split |
| Catalog / search | Existing catalog query staleTime 30s (28.11) |
| Cart / checkout | No contract changes; cart hooks unchanged |
| Chat | Conversations: disabled window-focus refetch |
| Vendor dashboard | `useVendor`/`useProvider` staleTime 60s (28.11) |
| Admin analytics | Recharts isolated to `vendor-recharts` chunk |

## Images & assets

- Homepage ad popup: added `loading="lazy"` + `decoding="async"`
- Logo in header: kept eager (LCP/navigation)
- Lucide: tree-shaken via named imports; `vendor-icons` chunk 73 KB

## RTL/LTR

- Locale lazy-loading preserves `applyDocumentLocale` on switch
- `LocaleProvider` shows brief bootstrap spinner on locale change only
- No directional CSS regressions introduced in modified files

## SEO / metadata

- No metadata regressions in modified paths
- Dynamic locale loading does not affect `<title>` generation (uses loaded catalog before render)

## Error boundaries

- Existing root `ErrorBoundary` in `main.tsx` preserved
- Lazy homepage sections fail independently via Suspense boundaries (fallback skeleton)

## Security

- No changes to auth guards, CSRF, or Sanctum flow
- KI-028-055 (`dangerouslySetInnerHTML`) untouched

## Responsive

- E2E responsive smoke failed in this environment (no live dev stack) — see `FRONTEND_PERFORMANCE_ISSUES.md` OPT-E2E-001

## Scalability notes

- Locale catalogs load one at a time — supports adding locales without inflating initial bundle
- Homepage below-fold lazy boundaries reduce parse cost on first navigation
- Large admin/vendor pages still >250 lines — server pagination patterns unchanged; see component audit

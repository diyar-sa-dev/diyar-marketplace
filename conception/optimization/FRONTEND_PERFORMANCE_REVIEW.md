# Frontend Performance Review

## Bundle (verified 2026-08-29)

| Asset | Size |
|-------|------|
| Main entry gzip | **37.15 KB** |
| vendor-recharts | 377 KB (admin routes) |
| ar locale | 222 KB gzip 57 KB |
| HomeBelowFoldSections | 51 KB gzip 11.8 KB |

## TanStack Query

- staleTime: 60s global; cart Infinity; refetchOnWindowFocus: false
- **Good defaults** for marketplace browsing

## Fixes

- OPT-002: Auth /me deduped on navigation

## Opportunities (not implemented — measure first)

- Homepage aggregate API (OPT-004)
- ServicesSection batch API (OPT-005)
- Trim home section duplicate imports (OPT-012)
- Z-index design tokens (KI-028-050 partial)

## Mobile / low-end

Lazy routes + code splitting in place. Image lazy loading on home ad. No Web Vitals CI yet (PERF-028-007).

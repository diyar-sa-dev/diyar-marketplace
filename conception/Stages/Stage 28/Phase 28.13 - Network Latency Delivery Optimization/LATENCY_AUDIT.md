# Latency Audit — Phase 28.13

## Targets (design goals, not guarantees)

| Layer | Target | Local measured |
|-------|--------|----------------|
| Hashed static asset | <100ms (CDN edge) | N/A without CDN |
| Anonymous catalog API | <300ms TTFB | Depends on DB/Redis |
| Authenticated API | <300ms typical | Unchanged |
| SPA index.html | no-cache, small payload | ~0.97 KB |

## Waterfall optimizations verified

### Homepage
- Main entry 37 KB gzip (not 144 KB)
- Locale loaded dynamically (not in main)
- Below-fold single chunk (~12 KB gzip)
- Hero/categories eager; 17 sections lazy

### API
- TanStack Query staleTime tuned (28.11/28.12)
- Chat refetchOnWindowFocus disabled for conversations
- Public catalog: Redis cache (28.11) + HTTP cache hint (28.13)

## Bottleneck analysis

| Bottleneck | Mitigation |
|------------|------------|
| Large initial JS (pre-28.12) | ✅ Resolved — 74% gzip reduction |
| 17 tiny lazy chunks | ✅ Consolidated HomeBelowFoldSections |
| API no edge cache for anonymous | ✅ ApplyHttpCachePolicy |
| HTML/chunk mismatch on deploy | ✅ lazyWithRetry + index no-cache |

## Throttling (realistic network)

Responsive + journey E2E cover viewports 320–1920. Full Slow 4G profiling requires production RUM or Lighthouse CI (recommended post-hosting).

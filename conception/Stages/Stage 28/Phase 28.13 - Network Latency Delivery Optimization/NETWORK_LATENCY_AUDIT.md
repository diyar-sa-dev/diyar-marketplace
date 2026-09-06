# Network Latency Audit — Phase 28.13 Re-Audit

**Date:** 2026-08-29  
**Environment measured:** Local (vite preview + artisan serve)

## Request path

```
Browser → vite preview :3000 (proxy /api → :8000)
       → Laravel ApplyHttpCachePolicy
       → Redis/array cache (28.11 app cache)
       → SQLite/MySQL
```

## Measured delivery metrics (production build)

| Metric | Value |
|--------|-------|
| Main entry JS gzip | **37.16 KB** |
| Main CSS gzip | **29.73 KB** |
| index.html gzip | **0.83 KB** |
| vendor-react (modulepreload) gzip | 60.73 KB |
| Largest lazy chunk gzip | 113.06 KB (recharts, admin-only) |

## Latency contributors addressed

| Contributor | Mitigation |
|-------------|------------|
| Large initial JS | Phase 28.12 splits (−74% main bundle) |
| Locale payload | Dynamic `import()` for ar/en |
| SweetAlert2 | Deferred via `swalLoader` |
| Recharts | Lazy admin/vendor routes only |
| Public API repeat fetches | HTTP cache hints (60s catalog, 300s platform) |
| Stale chunk after deploy | `lazyWithRetry` + HTML no-cache |
| Login throttle blocking E2E | Loadtest bypass for credential rate limiter |

## Waterfall notes

- Homepage: shell + vendor-react modulepreload; below-fold sections lazy
- TanStack Query: staleTime configured per domain (28.12) — no unnecessary refetch storms observed in E2E
- API parallelization: catalog pages fetch categories + products in parallel where hooks allow

## Production expectations (not measured locally)

CDN edge cache hits, TLS RTT, and MySQL/Redis p95 require staging/production RUM — documented as P3 deferred item.

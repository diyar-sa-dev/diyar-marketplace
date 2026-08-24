# PROD_TEMP Latency Audit

**Branch:** `prod-temp`  
**Measurement status:** LOCAL/CI only — no production benchmarks claimed

## Architecture latency chain

```
Vercel CDN → React SPA → Render API (Octane) → PostgreSQL / Redis
```

## Optimizations applied

| Layer | Change |
|-------|--------|
| TTFB | Octane Swoole, config/route/view cache on boot |
| Cold start | No migrate/seed on boot; health probe cached 45s |
| DB | Composite indexes; slimmer eager loads; dashboard cache |
| Redis | Category tree, search facets, vendor overview |
| API payload | Selective columns; first image only on lists |
| Frontend | React Query staleTime by domain; direct Render API URL |

## Instrumentation (existing)

- API correlation IDs via `ApiResponse`
- `LOG_LEVEL=warning` in production
- No client-facing stack traces (`APP_DEBUG=false`)

## Recommended post-deploy checks

1. Render logs: p95 route duration for `/api/v1/products`, `/orders`, `/catalog/search`
2. PG: `EXPLAIN ANALYZE` on product list + vendor order list
3. Vercel: verify `VITE_API_URL` points to Render directly (avoid 408 proxy timeout)
4. Smoke: login, catalog, checkout, vendor dashboard after PG migrate

## Honest FREE-tier limits

- 256 MB PostgreSQL, 0.1 CPU — not enterprise capacity
- Cold starts 30–60s after sleep
- No guaranteed queue worker on FREE
- Do not claim 25K VU without measured evidence

## Benchmark template (fill after deploy)

| Endpoint | p50 | p95 | queries | payload KB | env |
|----------|-----|-----|---------|------------|-----|
| GET /categories | — | — | — | — | PRODUCTION |
| GET /products | — | — | — | — | PRODUCTION |
| GET /products/{id} | — | — | — | — | PRODUCTION |
| GET /catalog/search | — | — | — | — | PRODUCTION |
| GET /orders | — | — | — | — | PRODUCTION |

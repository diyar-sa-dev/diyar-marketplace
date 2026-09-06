# Performance Before / After — Phase 28.13

**Baseline commit:** `badbb6e` (Stage 28 Day 12)  
**Measurement date:** 2026-08-29

---

## Frontend bundle (re-verified 28.12)

| Metric | Phase 28.12 claim | 28.13 re-measure | Match |
|--------|------------------:|-----------------:|:-----:|
| Main JS raw | 111.87 KB | **111.87 KB** | ✅ |
| Main JS gzip | 37.16 KB | **37.16 KB** | ✅ |
| CSS gzip | 29.73 KB | **29.73 KB** | ✅ |
| HomePage gzip | 6.09 KB | **6.09 KB** | ✅ |
| MarketplaceShell gzip | 16.65 KB | **16.65 KB** | ✅ |
| Build time | ~11.5s | **8.6s** | ✅ (variance) |

---

## HTTP cache policy (new 28.13)

| Scenario | Before | After |
|----------|--------|-------|
| Anonymous GET `/api/v1/categories` | `no-store` (blanket) | `public, max-age=60, stale-while-revalidate=120` |
| Authenticated GET catalog | `no-store` | `private, no-store` (unchanged security) |
| Session cookie present | `no-store` | `private, no-store` (explicit) |

**Impact:** Enables safe CDN/browser caching for first-hit anonymous catalog reads; Sanctum sessions remain private.

---

## Delivery template (Nginx)

| Asset class | Before (minimal example) | After |
|-------------|-------------------------|-------|
| Hashed `/assets/*` | immutable | immutable + gzip types |
| `index.html` | not explicit | `no-cache, must-revalidate` |
| `/storage/` | not documented | 7-day public cache |
| API proxy | basic | keepalive + no Cache-Control override |

---

## Tests

| Suite | Before 28.13 | After 28.13 |
|-------|-------------|-------------|
| Vitest | 124 | **126** |
| HttpCachePolicy | — | **6/6** |
| Playwright E2E | 72/72 | **72/72** (re-run) |

---

## Not measured locally (requires production)

- CDN edge TTFB
- CDN cache hit ratio
- Real-user LCP/INP/CLS (documented for post-deploy RUM)

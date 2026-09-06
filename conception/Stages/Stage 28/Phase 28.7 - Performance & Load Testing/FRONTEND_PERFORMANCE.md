# Frontend Performance — Phase 28.7

**Date:** 2026-08-27  
**Rule:** Measurement only — **no optimization**

---

## Production build (`frontend/dist`)

Captured from asset inventory — no Lighthouse run in this phase.

### Core bundles

| Asset | Raw | Notes |
|-------|-----|-------|
| `index-iADxzyGO.js` (main) | **499,270 B (~499 KB)** | Entry chunk |
| `index-DNTpKyNo.css` | **248,845 B (~249 KB)** | Global CSS |
| `vendor-react-BjpkU8XY.js` | 194,252 B | React vendor |
| `CartesianChart-DsugK3Y2.js` | 324,777 B | Chart library (lazy route) |

### Gzip (Phase 28.4 prior baseline)

| Asset | Gzip |
|-------|------|
| Main JS | ~144 KB |
| CSS | ~34 KB |

Phase 28.7 raw sizes **consistent** with Phase 28.4 — no rebuild delta captured.

---

## Largest route chunks (top 5)

| Chunk | Size |
|-------|------|
| CartesianChart | 325 KB |
| MarketplaceShell | 190 KB |
| HomePage | 67 KB |
| VendorProducts | 52 KB |
| ChatPage | 37 KB |

---

## Runtime metrics

| Metric | Status |
|--------|--------|
| LCP / CLS / INP | **NOT MEASURED** (no Lighthouse/Playwright perf trace in 28.7) |
| Initial page load (storefront) | **NOT MEASURED** |
| Navigation timing | **NOT MEASURED** |

---

## Prior finding (unchanged)

**KI-028-018** — Large frontend bundles. Recorded as observation; not fixed.

---

## Optimization candidates (deferred)

| ID | Problem | Evidence | Phase |
|----|---------|----------|-------|
| OPT-FE-001 | Main entry ~499 KB | dist inventory | 28.10+ |
| OPT-FE-002 | CartesianChart 325 KB on analytics routes | dist inventory | 28.10+ |
| OPT-FE-003 | Capture LCP/INP on storefront + admin with Lighthouse CI | Gap | 28.8+ |

---

## Classification

**CAPTURED** — bundle sizes documented; runtime Web Vitals **PARTIAL** (not run).

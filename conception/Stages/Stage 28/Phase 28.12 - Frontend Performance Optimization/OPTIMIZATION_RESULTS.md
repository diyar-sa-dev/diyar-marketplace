# Phase 28.12 — Optimization Results

**Date:** 2026-08-27 (deep pass final)  
**Build:** Vite 6.4.3 production

---

## Bundle comparison

| Asset | Before | After | Gzip before | Gzip after |
|-------|-------:|------:|------------:|-----------:|
| `index-*.js` (main) | 499 KB | 111.87 KB | 143.59 KB | **37.16 KB** |
| `index-*.css` | 218.80 KB | 218.80 KB | 29.73 KB | 29.73 KB |
| `HomePage-*.js` | ~52 KB | 18.56 KB | 15.48 KB | **6.07 KB** |
| `MarketplaceShell-*.js` | ~210 KB | 60.74 KB | 59.29 KB | **16.65 KB** |
| `HomeBelowFoldSections-*.js` | 17× tiny | 51.64 KB | — | **11.84 KB** |
| `vendor-sweetalert2-*.js` | in main | 79.22 KB | — | **21.07 KB** (lazy) |
| `vendor-recharts-*.js` | mixed | 385.74 KB | — | **113.06 KB** (route lazy) |
| `en-*.js` / `ar-*.js` | in main | 166 / 222 KB | — | **49.55 / 57.23 KB** (dynamic) |

---

## Route chunk matrix (selected)

| Route | Chunk | Gzip | Lazy | Critical initial |
|-------|-------|-----:|------|------------------|
| `/` | HomePage + below-fold | 6.07 + 11.84 KB | partial | Hero/categories eager |
| `/category/*` | CategoryPage | 6.63 KB | yes | no |
| `/product/*` | ProductDetailsPage | 9.10 KB | yes | no |
| `/dashboard/vendor/*` | VendorSettings + modules | 9.81 KB | yes | no |
| `/admin/*` | AdminShell | 5.41 KB | yes | no |
| `/chat` | ChatPage | 10.82 KB | yes | no |

Admin/vendor/analytics code does **not** leak into main entry.

---

## Build & test timings

| Step | Duration |
|------|----------|
| Production build | ~11.5s |
| Vitest (124 tests) | ~18s |
| Playwright E2E (72 tests) | ~2.5m |

---

## Request count (homepage, cold load)

| Phase | Approx JS requests |
|-------|-------------------|
| Before optimization | 1 large main + route |
| After deep pass | main + react + router + query + icons + shell + home + locale |

Consolidating below-fold sections reduced lazy chunk count by **16** versus first 28.12 pass.

---

## Evidence files

- `_raw/build-before.txt`
- `_raw/build-after.txt`
- `_raw/build-deep-pass-final.txt`
- `_raw/component-line-count-deep-pass.txt`

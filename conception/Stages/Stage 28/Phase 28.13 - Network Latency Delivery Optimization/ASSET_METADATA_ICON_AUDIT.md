# Asset / Metadata / Icon Audit — Phase 28.13 Re-Audit

**Date:** 2026-08-29

## Icons & branding

| Asset | Path | Format | Status |
|-------|------|--------|--------|
| Favicon | `/logo_diyar.svg` | SVG | ✅ Valid reference |
| Apple touch icon | `/logo_diyar.svg` | SVG | ✅ Present |
| OG image | `/logo_diyar.svg` | SVG | ✅ Valid (P4: raster OG deferred) |

## Metadata completeness

| Tag | Value | Status |
|-----|-------|--------|
| `<title>` | Arabic + English brand | ✅ |
| `description` | Arabic marketplace description | ✅ |
| `viewport` | `width=device-width, initial-scale=1.0` | ✅ |
| `theme-color` | `#947961` (brand) | ✅ |
| `robots` | `index,follow` | ✅ |
| `og:type` | `website` | ✅ |
| `og:locale` | `ar_SA` + `en_US` alternate | ✅ |
| `twitter:card` | `summary_large_image` | ✅ |

## Removed defects

- ❌ `preconnect href="/api"` (invalid relative origin) — **removed**
- ❌ Hardcoded `dns-prefetch` to `api.diyar.com` — **removed**

## Build-time preconnect

When `VITE_BACKEND_URL` is set at build:
```html
<link rel="preconnect" href="https://api.example.com" crossorigin />
<link rel="dns-prefetch" href="https://api.example.com" />
```

Dev/preview without env: no preconnect injected (safe default).

## Image assets

- Product/media images served via `/storage/` with Nginx cache TTL
- Lazy loading patterns in product cards (28.12)
- No destructive image recompression in this phase

## CDN mode impact

OG/favicon/chunk URLs resolve to CDN origin when `VITE_CDN_BASE_URL` set — verified in build output.

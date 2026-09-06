# Asset Delivery Audit — Phase 28.13

## JavaScript

| Chunk | Gzip | Load timing |
|-------|-----:|-------------|
| index (main) | 37.16 KB | Initial |
| vendor-react | 60.73 KB | Initial |
| vendor-router | 14.02 KB | Initial |
| vendor-query | 13.87 KB | Initial |
| MarketplaceShell | 16.65 KB | Lazy (shell) |
| vendor-sweetalert2 | 21.07 KB | On demand |
| vendor-recharts | 113.06 KB | Admin/analytics routes only |
| en/ar locale | 49–57 KB | Dynamic on locale |

**No direct sweetalert2 import in main bundle** — verified via grep.

## CSS

| Asset | Gzip |
|-------|-----:|
| index.css | 29.73 KB |
| sweetalert2.css | 5.06 KB (lazy with dialog) |

## Images / media

- Product/vendor images served via `/storage` or external URLs
- HomePage ad popup: `loading="lazy"` on banner image
- Nginx template: 7-day cache for public storage files

## Icons

- lucide-react tree-shaken into `vendor-icons` chunk (14.77 KB gzip)
- favicon: static `/logo_diyar.svg` (not bundled in JS)

## Fonts

- Theme fonts via CSS (`Alexandria`, `Outfit`) — system/CDN font loading via CSS @font-face (existing)

## Metadata / PWA

- Added: description, theme-color, OG, Twitter card, preconnect
- manifest: not present (PWA out of scope V1)

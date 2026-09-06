# Phase 28.13 — Issue Register (Senior Re-Audit)

| ID | Severity | Finding | Status | Fix / Disposition |
|----|----------|---------|--------|-------------------|
| NET-013-R01 | P1 | `Authorization` header requests could receive public cache headers | **FIXED** | `ApplyHttpCachePolicy::hasAuthorizationHeader()` |
| NET-013-R02 | P1 | Private routes (cart, orders, admin) not on explicit deny-list | **FIXED** | `private_read_prefixes` in `config/diyar_delivery.php` |
| NET-013-R03 | P2 | Invalid `preconnect href="/api"` and hardcoded `api.diyar.com` dns-prefetch in index.html | **FIXED** | Removed; Vite `deliveryPreconnectPlugin` injects `VITE_BACKEND_URL` at build |
| NET-013-R04 | P2 | `DIYAR_LOADTEST_MODE` did not bypass AuthService credential throttle → E2E login storms | **FIXED** | `AuthService::shouldBypassLoginRateLimit()` + regression test |
| NET-013-R05 | P2 | E2E bootstrap could corrupt sqlite (concurrent migrate + running API) | **FIXED** | `scripts/e2e/bootstrap-stack.ps1` deletes/recreates sqlite before seed |
| NET-013-R06 | P3 | CDN not physically provisioned on Hostinger | **ACCEPTED** | Config + Nginx template ready; enable when CDN account exists |
| NET-013-R07 | P3 | Brotli at Nginx layer | **ACCEPTED** | Document gzip; enable `brotli` module when VPS supports it |
| NET-013-R08 | P3 | Production RUM (LCP/INP/CLS telemetry) | **ACCEPTED** | Requires production observability stack (Phase 28.14+) |
| NET-013-R09 | P4 | ~35 lazy route pages >250 lines (28.12 disposition) | **ACCEPTED** | Justified dashboard complexity; no behavior change in 28.13 |
| NET-013-R10 | P4 | OG image uses SVG logo (not dedicated 1200×630 PNG) | **ACCEPTED** | Valid for MVP; replace with raster OG asset when marketing provides |

## Resolved from first pass

| ID | Item |
|----|------|
| NET-013-001 | CDN config hooks — verified build |
| NET-013-002 | Nginx gzip template — verified |
| NET-013-003 | SecurityHeaders blanket no-store removed for public GET |

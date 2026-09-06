# Issue Register — Phase 28.13

| ID | Severity | Area | Description | Root cause | Fix | Status |
|----|----------|------|-------------|------------|-----|--------|
| NET-013-001 | P2 | API cache | Blanket `no-store` on all API | SecurityHeaders one-liner | ApplyHttpCachePolicy middleware | **FIXED** |
| NET-013-002 | P2 | Nginx | Incomplete SPA cache template | Minimal example config | Full production.conf.example | **FIXED** |
| NET-013-003 | P3 | CDN | No CDN integration hooks | Not yet deployed | env + Vite base URL | **FIXED** |
| NET-013-004 | P3 | SEO/metadata | Sparse index.html metadata | Phase focus was bundle | OG/Twitter/preconnect | **FIXED** |
| NET-013-005 | P4 | CDN | Brotli not in template | Module availability varies | Document gzip; brotli optional | **ACCEPTED** |
| KI-028-041 | P1 | Frontend | Ad popup blocked sidebar | z-index | Fixed in 28.12 | **RESOLVED** |
| OPT-E2E-001 | P1 | QA | E2E without API | Environment | 72/72 with stack | **RESOLVED** |

## Carried forward (non-blocking)

| ID | Severity | Area | Status | Target |
|----|----------|------|--------|--------|
| OPT-COMP-010 | P3 | Components | ~35 pages >250 lines | Incremental maintainability |
| NET-013-RUM | P4 | Observability | Production RUM not configured | Post-hosting |

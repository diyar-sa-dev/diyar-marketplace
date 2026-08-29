# Phase 28.13 — Before / After (Senior Re-Audit)

**Date:** 2026-08-29

## Bundle (Phase 28.12 baseline — re-verified, unchanged)

| Metric | Before 28.12 | After 28.12 / 28.13 | Delta |
|--------|--------------|---------------------|-------|
| Main JS gzip | ~144 KB | **37.16 KB** | −74% |
| Main CSS gzip | — | **29.73 KB** | — |
| Recharts in initial bundle | Yes | Lazy chunk only | ✅ |

## HTTP caching (28.13)

| Scenario | Before 28.13 | After 28.13 re-audit |
|----------|--------------|----------------------|
| Anonymous catalog GET | Blanket no-store (SecurityHeaders) | `public, max-age=60, swr=120` |
| Bearer token on public route | Could get public cache | **no-store** |
| Cart/orders/admin GET | No explicit deny-list | **no-store via prefix deny-list** |
| Platform theme | no-store | `public, max-age=300` |

## Frontend metadata

| Item | Before | After |
|------|--------|-------|
| OG/Twitter tags | Partial / missing | Complete |
| Preconnect | Invalid `/api` + hardcoded host | Env-driven Vite plugin |
| robots / theme-color | Missing | Present |

## E2E reliability

| Item | First 28.13 pass | Re-audit |
|------|------------------|----------|
| Playwright | 34/72 (stale API + throttle) | **72/72** |
| Bootstrap procedure | Ad-hoc | `bootstrap-stack.ps1` |
| Auth credential throttle in loadtest | Not bypassed | **Bypassed** |

## Tests

| Suite | First pass | Re-audit |
|-------|------------|----------|
| HttpCachePolicyTest | 6 | **9** |
| Vitest | 126 | **126** |
| Playwright | 34/72 | **72/72** |

## Score progression

| Pass | Score | Verdict |
|------|-------|---------|
| First 28.13 | 9.7/10 | COMPLETE (E2E environmental caveat) |
| Senior re-audit | **9.8/10** | **COMPLETE** (evidence-backed) |

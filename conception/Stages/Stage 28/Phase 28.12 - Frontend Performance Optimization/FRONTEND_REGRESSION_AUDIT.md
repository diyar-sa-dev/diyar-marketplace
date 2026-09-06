# Phase 28.12 — Frontend Regression Audit (Deep Pass)

**Date:** 2026-08-27  
**Scope:** Second-pass forensic QA after Phase 28.12 optimization work  
**Result:** **No blocking regressions** — 72/72 E2E PASS

---

## Areas audited

| Area | Method | Result |
|------|--------|--------|
| Lazy route loading | Code review + E2E navigation | ✅ `lazyWithRetry` on shell routes |
| i18n dynamic locales | Code review + Vitest + manual RTL | ✅ Prefetch + no flash on switch |
| SweetAlert deferred load | Grep `sweetalert2` / `Swal` | ✅ All via `swalLoader.ts`; vendor chunk isolated |
| Homepage sections | Compare render order vs original | ✅ All sections present; below-fold lazy |
| TanStack Query stale data | Review 28.11 staleTime changes | ✅ No stale-data bugs in E2E |
| Realtime subscriptions | Code review `useChat`, Echo providers | ✅ No duplicate subscription pattern found |
| Z-index / modal stacking | KI-028-041 regression tests | ✅ **FIXED** — ad popup `z-40` |
| Upload flows | Upload smoke E2E | ✅ **FIXED** — correct API assertion |
| B2B admin journeys | Serial E2E | ✅ **FIXED** — session + optional verify |
| Responsive overflow | 28 viewport smokes | ✅ PASS |
| Chunk load errors | `lazyWithRetry` implementation | ✅ One reload guard via sessionStorage |
| Auth isolation | Dual-session E2E | ✅ PASS |

---

## Regressions found and fixed

| ID | Severity | Description | Root cause | Fix | Status |
|----|----------|-------------|------------|-----|--------|
| REG-28.12-001 | P1 | Sidebar projects blocked by homepage ad | Ad popup `z-300` above drawer | Lower to `z-40` | **FIXED** |
| REG-28.12-002 | P1 | Upload smoke always failed | Test polled `/auth/me` for `logo_url` (field absent) | Poll `/dashboard/vendor/settings` | **FIXED** |
| REG-28.12-003 | P1 | B2B customer admin API test failed | Bare `request` fixture without session cookies | Use `page.request` after UI login | **FIXED** |
| REG-28.12-004 | P2 | B2B publish test timeout on verify | Verify button hidden when already verified | Optional verify click | **FIXED** |
| REG-28.12-005 | P2 | 17 tiny homepage lazy chunks | Over-aggressive dynamic imports | Single `HomeBelowFoldSections` chunk | **FIXED** |
| REG-28.12-006 | P2 | Locale switch full-app unmount | Catalog swap remounted tree | Keep prior locale until loaded | **FIXED** |
| REG-28.12-007 | P3 | ESLint `set-state-in-effect` in LocaleProvider | Sync setState in effect | Derive ready from catalog + async bootstrap | **FIXED** |

---

## Second independent audit (senior review)

Questions asked:
- Missed lazy loading bugs? → Shell routes use retry; below-fold consolidated
- Bundle bloat reintroduced? → Main still 37 KB gzip; no direct sweetalert/locale in main
- Query duplication? → Chat focus refetch disabled; vendor/provider 60s staleTime OK in E2E
- Memory leaks? → No new listener patterns in refactored sidebar/vendor settings
- E2E false greens? → Full 72-test suite against live API; not subset-only

**Finding:** No additional P0/P1 issues beyond those fixed above.

---

## Comparison to Phase 28.4 / 28.5 baseline

| Metric | Phase 28.4 | Phase 28.12 deep pass |
|--------|------------|----------------------|
| Vitest | PASS | **124/124 PASS** |
| E2E | 33/36 (3 env skips) | **72/72 PASS** |
| Main bundle | ~144 KB gzip | **37 KB gzip** |

Phase 28.12 exceeds Phase 28.4 E2E coverage and pass rate.

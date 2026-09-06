# Phase 28.12 — Frontend Performance Issues

## Fixed (first + deep pass)

| ID | Priority | Issue | Status |
|----|----------|-------|--------|
| OPT-PERF-001 | P0 | Both locale catalogs bundled in main entry (~500 KB JS) | **FIXED** — `localeCatalog.ts` |
| OPT-PERF-002 | P0 | SweetAlert2 loaded synchronously on every page | **FIXED** — `swalLoader.ts` |
| OPT-PERF-003 | P1 | Homepage monolith `Sections.tsx` (1,607 lines) | **FIXED** — 20 sections + lazy below-fold |
| OPT-PERF-004 | P1 | MarketplaceShell inflated by locale bundle | **FIXED** |
| OPT-PERF-005 | P1 | Chat conversations refetch on window focus | **FIXED** |
| OPT-PERF-006 | P2 | Recharts not in dedicated vendor chunk | **FIXED** |
| OPT-PERF-007 | P2 | framer-motion not isolated | **FIXED** |
| OPT-PERF-008 | P1 | Over-split homepage lazy sections (17 chunks) | **FIXED** — `HomeBelowFoldSections` |
| OPT-PERF-009 | P1 | ChunkLoadError on deploy with no recovery | **FIXED** — `lazyWithRetry.ts` |
| OPT-PERF-010 | P1 | Locale switch remounts entire app | **FIXED** — `LocaleProvider` |
| OPT-COMP-001 | P1 | `SidebarMenu.tsx` 1,169 lines | **FIXED** — 10-file module |
| OPT-COMP-002 | P1 | `VendorSettings.tsx` 1,163 lines | **FIXED** — 16-file module |
| REG-28.12-001 | P1 | Ad popup blocks sidebar (KI-028-041) | **FIXED** — z-index |
| REG-28.12-002 | P1 | Upload E2E false failure | **FIXED** — correct API poll |
| REG-28.12-003 | P1 | B2B admin session E2E | **FIXED** — `page.request` |

## Verified / unchanged

| ID | Priority | Issue | Status |
|----|----------|-------|--------|
| OPT-PERF-011 | — | Route-level lazy loading for admin/dashboard | **VERIFIED** |
| OPT-PERF-012 | — | API contracts | **VERIFIED** |
| OPT-PERF-013 | — | Server pagination on large lists | **VERIFIED** |

## Accepted (non-blocking)

| ID | Priority | Issue | Status | Notes |
|----|----------|-------|--------|-------|
| OPT-COMP-010 | P3 | ~35 route pages still >250 lines | **ACCEPTED** | Maintainability-only; lazy-loaded; no initial bundle impact |
| OPT-PERF-014 | P4 | Locale switch may show brief spinner on first load | **ACCEPTED** | Prevents untranslated flash |
| OPT-PERF-015 | P4 | `MarketplaceShell.tsx` ~365 lines | **ACCEPTED** | Header extraction is maintainability, not perf |

## Closed environmental

| ID | Priority | Issue | Status | Notes |
|----|----------|-------|--------|-------|
| OPT-E2E-001 | P1 | Playwright failures without API | **CLOSED** | 72/72 PASS with sqlite stack |

## Phase gate

- **No open P0 or P1 issues**
- Full E2E verified on working stack
- Phase 28.12 **COMPLETE 10/10**

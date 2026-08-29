# Phase 28.15 — Before / After (Re-Audit Update)

## REAUD-015-001 — E2E projects modal ad dismiss

| | Before | After |
|---|--------|-------|
| **Symptom** | Playwright 71/72 — timeout clicking close | 72/72 PASS |
| **Root cause** | Helper matched announcement bar close behind ad overlay | Scoped to `home-ad-popup` test id |
| **File** | `frontend/e2e/projects-modal-regression.spec.ts` | |

## E2E certification honesty

| | Before (initial 28.15 cert) | After (re-audit) |
|---|---------------------------|------------------|
| Playwright | "72/72 baseline from 28.13 — not re-run" | **72/72 fresh run** with bootstrap |
| First fresh run | — | 71/72 (found bug) |
| After fix | — | **72/72** |

## MySQL index verification

| | Before (sqlite PHPUnit) | After (mysql run) |
|---|------------------------|-------------------|
| ProductListIndexTest + CatalogAndOrderIndexTest | 4 skipped | **6/6 PASS** |

## PHPUnit full suite

| Metric | Initial 28.15 | Re-audit |
|--------|---------------|----------|
| Passed | 764 | **764** |
| Failed | 0 | **0** |
| Skipped | 6 | **6** (justified) |

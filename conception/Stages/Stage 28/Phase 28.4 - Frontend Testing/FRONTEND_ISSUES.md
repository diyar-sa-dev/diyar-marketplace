# Phase 28.4 — Frontend Issues

**Baseline:** `92638a9`  
**New IDs:** KI-028-041 through KI-028-048

---

## Issue summary (Phase 28.4 new)

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| P2 | 2 |
| P3 | 5 |
| P4 | 1 |

---

## P2 — Major

### KI-028-041 — Projects modal intercepts sidebar navigation

| Field | Value |
|-------|-------|
| **Area** | Navigation / Projects sidebar |
| **Severity** | P2 |
| **Category** | PRODUCT DEFECT |
| **Environment** | Playwright Chromium vs `composer dev` |
| **Route/component** | `/` → Projects modal; `projects.spec.ts` |
| **Reproduction** | Load home → header click opens dialog → click Projects button |
| **Expected** | Projects panel opens; API project visible |
| **Actual** | `role="dialog"` overlay intercepts pointer events; 90s timeout |
| **Evidence** | `_frontend_playwright.txt`; screenshot `frontend/test-results/projects-*/` |
| **Impact** | Users may be blocked from Projects entry when modal/dialog open |
| **Root cause** | Likely z-index / modal stacking or header opens blocking dialog first |
| **Status** | OPEN — **CONFIRMED Phase 28.4** (extends KI-028-008) |
| **Recommended phase** | 28.5 fix + E2E |

### KI-028-048 — Playwright E2E failures on local dev DB (seed parity)

| Field | Value |
|-------|-------|
| **Area** | E2E environment |
| **Severity** | P2 |
| **Category** | ENVIRONMENT GAP |
| **Environment** | Local MariaDB dev vs CI sqlite seed |
| **Specs** | `b2b-admin.spec.ts`, `blog.spec.ts` (+ serial skips) |
| **Reproduction** | `npm run test:e2e` with `composer dev` |
| **Expected** | Draft B2B visible in admin filter; blog article API OK |
| **Actual** | Draft not found; blog article GET not OK |
| **Evidence** | `_frontend_playwright.txt` — 3 failed, 3 skipped |
| **Impact** | False-negative E2E locally; CI may pass |
| **Root cause** | Dev DB lacks E2E fixture data |
| **Status** | OPEN (extends KI-028-003, KI-028-004, KI-028-009) |
| **Recommended phase** | 28.5 CI seed parity doc + optional local seed script |

---

## P3 — Medium

### KI-028-042 — Admin SPA has no dedicated 404 route

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | UX GAP |
| **Component** | `AdminShell.tsx` catch-all → redirect `/admin` |
| **Impact** | Invalid admin URLs silently land on dashboard |
| **Status** | OPEN |
| **Recommended phase** | 28.9+ or product acceptance |

### KI-028-044 — French (`fr`) locale not implemented

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Category** | DOCUMENTATION / PRODUCT GAP |
| **Evidence** | `SUPPORTED_LOCALES` = `ar`, `en` only |
| **Impact** | Phase 28.4 French LTR testing **N/A** |
| **Status** | OPEN |
| **Recommended phase** | Product decision; not a 28.4 fix |

### KI-028-045 — Responsive viewport matrix NOT VERIFIED

| Field | Value |
| **Severity** | P3 |
| **Category** | TEST GAP |
| **Status** | OPEN |
| **Recommended phase** | 28.5 Playwright viewport projects |

### KI-028-046 — File upload UI failure/progress NOT VERIFIED

| Field | Value |
| **Severity** | P3 |
| **Category** | TEST GAP |
| **Status** | OPEN |
| **Recommended phase** | 28.5 |

### KI-028-047 — Accessibility smoke NOT VERIFIED

| Field | Value |
| **Severity** | P3 |
| **Category** | TEST GAP |
| **Status** | OPEN |
| **Recommended phase** | 28.6 |

---

## P4 — Informational

### KI-028-043 — Vitest `act(...)` warnings

| Field | Value |
| **Severity** | P4 |
| **Category** | TEST DEFECT |
| **Files** | `AuthContext.test.tsx`, `B2BCompanyPage.test.tsx` |
| **Status** | OPEN (extends KI-028-013) |
| **Recommended phase** | 28.8 hygiene |

---

## Carried forward (relevant to frontend)

| ID | Status in 28.4 |
|----|----------------|
| KI-028-003/004/009 | Confirmed — see KI-028-048 |
| KI-028-008 | Confirmed — see KI-028-041 |
| KI-028-013 | Still present — KI-028-043 |
| KI-028-017 | Playwright port conflict when dev server up |
| KI-028-018 | Large bundles — smoke captured, not optimized |
| KI-028-030 | Backend MySQL 8 full suite — not frontend |
| KI-028-037 | Assistant API untested — frontend `api/assistant.ts` exists |

---

## Release blockers (P0/P1/P2)

1. **KI-028-041** — Projects modal blocks navigation (product)
2. **KI-028-048** — E2E seed parity required for certified E2E gate (environment/process)

*Note:* KI-028-048 is process/environment — CI E2E may already pass; local dev certification incomplete.

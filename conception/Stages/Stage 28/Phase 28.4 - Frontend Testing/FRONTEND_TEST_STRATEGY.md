# Phase 28.4 — Frontend Test Strategy

**Date:** 2026-08-27  
**Commit:** `92638a9`

---

## Purpose

Determine whether the DIYAR frontend is **functionally correct, API-integrated, resilient across UI states, localized, and free of release-blocking defects** — without optimizing or redesigning.

**Testing happens before optimization.**

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Route inventory | UI redesign |
| API client ↔ backend contract inspection | Bundle optimization |
| Vitest + Playwright execution | Backend/API changes |
| Auth UI state (route guards) | Database changes |
| Static analysis (lint, typecheck, build) | Load testing (→ 28.7) |
| RTL (ar) + LTR (en) source inspection | Full WCAG audit (→ 28.6) |
| Playwright journey coverage | Visual regression suite |
| Issue classification | Fixing product defects |

---

## Application stack (measured)

| Layer | Technology |
|-------|------------|
| Framework | React **19** |
| Build | Vite **6** |
| Routing | React Router **7** |
| Data fetching | TanStack Query **5** |
| HTTP | Axios (Sanctum cookies + CSRF) |
| Styling | Tailwind CSS **4** |
| i18n | Custom `translate()` — **ar**, **en** |
| Realtime | Laravel Echo + Pusher-js |
| Unit tests | Vitest **3.2** + Testing Library |
| E2E | Playwright **1.62** |

Entry: `frontend/src/main.tsx` → `App.tsx` splits **marketplace** vs **admin** (`/admin/*`).

---

## Test layers

| Layer | Command | Environment |
|-------|---------|-------------|
| Unit/component | `npm run test` | jsdom |
| Typecheck | `npm run typecheck` | tsc |
| Lint | `npm run lint` | ESLint (scoped paths) |
| Format | `npm run format:check` | Prettier (scoped) |
| Build | `npm run build` | production Vite |
| E2E | `npm run test:e2e` | Chromium vs `composer dev` API |

---

## Environment labeling

| Label | Meaning |
|-------|---------|
| **Vitest verified** | Automated component/unit pass |
| **Playwright verified** | Browser E2E pass |
| **Source inspected** | Code review only |
| **NOT VERIFIED** | No evidence |

Local E2E uses **MariaDB dev DB** (not CI sqlite seed) — same caveat as Phase 28.1/28.3.

---

## Carry-forward (do not re-open)

- PostgreSQL rejected (Stage 28.2)
- KI-028-030 MySQL 8 full backend suite partial
- KI-028-021 shipping unit test flaky (backend, not frontend)

---

## Production frontend gates

1. Vitest + typecheck + lint + build **PASS**
2. Playwright critical journeys **PASS** on CI seed environment
3. No open P0/P1 frontend defects
4. Auth route guards verified
5. API error handling documented for 401/403/422

---

## Regression policy

Record defects first. Add tests only when needed to preserve evidence — do not change product behavior to green tests.

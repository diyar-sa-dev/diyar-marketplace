# Phase 28.5 — E2E Issues

**New IDs:** KI-028-049 through KI-028-052

---

## Issue summary (new)

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 0 |
| P2 | 1 |
| P3 | 3 |
| P4 | 0 |

---

## P2

### KI-028-050 — Homepage ad popup blocks sidebar navigation (timing/flaky)

| Field | Value |
|-------|-------|
| **Severity** | P2 |
| **Classification** | PRODUCT DEFECT + TEST FLAKINESS |
| **Component** | `HomePage.tsx` ad dialog (`z-300`) vs `SidebarMenu` (`z-60`) |
| **Reproduction** | Open `/` → wait >5s → open sidebar → click Projects |
| **Expected** | Projects modal opens |
| **Actual** | Ad overlay intercepts pointer events |
| **Evidence** | Phase 28.4/28.5 Playwright; 5/5 pass in isolation when <5s |
| **Root cause** | `setTimeout(..., 5000)` ad popup stacks above sidebar |
| **Status** | OPEN (extends KI-028-041) |
| **Phase** | Fix UX stacking or dismiss-on-sidebar-open → 28.9+ |

---

## P3

### KI-028-049 — Redis cache stale after DB engine switch

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Classification** | ENVIRONMENT / CACHE |
| **Reproduction** | Switch MariaDB→SQLite without `cache:clear`; GET blog slug |
| **Actual** | Cached 404 served |
| **Fix** | `php artisan cache:clear` in E2E bootstrap |
| **Status** | OPEN — document in bootstrap |
| **Phase** | 28.8 hygiene |

### KI-028-051 — b2b-admin customer API test uses wrong request context

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Classification** | TEST BUG |
| **Evidence** | Unauthenticated admin API → 401; test got 200 from worker session bleed |
| **Status** | OPEN |
| **Phase** | Fix test to use isolated storageState |

### KI-028-052 — Vendor logo upload E2E not verified end-to-end

| Field | Value |
|-------|-------|
| **Severity** | P3 |
| **Classification** | TEST GAP |
| **Status** | OPEN (extends KI-028-046) |
| **Phase** | Harden upload E2E with save trigger + storage check |

---

## Resolved / updated

| ID | Update |
|----|--------|
| **KI-028-048** | **RESOLVED WITH PROCEDURE** — CI-parity bootstrap documented; blog/b2b E2E pass on seeded SQLite |
| **KI-028-041** | **CONFIRMED** → merged into KI-028-050 |
| **KI-028-045** | **PARTIAL** — responsive smoke 29/29 pass; checkout/dashboard not in matrix |
| **KI-028-046** | **PARTIAL** — upload smoke attempted; persistence not verified |

---

## Carried forward (unchanged)

KI-028-020, KI-028-021, KI-028-030, KI-028-037, KI-028-047, KI-028-024

---

## Release blockers (P0/P1/P2)

- **KI-028-050** — Ad popup vs sidebar (P2 UX/flakiness; not commerce-blocking on CI when fast)

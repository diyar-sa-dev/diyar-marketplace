# Phase 28.5 — E2E Flakiness Assessment

---

## projects.spec.ts — 5 repetition run

**Environment:** CI-parity SQLite stack (:8000/:3000)  
**Raw:** `_e2e_projects_flakiness.txt`

| Run | Result | Duration |
|-----|--------|----------|
| 1 | **PASS** | 5.4s |
| 2 | **PASS** | 5.4s |
| 3 | **PASS** | 4.1s |
| 4 | **PASS** | 6.4s |
| 5 | **PASS** | 5.0s |

**Isolated classification:** **DETERMINISTIC PASS**

---

## Full suite behavior

| Context | projects.spec.ts |
|---------|------------------|
| Phase 28.4 dev MariaDB | **FAIL** (90s timeout — ad popup intercept) |
| Phase 28.5 CI-parity full suite (72 tests) | **PASS** (20.6s) |
| Phase 28.5 regression dismiss test | **FAIL** (close selector ineffective) |

---

## Root cause (KI-028-041 / KI-028-050)

`HomePage.tsx` shows promotional dialog after **5 seconds** (`setTimeout 5000`):

- Overlay: `z-300`, `role="dialog"`, `aria-modal="true"`
- Sidebar: `z-60`
- When popup visible, Projects button in sidebar is **not clickable**

**Failure mode:** **TIMING-DEPENDENT**

- Fast isolated run (<5s to click Projects): **PASS**
- Slow parallel suite (homepage open >5s before Projects click): **FAIL**

---

## Other flaky candidates

| Test | Observation |
|------|-------------|
| `ShippingRulePrecedenceTest` (PHPUnit) | KI-028-021 — backend unit, not E2E |
| `b2b-admin` customer auth test | KI-028-051 — test isolation, not product flakiness |

---

## Gate

```text
PARTIAL
```

Projects journey flaky under full parallel load; deterministic in isolation.

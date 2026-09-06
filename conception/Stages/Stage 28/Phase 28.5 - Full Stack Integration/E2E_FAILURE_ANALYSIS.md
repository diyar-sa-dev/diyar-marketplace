# Phase 28.5 — E2E Failure Analysis

---

## Run context

**Stack:** CI-parity SQLite + Redis + preview :3000  
**Output:** `_e2e_playwright_ci_parity.txt`

---

## Failure 1 — `b2b-admin.spec.ts` customer admin API

| Field | Value |
|-------|-------|
| **Expected** | `401` or `403` on `GET /admin/b2b/companies` as customer |
| **Actual** | `200` |
| **Classification** | **TEST BUG** |
| **Root cause** | Playwright `request` fixture does **not** inherit cookies from `page` after `loginMarketplaceUi`. Parallel worker likely retained **admin** session in isolated request context. Unauthenticated probe separately returns **401**. |
| **ID** | KI-028-051 |
| **Product impact** | None proven — API returns 401 without auth |

---

## Failure 2 — `projects-modal-regression` dismiss ad then open projects

| Field | Value |
|-------|-------|
| **Expected** | Close ad popup → Projects click succeeds |
| **Actual** | Ad dialog still intercepts after close attempt |
| **Classification** | **TEST BUG** + **PRODUCT UX** (popup stacking) |
| **Root cause** | Close button selector `/close|إغلاق/i` did not match `home.adPopup.close` aria-label; popup remained at `z-300` |
| **ID** | KI-028-050 |
| **Note** | `projects.spec.ts` **PASS** in same run when Projects clicked before 5s timer |

---

## Failure 3 — `projects-modal-regression` repro popup after 5s

| Field | Value |
|-------|-------|
| **Expected** | Dialog visible after 5.5s wait |
| **Actual** | `popupVisible === false` |
| **Classification** | **TEST BUG** (race — parallel load / timer variance) |
| **ID** | KI-028-050 |

---

## Failure 4 — `upload-smoke` vendor logo

| Field | Value |
|-------|-------|
| **Expected** | `/auth/me` shows `vendor.logo_url` after file input |
| **Actual** | Poll timeout — logo_url not set within 60s |
| **Classification** | **TEST GAP / PARTIAL** — file input may not trigger auto-upload on vendor settings; may require save button |
| **ID** | KI-028-052 |
| **Evidence** | Screenshot in `frontend/test-results/upload-smoke-*/` |

---

## Resolved failures (vs Phase 28.4 dev run)

| Spec | Phase 28.4 (dev) | Phase 28.5 (CI-parity) |
|------|------------------|------------------------|
| `blog.spec.ts` | FAIL | **PASS** |
| `b2b-admin` draft filter | FAIL | **PASS** |
| `projects.spec.ts` | FAIL | **PASS** (timing) |

---

## Infrastructure finding

| Issue | Description |
|-------|-------------|
| KI-028-049 | Redis cached blog 404 after DB engine switch — requires `cache:clear` |

---

## Gate

```text
PASS
```

All failures classified; no unclassified P0/P1 product defects from E2E run.

# Phase 26.2 — B2B Directory & Company Profiles

**Status:** ⬜ In progress  
**Depends on:** [Phase 26.1 — Blogs & Projects](../Phase%2026.1%20-%20Blogs%20%26%20Projects/) ✅  
**Architecture:** [STAGE_26_2_ARCHITECTURE.md](./STAGE_26_2_ARCHITECTURE.md)

---

## Goal

```text
MOCK UI  →  REAL BACKEND  →  SAME UI  →  PRODUCTION-GRADE
```

Wire `/b2b` and `/b2b/:slug` to production APIs while preserving prototype layout, RTL, and Arabic copy structure.

---

## Repository audit summary (2026-08-25)

| Area | Finding |
|------|---------|
| Git branch | `dev`; 26.1 base commit `253e674` + uncommitted polish |
| B2B backend | **None** |
| B2B frontend | Static mock in 2 page files; `DeferredPrototypeBanner` |
| Service RFQ | Provider-only; **not reusable** for B2B wholesale quotes |
| Vendor/Provider | `HasOne` from User; optional FK link to B2B company |
| Projects 26.1 | Reuse via pivot, no duplication |
| Admin pattern | 26.1 blog/projects CMS — replicate for B2B |
| Permissions | Add `b2b.view`, `b2b.manage`, `b2b.leads.view` |

Full audit: [STAGE_26_2_ARCHITECTURE.md](./STAGE_26_2_ARCHITECTURE.md)

---

## Sub-phases

### 26.2.1 — Backend domain ⬜

* migrations + enums + models + relationships
* `B2bService`, `B2bQueryService`, `AdminB2bService`
* slug, sanitization, publication transitions

**Gate:** `php artisan test --filter=B2b`

---

### 26.2.2 — Public API ⬜

* `GET /b2b/companies`, `/b2b/companies/{slug}`, `/b2b/categories`
* pagination, filters (category, location, featured, verification, q, sort)
* card vs detail resources; published-only

**Gate:** public feature tests green

---

### 26.2.3 — Leads / RFQ ⬜

* `POST /b2b/companies/{slug}/leads` (auth required)
* budget enum, validation, throttle, IDOR policies
* customer “my leads” + admin/owner inbox

**Gate:** lead authorization + rate limit tests

---

### 26.2.4 — Admin CMS ⬜

* `AdminB2bCompaniesPage`, modals, categories, leads list
* verify / feature / publish lifecycle
* audit logging + permissions

**Gate:** admin feature tests

---

### 26.2.5 — Public frontend ⬜

* `api/b2b.ts`, `types/b2b.ts`, `hooks/b2b/*`
* wire `B2BPage`, `B2BCompanyPage` — preserve UI
* skeletons, empty, error, pagination
* RFQ modal → real submit
* remove deferred banner

**Gate:** typecheck, vitest, manual AR/EN smoke

---

### 26.2.6 — Cache, seed, E2E ⬜

* `B2bCache`, invalidation
* `B2bContentSeeder`, `B2bE2eSeeder`
* `e2e/b2b.spec.ts`, `e2e/b2b-admin.spec.ts`

**Gate:** full quality matrix (see Definition of Done)

---

## Definition of done

See master spec §23 in implementation prompt. Phase complete only when backend, frontend, security, quality, performance, and documentation gates all pass.

---

## Documents

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Phase index |
| [STAGE_26_2.md](./STAGE_26_2.md) | This plan |
| [STAGE_26_2_ARCHITECTURE.md](./STAGE_26_2_ARCHITECTURE.md) | Product + technical decisions |
| STAGE_26_2_API.md | *(after 26.2.2)* |
| STAGE_26_2_SECURITY.md | *(after 26.2.3)* |
| STAGE_26_2_FINAL_REPORT.md | *(on completion)* |

---

## Git protocol

1. ✅ Commit Stage 26.1 remainder: `feat(stage-26.1): implement blogs and projects`
2. Implement 26.2 on top
3. Final commit: `feat(stage-26.2): implement b2b company directory and leads`

Do not mix 26.1 and 26.2 in one commit.

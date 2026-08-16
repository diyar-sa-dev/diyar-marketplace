# Stage 4 — Catalog & Products — Implementation Plan

> **Status:** IN PROGRESS  
> **Authorization:** PO authorized Stage 4 on 2026-08-16  
> **Entry audit:** [STAGE_4_ENTRY_AUDIT.md](./STAGE_4_ENTRY_AUDIT.md)  
> **Previous stage:** Stage 3 — COMPLETE / FINALIZED

---

## Objective

Implement the complete V1 catalog and product domain, connect the existing storefront to real APIs, and leave the repository in a verified **Stage 4 COMPLETE / FINALIZED** state.

---

## Scope

### In scope

- Categories (hierarchy, slugs, ordering, active/inactive)
- Products (vendor-owned, full V1 field set)
- Product colors and images (max 5, Stage 3 media abstraction)
- Basic inventory + audited movements
- Vendor product CRUD (ownership-protected)
- Public catalog APIs (list, detail, search, category browse)
- Storefront integration (`/`, `/category/*`, `/product/*`, `/store/*`, `/search`)
- Automated tests (backend + frontend critical paths)
- Documentation and completion reports

### Out of scope (explicit)

- Cart, checkout, payments, orders
- Reviews subsystem (aggregate placeholders only)
- Affiliate, AI, chat, loyalty, service marketplace
- Full vendor application/approval workflow (extend stub only)
- Checkout inventory reservations (Stage 5+)
- Postman collection update (optional follow-up)
- Storefront full i18n (catalog strings may remain Arabic-primary in V1)

---

## Phases

| Phase | Name | Plan | Status |
|-------|------|------|--------|
| 4.1 | Categories | [PHASE_4.1_PLAN.md](./Phase%204.1%20-%20Categories/PHASE_4.1_PLAN.md) | Pending |
| 4.2 | Product Model | [PHASE_4.2_PLAN.md](./Phase%204.2%20-%20Product%20Model/PHASE_4.2_PLAN.md) | Pending |
| 4.3 | Product CRUD | [PHASE_4.3_PLAN.md](./Phase%204.3%20-%20Product%20CRUD/PHASE_4.3_PLAN.md) | Pending |
| 4.4 | Product Detail | [PHASE_4.4_PLAN.md](./Phase%204.4%20-%20Product%20Detail/PHASE_4.4_PLAN.md) | Pending |
| 4.5 | Storefront | [PHASE_4.5_PLAN.md](./Phase%204.5%20-%20Storefront/PHASE_4.5_PLAN.md) | Pending |

---

## Architectural Decisions

See [STAGE_4_ENTRY_AUDIT.md §8](./STAGE_4_ENTRY_AUDIT.md#8-architectural-decisions-for-stage-4).

Key points:

- UUID PKs throughout
- Extend `vendor_accounts` for storefront fields
- Add `media_files` for product images
- Basic inventory in Stage 4
- Reviews deferred; related products by same category
- Pagination via existing `ApiResponse` envelope

---

## Regression Baseline

| Check | Pre–Stage 4 (2026-08-16) |
|-------|--------------------------|
| Backend tests | **75 / 75** |
| Frontend tests | **45 / 45** |

Re-run after every phase and before final sign-off.

---

## Stage 4 Master Checklist

### Architecture

- [x] Entry audit completed
- [x] Stage 0–3 documentation reconciled
- [x] Architectural decisions documented
- [x] Stage 4 plan documented
- [ ] Phase plans documented (4.1–4.5)

### Phase 4.1 — Categories

- [ ] Schema + model
- [ ] Hierarchy support
- [ ] Public API
- [ ] Admin operations
- [ ] Tests passing
- [ ] Phase completion report

### Phase 4.2 — Product Model

- [ ] Vendor account extension
- [ ] Product schema + colors + images + media_files
- [ ] Inventory tables
- [ ] Model tests
- [ ] Phase completion report

### Phase 4.3 — Product CRUD

- [ ] Vendor create/read/update/archive
- [ ] Inventory adjustment endpoint
- [ ] Image management
- [ ] IDOR tests
- [ ] Phase completion report

### Phase 4.4 — Product Detail

- [ ] Detail API with vendor/category/images/colors/inventory
- [ ] Related products
- [ ] Reviews boundary handled
- [ ] Frontend product page wired
- [ ] Phase completion report

### Phase 4.5 — Storefront

- [ ] API client + types + hooks
- [ ] Category, store, search pages
- [ ] Homepage catalog sections
- [ ] Loading/error/empty states
- [ ] No mock catalog on connected paths
- [ ] Phase completion report

### Finalization

- [ ] Full backend test suite pass
- [ ] Full frontend test suite pass
- [ ] TypeScript pass
- [ ] Production build pass
- [ ] Pint + Prettier pass
- [ ] API documentation updated
- [ ] STAGE_4_COMPLETION_REPORT.md
- [ ] CURRENT_STATE.md → COMPLETE / FINALIZED

---

## Execution Rules

1. **Do not skip phases** while blocking failures remain
2. **Do not regress Stage 3** — run full suite after each phase
3. **Reuse patterns** — policies, services, ApiResponse, MediaUploadService, TanStack Query hooks
4. **No duplicate architecture** — search before creating new services
5. **Document blockers** — stop task, record decision, continue independent work only

---

## Deliverables

| Artifact | Path |
|----------|------|
| Entry audit | `STAGE_4_ENTRY_AUDIT.md` |
| Stage plan | `STAGE_4_PLAN.md` |
| Phase plans | `Phase 4.x — */PHASE_4.x_PLAN.md` |
| Phase completion reports | `Phase 4.x — */PHASE_4.x_COMPLETION_REPORT.md` |
| Stage completion report | `STAGE_4_COMPLETION_REPORT.md` (after all phases) |
| Current state | `.agent/CURRENT_STATE.md` |

---

## Next Step

Begin **Phase 4.1 — Categories** per [PHASE_4.1_PLAN.md](./Phase%204.1%20-%20Categories/PHASE_4.1_PLAN.md).

# Stage 18 — Implementation Plan

**Date:** 2026-08-22  
**Prerequisite:** [STAGE_18_ENTRY_AUDIT.md](./STAGE_18_ENTRY_AUDIT.md), [ADMIN_CAPABILITY_MATRIX.md](./ADMIN_CAPABILITY_MATRIX.md), [STAGE_18_ARCHITECTURE.md](./STAGE_18_ARCHITECTURE.md) reviewed  
**Baseline branch:** `dev` @ `b66e058`

---

## 1. Implementation Sequence

```text
STEP 1  Repository audit                    ✅ COMPLETE
STEP 2  Stage folder reconstruction         ✅ COMPLETE
STEP 3  Admin capability matrix             ✅ COMPLETE
STEP 4  Architecture + plan                 ✅ COMPLETE (this doc)
STEP 5  Phase 18.1 — Admin foundation       ⬜ NEXT
STEP 6  Validate 18.1
STEP 7  Phase 18.2 Tier 1 resources         ⬜
STEP 8  Validate Tier 1
STEP 9  Phase 18.2 Tier 2 resources         ⬜
STEP 10 Validate Tier 2
STEP 11 Phase 18.2 Tier 3                   ⬜
STEP 12 Phase 18.3 configuration            ⬜
STEP 13 Security audit                      ⬜
STEP 14 Performance audit                   ⬜
STEP 15 RTL/LTR visual audit                ⬜
STEP 16 Full regression                     ⬜
STEP 17 Final reconciliation doc            ⬜
```

**Rule:** Do not proceed to the next phase until validation gates pass.

---

## 2. Pre-Implementation Checklist

| # | Item | Status |
|---|------|--------|
| 1 | Resolve uncommitted affiliate WIP (merge or branch) | ⚠️ PO decision |
| 2 | Confirm Filament v5 + Laravel 13 at install | ⬜ Phase 18.1 |
| 3 | Confirm single `admin` role vs split roles | ⚠️ PO Q1 |
| 4 | Confirm vendor/provider approval workflow exists | ⚠️ PO Q3 |
| 5 | Backup / migrate:fresh tested on dev DB | ⬜ Phase 18.1 |

---

## 3. Phase 18.1 — Admin Foundation

**Goal:** Secure, branded Filament panel with audit foundation and dashboard shell.

### 3.1 Tasks

| ID | Task | Output |
|----|------|--------|
| 18.1.1 | `composer require filament/filament:^5.0` + install panel | `AdminPanelProvider` |
| 18.1.2 | Configure `/admin` path, `web` guard, login page | Working admin login |
| 18.1.3 | `canAccessPanel` → `RoleName::Admin` only | Access tests |
| 18.1.4 | DIYAR theme (colors, fonts, logo) | Branded panel |
| 18.1.5 | Arabic + English locales, RTL/LTR switch | `lang/en/admin.php`, `lang/ar/admin.php` |
| 18.1.6 | Navigation groups (empty/shell resources OK) | IA skeleton |
| 18.1.7 | Migration `admin_audit_logs` + `AdminAuditLog` model | Table live |
| 18.1.8 | `AdminAuditService` + Filament concern trait | Reusable logging |
| 18.1.9 | Dashboard widgets (real aggregates only) | Orders, payouts pending |
| 18.1.10 | `FilamentAccessTest` — role matrix | 5 deny + 1 allow |

### 3.2 Validation gate 18.1

```bash
cd backend
composer require filament/filament:"^5.0"   # verify constraint
php artisan filament:install --panels
php artisan migrate
php artisan test --filter=FilamentAccess
vendor/bin/pint --test
```

Manual:

- [ ] `/admin/login` renders DIYAR branding
- [ ] Customer/vendor/provider/marketer → 403 on `/admin`
- [ ] Admin login → dashboard
- [ ] Arabic locale → RTL layout correct
- [ ] English locale → LTR layout correct
- [ ] Mobile width usable (sidebar collapses)
- [ ] Dashboard KPIs match DB counts (not fabricated)

**Deliverable:** [Phase 18.1 COMPLETION_REPORT.md](./Phase%2018.1%20-%20Admin%20Foundation/COMPLETION_REPORT.md)

---

## 4. Phase 18.2 — Admin Resources

### 4.1 Tier 1 — Critical (Week 1–2)

| Resource | Priority actions | Domain service |
|----------|------------------|----------------|
| Users | list, search, view, suspend/restore, roles | User model + role attach |
| Roles | list, view, assign/revoke | `Role`, `UserRole` |
| Vendors | list, view, suspend/activate, inspect products/orders | `VendorAccountPolicy` |
| Providers | list, view, suspend/activate | `ProviderAccountPolicy` |
| Categories | full CRUD | `CategoryService` ✅ exists |
| Products | list, view, activate/deactivate, moderate | `ProductService` |
| Orders | list, view, domain actions only | `OrderStateService` |
| Payments | list, view (read-only) | — |
| Refunds / Returns | list, view, approve/reject | Refund/return services |
| Commissions | list, view (read-only) | ledger |
| Balances | list, view vendor/affiliate summaries | `VendorBalanceService` |
| Vendor payouts | list, approve/reject/mark-paid | `PayoutService` ✅ |
| Affiliate payouts | list, full lifecycle | `AffiliateAdminPayoutService` ✅ |

**Per resource deliverables:**

- Filament Resource (list + view minimum; edit only where matrix allows)
- Policy integration
- Filters: status, date range, key relations
- Detail page sections/tabs per architecture doc
- Audited mutations

### 4.2 Tier 2 (Week 2–3)

| Resource | Notes |
|----------|-------|
| Coupons | `VendorCouponManagementService` |
| Reviews (product/store/provider) | Moderation hide/unhide |
| Service requests | Read + inspect offers |
| Bookings | Read + valid transitions |
| Notifications | Delivery inspection |
| Affiliate profiles | Suspend/activate |
| Affiliate links | Disable abusive |
| Affiliate clicks/attribution | Read-only diagnostics |
| Affiliate commissions | Read-only |
| Inventory | Movements + authorized adjustments |
| Shipping | Vendor settings + shipment inspection |

### 4.3 Tier 3 (Week 3–4)

| Area | Notes |
|------|-------|
| Operational reports | Export where safe |
| Content / homepage config | Only if settings exist |
| Theme tokens | Phase 18.3 dependency |
| System health page | Version, queue hint, cache |
| Admin audit log viewer | Read-only resource |

### 4.4 Validation gates 18.2

After Tier 1:

```bash
php artisan test --filter=Admin
php artisan test   # full regression
vendor/bin/pint --test
```

Manual Tier 1:

- [ ] Order cancel/confirm uses `OrderStateService` (grep: no direct `->status =`)
- [ ] Payout approve creates audit row
- [ ] Non-admin API still forbidden on `/api/v1/admin/*`
- [ ] Filament payout action matches API behavior
- [ ] No N+1 on order list (debugbar / query log)

After Tier 2 + 3: repeat full regression + spot-check affiliate and services.

**Deliverable:** [Phase 18.2 COMPLETION_REPORT.md](./Phase%2018.2%20-%20Admin%20Resources/COMPLETION_REPORT.md)

---

## 5. Phase 18.3 — Configuration

**Goal:** Database-backed business settings with cache, validation, audit.

### 5.1 Tasks

| ID | Task |
|----|------|
| 18.3.1 | Migration `system_settings` |
| 18.3.2 | `SystemSetting` model + enums for type/group |
| 18.3.3 | `SystemSettingService` — get/set/validate/cast |
| 18.3.4 | `EffectiveConfigService` — cache + env fallback |
| 18.3.5 | Seeder from `config/diyar.php` non-secret keys |
| 18.3.6 | Filament Settings pages by group |
| 18.3.7 | Migrate affiliate config consumers first |
| 18.3.8 | Feature flags (`feature.*` booleans) |
| 18.3.9 | Public theme settings endpoint for React |
| 18.3.10 | Tests: validation, cache invalidation, sensitive mask, auth |

### 5.2 Settings groups (initial seed)

| Group | Keys (examples) |
|-------|-----------------|
| affiliate | min/max commission %, attribution days, payout minimum, enabled |
| commerce | VAT rate, currency, min order |
| orders | cancellation window, reservation timeout |
| shipping | default fee, free threshold, enabled |
| payouts | vendor minimum, affiliate minimum |
| services | offer expiry, booking rules |
| notifications | channel toggles (non-secret) |
| feature | `*.enabled` flags |
| theme | colors, radius, fonts (allowlist) |

### 5.3 Validation gate 18.3

```bash
php artisan test --filter=SystemSetting
php artisan test --filter=EffectiveConfig
php artisan migrate:fresh --seed   # dev only
```

Manual:

- [ ] Change affiliate payout minimum in admin → effective without restart
- [ ] Sensitive setting shows masked
- [ ] `.env` not writable from UI (verify no code path)
- [ ] Cache invalidates on save
- [ ] Audit log records setting change (redacted if sensitive)
- [ ] React can fetch public theme tokens (if endpoint added)

**Deliverable:** [Phase 18.3 COMPLETION_REPORT.md](./Phase%2018.3%20-%20Configuration/COMPLETION_REPORT.md)

---

## 6. Quality Gates (All Phases)

Run from repository root / backend as applicable:

| Command | When |
|---------|------|
| `php artisan test` | Every phase |
| `vendor/bin/pint --test` | Every phase |
| `npm test -- --run` | After any shared type/config API change |
| `npx tsc --noEmit` | Frontend touch |
| `npm run build` | Frontend touch |
| `npm run lint` | Frontend touch |
| `npm run format:check` | Frontend touch |

Record results in phase completion reports.

---

## 7. Security Audit (Step 13)

Dedicated pass using [STAGE_18_SECURITY.md](./STAGE_18_SECURITY.md):

- IDOR matrix: Admin, Vendor, Provider, Customer
- Privilege escalation: role assignment UI
- CSRF on Filament forms
- XSS on settings fields
- Financial replay: double payout approve
- Unauthorized bulk actions

**Block release on any critical finding.**

---

## 8. Performance Audit (Step 14)

| Page | Target |
|------|--------|
| Dashboard | < 500ms aggregate queries on seed data |
| Order list | Paginated; ≤ 10 queries per page |
| Settings page | Cached reads |
| User search | Indexed email/phone |

Fix N+1 before marking phase complete.

---

## 9. Documentation Deliverables

| Document | When |
|----------|------|
| Phase 18.x README / PLAN / COMPLETION_REPORT | Per phase |
| STAGE_18_SECURITY.md | Before 18.1 coding ✅ |
| STAGE_18_FINAL_RECONCILIATION_AUDIT.md | Step 17 |
| STAGE_18_COMPLETION_REPORT.md | Stage end |
| Update conception/PLAN.md Stage 18 status | Stage end |

---

## 10. Git Discipline

- Do **not** commit unless fursa requests
- Prefer commits:
  - `feat(admin): add Filament administration foundation`
  - `feat(admin): add core operational resources`
  - `feat(admin): add runtime settings and feature flags`
  - `feat(admin): add admin audit logging`
  - `test(admin): add authorization and operational coverage`
  - `docs(stage-18): document admin operations and configuration`
- Never `git reset --hard` / `git clean -fd` without explicit authorization
- Preserve uncommitted affiliate WIP

---

## 11. Risk Register

| Risk | Mitigation |
|------|------------|
| Filament/Laravel version mismatch | Pin version at 18.1.1; CI verify |
| Duplicate admin logic | Code review: actions must call services |
| Financial regression | Reuse payout tests; add Filament action tests |
| RTL bugs | Manual Arabic pass each phase |
| Scope creep (CMS) | Tier 3 optional; tokens only in 18.3 |
| Uncommitted affiliate WIP conflict | Branch or merge before 18.1 |

---

## 12. Definition of Done Mapping

See Stage 18 prompt §66. Final verdict in `STAGE_18_COMPLETION_REPORT.md` must be exactly one of:

```text
COMPLETE / VERIFIED
ACCEPTED WITH MINOR FOLLOW-UP
NOT READY
```

---

## 13. Immediate Next Action

**Begin Phase 18.1** after fursa confirms:

1. Audit documents acceptable
2. WIP handling on `dev`
3. RBAC approach (single admin vs split)

First code change: Filament install + `AdminPanelProvider` + access tests.

---

*Cross-reference: [STAGE_18_ARCHITECTURE.md](./STAGE_18_ARCHITECTURE.md) · [ADMIN_CAPABILITY_MATRIX.md](./ADMIN_CAPABILITY_MATRIX.md)*

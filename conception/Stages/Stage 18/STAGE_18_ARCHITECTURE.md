# Stage 18 — Architecture

**Date:** 2026-08-22  
**Status:** Design (pre-implementation)  
**Baseline:** Laravel 13.17 · PHP 8.3 · React SPA unchanged

---

## 1. Purpose

Stage 18 introduces an **internal operational control plane** for DIYAR V1. It is not a second marketplace application. Admin consumes existing domain services, policies, and state machines through a Filament panel at `/admin`.

```text
┌─────────────────────────────────────────────────────────────┐
│                     DIYAR V1 Platform                        │
├──────────────────────┬──────────────────────────────────────┤
│  Public React SPA    │  Role dashboards (React)             │
│  /                     │  /dashboard/vendor|provider|affiliate│
├──────────────────────┴──────────────────────────────────────┤
│  DIYAR Admin (Filament) — NEW                               │
│  /admin                                                      │
├─────────────────────────────────────────────────────────────┤
│  Laravel API /api/v1/*  (unchanged consumer-facing contract) │
│  Laravel API /api/v1/admin/*  (retained for automation/tests)│
├─────────────────────────────────────────────────────────────┤
│  Domain Services · Policies · Events · Ledger               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Admin UI | **Filament Panel** | Prompt mandate; server-rendered ops UI separate from React |
| Filament version | **v5.x** (verify at install) | Official Laravel 13 support (v3.3.54+ backport; v5 current stable) |
| Admin auth | **Same `User` model + `admin` role** | Reuse Stage 2 identity; no parallel user table |
| Session | **Laravel web session** (Filament default) | Separate from Sanctum SPA cookie path; panel uses `web` guard |
| Authorization | Filament policies + existing Laravel policies | Avoid `if ($user->isAdmin())` scattered logic |
| Business mutations | **Domain services only** | Financial/state integrity |
| Config | **DB settings + cache + env fallback** | No browser `.env` editing |
| Audit | **`admin_audit_logs` append-only table** | WHO/WHAT/WHEN/WHY/BEFORE/AFTER |
| i18n | Filament locale + Laravel lang files | Arabic RTL + English LTR |
| Branding | Custom Filament theme tokens | Match DIYAR palette from `frontend/src/index.css` |

### 2.1 Filament install constraints

Before `composer require`:

1. Confirm PHP `^8.3` (satisfied).
2. Confirm Laravel `^13.17` (satisfied).
3. Run `composer require filament/filament:"^5.0"` (exact constraint verified against Packagist at install time).
4. Run `php artisan filament:install --panels`.
5. **Do not** modify React build pipeline for admin; Filament ships its own Vite/Tailwind assets for the panel.

### 2.2 What we explicitly do NOT build

- React Admin SPA
- Parallel `AdminOrderService` / `AdminProductService` domain layers
- Direct Eloquent status overwrites for orders, payments, balances
- Infrastructure control panel (SSH, queue worker restart from UI)
- Arbitrary `.env` editor

---

## 3. Directory Layout (Target)

```text
backend/
├── app/
│   ├── Filament/
│   │   ├── Admin/
│   │   │   ├── Pages/           # Dashboard, Settings groups
│   │   │   ├── Resources/       # UserResource, OrderResource, …
│   │   │   ├── Widgets/         # KPI cards, alerts
│   │   │   └── Actions/         # Thin wrappers → domain services
│   │   └── Concerns/            # AuditableAction, HasDomainAuthorization
│   ├── Models/
│   │   ├── SystemSetting.php
│   │   └── AdminAuditLog.php
│   ├── Services/
│   │   ├── Admin/
│   │   │   └── AdminAuditService.php
│   │   └── Settings/
│   │       ├── SystemSettingService.php
│   │       ├── EffectiveConfigService.php
│   │       └── SettingValidator.php
│   └── Providers/
│       └── Filament/
│           └── AdminPanelProvider.php
├── database/migrations/
│   ├── *_create_system_settings_table.php
│   └── *_create_admin_audit_logs_table.php
├── lang/
│   ├── en/admin.php
│   └── ar/admin.php
└── config/
    └── diyar.php                  # env defaults; consumed by EffectiveConfigService
```

Existing `/api/v1/admin/*` controllers **remain** for API clients and tests. Filament actions call the same services (`PayoutService`, `CategoryService`, etc.).

---

## 4. Authentication & Authorization

### 4.1 Panel access gate

```php
// AdminPanelProvider::panel()
->authGuard('web')
->login()
->path('admin')
->brandName('DIYAR Admin')
->middleware([/* web stack */])
->authMiddleware([Authenticate::class])
->canAccessPanel(fn (User $user) => $user->hasRole(RoleName::Admin))
```

**Validation matrix (Phase 18.1):**

| Actor | `/admin` |
|-------|----------|
| Unauthenticated | Redirect login |
| Customer | 403 |
| Vendor | 403 |
| Provider | 403 |
| Marketer | 403 |
| Admin | Allowed |

### 4.2 Authorization layers

```text
Request
  → Filament canAccessPanel (admin role)
  → Resource Policy (viewAny, view, update, delete, custom abilities)
  → Action authorization (approvePayout, cancelOrder, …)
  → Domain Service (invariants, transactions)
  → AdminAuditService::record(...)
```

**Existing policies to wire first:**

- `CategoryPolicy`, `ProductPolicy`, `OrderPolicy`, `VendorAccountPolicy`, `ProviderAccountPolicy`
- `VendorPayoutPolicy`, `AffiliatePayoutPolicy`, `ReturnRequestPolicy`

**V1 permission model:** Start with `admin` role = full panel access. Introduce granular permission keys (`users.view`, `payouts.approve`, …) as optional Phase 18.1 extension if PO confirms split roles.

### 4.3 Sanctum vs web guard

| Surface | Guard | Notes |
|---------|-------|-------|
| React SPA `/api/v1/*` | Sanctum | Unchanged |
| Filament `/admin/*` | `web` session | Separate login page at `/admin/login` |

Admins may hold both session types; no credential sharing beyond same `users` table.

---

## 5. Domain Service Integration Pattern

Every mutating Filament action follows this pattern:

```php
// Example: Approve vendor payout
public function approve(VendorPayout $record): void
{
    $this->authorize('approve', $record);

    DB::transaction(function () use ($record) {
        $before = $record->only(['status', 'approved_at']);
        $this->payoutService->approve($record, auth()->user());
        $record->refresh();
        $this->auditService->record(
            action: 'payout.approve',
            resource: $record,
            before: $before,
            after: $record->only(['status', 'approved_at']),
            reason: $this->reason, // from form
        );
    });
}
```

**Never:**

```php
$record->update(['status' => 'approved']); // forbidden for financial/state entities
```

### 5.1 Service map (Tier 1 resources)

| Resource | Read | Mutate via |
|----------|------|------------|
| User | Eloquent + scopes | User status service / existing patterns |
| Category | `CategoryService` | `CategoryService` |
| Product | `ProductService` | `ProductService` |
| Order | Eloquent + relations | `OrderStateService` |
| Payment | Eloquent | read-only; webhook domain handles mutations |
| Refund/Return | Eloquent | `RefundCalculationService`, return services |
| Vendor payout | `PayoutService` | `PayoutService` |
| Affiliate payout | `AffiliateAdminPayoutService` | same |
| Inventory | `InventoryService` | adjustment API on service |

---

## 6. Admin Audit Architecture

### 6.1 Table: `admin_audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Project convention |
| `actor_id` | UUID FK users | Required |
| `actor_role` | string | Snapshot at action time |
| `action` | string | e.g. `user.suspend`, `payout.approve` |
| `resource_type` | string | Morph class or logical type |
| `resource_id` | UUID nullable | Target id |
| `before` | JSON nullable | Redacted |
| `after` | JSON nullable | Redacted |
| `reason` | text nullable | Required for sensitive actions |
| `ip_address` | string nullable | |
| `user_agent` | string nullable | |
| `request_id` | string nullable | Correlation |
| `created_at` | timestamp | Append-only |

**Rules:**

- No updates/deletes on audit rows (application-enforced; DB triggers optional).
- Redact keys: `password`, `token`, `otp`, `card`, `cvv`, `secret`, `api_key`.
- Filament `AdminAuditLogResource` is read-only.

### 6.2 Integration

- `AdminAuditService` injected into Filament actions and `SystemSettingService`.
- Optional listener for domain events (future) — Phase 18.1 uses explicit action logging only.

---

## 7. Runtime Settings Architecture (Phase 18.3)

### 7.1 Resolution chain

```text
EffectiveConfigService::get('affiliate.payout_minimum')
    1. Cache hit → return
    2. system_settings row → cast by type → cache → return
    3. config('diyar.affiliate.payout_minimum') → return
    4. Hard default in config file
```

**Secrets never in DB:** payment gateway keys, mail passwords, `APP_KEY`, OAuth secrets remain env-only.

### 7.2 Table: `system_settings`

| Column | Purpose |
|--------|---------|
| `key` | Unique dotted key (`affiliate.payout_minimum`) |
| `value` | Stored string |
| `type` | `string`, `integer`, `decimal`, `boolean`, `json`, `enum`, `color`, `text` |
| `group` | Navigation grouping |
| `description` | Admin UI help text |
| `default_value` | Bootstrap default |
| `is_public` | Exposable to storefront API (theme tokens) |
| `is_sensitive` | Mask in UI; never log raw value |
| `validation_rules` | Laravel validation string |
| `editable` | false = deployment-managed |
| `updated_by` | FK users |
| timestamps | |

### 7.3 Cache strategy

```text
Key: diyar:settings:{key}
TTL: configurable (default 3600s)
Invalidate: on SystemSettingService::set()
Event: SettingsChanged (optional warm)
```

### 7.4 Migration from env-only config

Phase 18.3 seeder maps existing `config/diyar.php` leaves to `system_settings` rows (non-secret only). Application code migrates incrementally:

```php
// Before
config('diyar.affiliate.payout_minimum')

// After
app(EffectiveConfigService::class)->decimal('affiliate.payout_minimum')
```

**Priority integration order:** affiliate → finance → tax → shipping → cart → inventory → services.

### 7.5 Feature flags

Option A (recommended V1): settings group `feature.*` with boolean type:

```text
feature.affiliate.enabled
feature.reviews.enabled
feature.services.enabled
feature.coupons.enabled
```

Option B: separate `feature_flags` table — only if PO requires independent rollout metadata.

### 7.6 Theme / UI tokens

Controlled allowlist stored as settings (`theme.primary_color`, `theme.border_radius`, …). Public endpoint (existing or new) returns `is_public = true` settings for React bootstrap. **No raw CSS/JS fields.**

---

## 8. Filament UI / DIYAR Branding

### 8.1 Design tokens (from storefront)

| Token | Value | Usage |
|-------|-------|-------|
| Primary dark | `#1f3d3a` | Sidebar, headings |
| Cream surface | `#f3ecdb` | Background accents |
| Brown accent | `#947961` | Primary actions, links |
| Typography | Alexandria, Tajawal | Arabic; Outfit fallback English |

Implement via Filament v5 theme customization (`->colors()`, custom CSS, font provider).

### 8.2 RTL / LTR

- Filament supports locale switching; set `->locale(session('locale', 'en'))`.
- Admin language switcher: `en` | `ar`.
- Arabic: `dir="rtl"` on panel; verify tables, forms, modals, pagination.
- Translation files: `lang/ar/admin.php`, Filament vendor overrides where needed.

### 8.3 Navigation hierarchy

See [ADMIN_CAPABILITY_MATRIX.md](./ADMIN_CAPABILITY_MATRIX.md). Only sections backed by real models/services appear in v1.

---

## 9. Dashboard Architecture

Widgets query **aggregates only** — no full table scans.

| Widget | Query source | Phase |
|--------|--------------|-------|
| Orders today / month | `orders` indexed `created_at` | 18.1 |
| Pending vendor payouts | `vendor_payouts` status scope | 18.1 |
| Pending affiliate payouts | `affiliate_payouts` status scope | 18.1 |
| Pending returns/refunds | `return_requests` / `refunds` | 18.2 |
| Low stock | `product_inventories` threshold | 18.2 |
| Active vendors/providers | account status counts | 18.2 |

If metric unavailable → omit widget (no fake data).

---

## 10. API Coexistence

| Path | Role | Stage 18 action |
|------|------|-----------------|
| `/api/v1/admin/categories/*` | JSON API | Keep; Filament uses `CategoryService` directly |
| `/api/v1/admin/payouts/*` | JSON API | Keep; Filament uses `PayoutService` |
| `/api/v1/admin/affiliate/payouts/*` | JSON API | Keep; Filament uses `AffiliateAdminPayoutService` |

Optional future: thin admin JSON expansion for headless automation — not required for Filament v1.

---

## 11. Database Migrations (New)

| Migration | Purpose |
|-----------|---------|
| `create_system_settings_table` | Runtime config |
| `create_admin_audit_logs_table` | Audit trail |

**Indexes:**

- `system_settings.key` unique
- `admin_audit_logs (resource_type, resource_id, created_at)`
- `admin_audit_logs (actor_id, created_at)`

No duplicate tables for existing domains.

---

## 12. Security Architecture

See [STAGE_18_SECURITY.md](./STAGE_18_SECURITY.md) for full checklist. Summary:

- CSRF on all Filament mutations (framework default)
- Login throttling reuses `diyar.auth` config
- IDOR: policy on every resource + test per role
- Mass assignment: Filament form schemas explicit; no `$guarded = []` on admin forms
- XSS: sanitize rich text settings; no HTML/JS setting types
- Financial: transaction + idempotency via existing services
- Export: permission-gated, streamed, audited

---

## 13. Performance Guidelines

| Area | Rule |
|------|------|
| List pages | Server pagination default 25; eager load only displayed relations |
| Search | Indexed columns (`email`, `order_number`, `status`) |
| Dashboard | `count()` / `sum()` with date scopes; cache 60s for non-financial KPIs optional |
| Settings | Single cache layer via `EffectiveConfigService` |
| Dropdowns | Async search (Filament `getSearchResultsUsing`) for users/vendors/products |

---

## 14. Testing Architecture

```text
tests/Feature/Admin/
├── FilamentAccessTest.php        # role matrix
├── FilamentAuthorizationTest.php
├── SystemSettingServiceTest.php
├── AdminAuditServiceTest.php
└── Resources/
    ├── OrderResourceTest.php
    ├── PayoutResourceTest.php
    └── ...
```

Reuse existing domain tests; admin tests focus on **access**, **authorization**, **audit**, **settings** — not re-testing commission math.

---

## 15. ADR Reconciliation

| Topic | Decision |
|-------|----------|
| Admin UI technology | Filament panel at `/admin` (not React) |
| Config source of truth | DB override > env > config default |
| Domain authority | Existing `*Service` classes |
| Admin API | Retained, not replaced |
| RBAC V1 | `admin` role gate; granular permissions deferred unless PO requires |
| Impersonation | Not in V1 |
| Theme CMS | Controlled tokens only; homepage marketing mostly static until CMS stage |

---

## 16. Dependencies Between Phases

```text
Phase 18.1 (Foundation)
  ├── Filament install + panel
  ├── Auth + canAccessPanel
  ├── Theme + RTL/LTR
  ├── AdminAuditLog + service
  └── Dashboard shell

Phase 18.2 (Resources)
  ├── Tier 1 resources (domain service actions)
  ├── Tier 2 resources
  └── Tier 3 operational/reporting

Phase 18.3 (Configuration)
  ├── SystemSetting + EffectiveConfigService
  ├── Seed from config/diyar.php
  ├── Migrate consumers (affiliate, finance, …)
  └── Feature flags + theme public endpoint
```

Phase 18.3 can begin in parallel with Tier 2 resources once 18.1 audit foundation lands.

---

*Cross-reference: [STAGE_18_ENTRY_AUDIT.md](./STAGE_18_ENTRY_AUDIT.md) · [ADMIN_CAPABILITY_MATRIX.md](./ADMIN_CAPABILITY_MATRIX.md) · [STAGE_18_PLAN.md](./STAGE_18_PLAN.md)*

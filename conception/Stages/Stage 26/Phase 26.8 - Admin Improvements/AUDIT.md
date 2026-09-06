# Phase 26.8 — Admin Control Plane Baseline Audit

**Date:** 2026-08-26  
**Status:** Baseline complete — implementation in progress  
**Rule:** Do not trust prior stage reports; verify against code.

---

## Executive Summary

DIYAR has a **mature admin backend API** (42 controllers, 73 permissions, async audit, finance CSV export, platform health probes) but an **incomplete admin SPA control plane**. ~15 pages exist without routes. Enterprise cross-cutting systems (bulk framework, async exports, operational health center, time-range KPI dashboard) are largely absent.

**Verdict:** ~40% foundation for 26.8. Backend ready; frontend wiring and operational layers missing.

---

## Existing Functionality

### Backend (`backend/app/Http/Controllers/Api/V1/Admin/`)

| Domain | Controllers | Permission pattern |
|--------|-------------|-------------------|
| Auth | `AdminAuthController`, `AdminSessionController` | Session + RBAC |
| Dashboard | `AdminDashboardController`, `AdminReportController` | `panel.access` |
| Identity | Users, roles, permissions | Granular |
| Commerce | Orders, products, payments, refunds, coupons, shipping | Granular |
| Finance | Payouts, ledger, sync CSV export | `payouts.*`, `balances.view` |
| Notifications | Deliveries retry, broadcasts (26.6) | `notifications.*` |
| Chat | Oversight + report moderation (26.7) | `chat.view` (moderation write uses same) |
| Audit | `AdminAuditLogController` | `audit.view` |
| Settings | `AdminSystemSettingController` | `settings.*` |

**Route mount:** `backend/routes/api.php` L235+ — `auth:admin`, `admin.active`, `role:admin`, per-route `admin.permission:*`.

### Services

- `AdminAuditService` — async via `RecordAdminAuditLogJob`, redaction
- `AdminDashboardService` — 8 count metrics (no time ranges, no comparisons)
- `PlatformHealthService` — DB/cache/queue probes (public `/health`)
- `PlatformFinanceExportService` — sync streamed CSV only

### Frontend (`frontend/src/admin/`)

**Routed:** dashboard, users, vendors, providers, categories, blog, projects, B2B, finance, chat, affiliate, audit, settings.

**Built but NOT routed:** orders, products, payments, refunds, coupons, reviews, roles, operations hub, services hub, shipping configuration.

**Patterns:** TanStack Query (`useAdminListQuery`), `AdminResourceTable`, permission gates, i18n + RTL.

---

## Duplicate Implementations

| Issue | Location |
|-------|----------|
| Dashboard `recent_activity` fetched twice | API embeds audit rows; frontend re-fetches `/admin/audit-logs` |
| Hub page pattern duplicated | Finance, operations, services, chat — no shared hub framework |
| Health in settings only | `AdminPlatformHealthPanel` calls public `/health` |

---

## Missing Functionality (26.8 scope)

| Feature | Status |
|---------|--------|
| Operational dashboard (time ranges, comparisons) | Missing |
| Real-time queue/notification/chat metrics | Partial (queue in health probe only) |
| Admin Health Center page | Missing |
| Bulk action framework | Missing |
| Async export system | Missing (sync finance CSV only) |
| Audit date/actor/correlation filters | Partial API, no UI |
| Audit detail view | API exists, no UI |
| `chat.moderate` permission | Missing |
| `system.health.view` permission | Missing |
| Export permissions | Missing |
| French audit localization | Missing |
| All orphaned pages wired | Missing |

---

## Performance & Query Issues

1. **`AdminSystemSettingController::index`** — N+1 per setting key
2. **`AdminDashboardService::metrics`** — 8+ separate COUNT queries per load
3. **`AdminReportController::summary`** — multiple independent aggregates
4. List endpoints generally OK (eager loading present)

---

## Authorization Gaps

- `PATCH /admin/chat/reports/{report}` uses `chat.view` — should require `chat.moderate`
- `inventory.adjust`, `services.view` — enum exists, no enforced route
- `AdminCmsMediaController` — permission in controller, not middleware (inconsistent)

---

## Observability Gaps

- No admin dashboard latency metrics
- No export duration tracking
- No bulk action telemetry
- Audit missing `request_id` / `correlation_id` in UI (may exist in DB — verify migration)

---

## Test Gaps

- `AdminResourceParityTest` missing chat, shipping, broadcasts, loyalty routes
- No bulk/export/health center tests
- No admin load tests (k6)

---

## Recommended Implementation Order

1. Wire orphaned routes + nav (immediate ops value)
2. Health center + admin operational health API
3. Permission cleanup (`chat.moderate`, `system.health.view`)
4. Operational dashboard (time ranges, period comparisons)
5. Audit UX (filters, detail, i18n completion)
6. Bulk action framework
7. Async export framework
8. k6 + failure injection

---

## Files Reference

```
backend/routes/api.php
backend/app/Enums/AdminPermission.php
backend/app/Services/Admin/AdminDashboardService.php
backend/app/Services/Infrastructure/PlatformHealthService.php
frontend/src/admin/AdminShell.tsx
frontend/src/admin/navigation/adminNav.ts
frontend/src/admin/pages/AdminDashboardPage.tsx
```

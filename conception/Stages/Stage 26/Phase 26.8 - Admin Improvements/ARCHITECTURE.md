# Phase 26.8 — Admin Control Plane Architecture

## Layering

```
Admin SPA (React + TanStack Query)
        │
        ▼
Admin API (/api/v1/admin/*)
  auth:admin + admin.active + role:admin + admin.permission:*
        │
        ▼
Admin Application Services
  AdminDashboardService, AdminOperationalHealthService,
  AdminBulkActionDispatcher, AdminExportService, AdminAuditService
        │
        ▼
Domain Services (never bypass)
  OrderCreationService, NotificationDispatcher, ChatModerationService, …
        │
        ▼
MySQL (authoritative) │ Redis (cache/coordination) │ Queues (async)
        │
        ▼
Audit / Domain Outbox / Events
```

**Rule:** Admin controllers orchestrate; domain services enforce invariants.

---

## Subsystems

### 1. Operational Dashboard

- **Service:** `AdminOperationalDashboardService`
- **Endpoint:** `GET /admin/dashboard/operational?from&to&compare=previous_period`
- **Data:** Indexed aggregates, cached 60–120s, no full-table scans in PHP
- **Metrics:** KPIs + period-over-period deltas

### 2. Health Center

- **Service:** `AdminOperationalHealthService` extends `PlatformHealthService`
- **Endpoint:** `GET /admin/system/health` (permission: `system.health.view`)
- **Checks:** DB, Redis, queue depth, failed jobs, scheduler heartbeat, outbox lag, Reverb (when measurable)
- **States:** `HEALTHY` | `DEGRADED` | `CRITICAL` | `UNKNOWN` — never fake healthy on missing telemetry

### 3. Bulk Action Framework

```
BulkActionDefinition
  → authorize(actor, selection)
  → validate(selection)
  → preview(selection) [optional]
  → dispatch(BulkActionJob) chunked
  → progress via bulk_action_runs table
  → audit each chunk + summary
```

Queue: `admin` (dedicated, non-starving critical/chat).

### 4. Async Export Framework

```
AdminExportRequest
  → authorize + rate limit
  → AdminExport record (pending)
  → ProcessAdminExportJob (chunked cursor)
  → storage disk + signed URL
  → notify admin (in-app)
  → audit
```

Tables: `admin_exports`, max rows configurable, TTL cleanup command.

### 5. Audit Enterprise

- Machine-readable `action` codes (already stored)
- UI localization via `localizedAudit.ts` (en/ar/fr)
- Filters: actor, action, resource, date range, correlation_id
- Append-only; no delete from admin UI

---

## Permissions (new / refined)

| Permission | Purpose |
|------------|---------|
| `dashboard.view` | Operational dashboard (alias `panel.access` during migration) |
| `system.health.view` | Health center |
| `chat.moderate` | Report resolution writes |
| `exports.create` | Start export job |
| `exports.download` | Download completed export |
| `bulk.execute` | Run bulk actions |

---

## Feature Flags (`config/diyar.php`)

```php
'features' => [
    'admin_operational_dashboard_enabled' => env(..., true),
    'admin_health_center_enabled' => env(..., true),
    'bulk_exports_enabled' => env(..., false),
    'bulk_actions_enabled' => env(..., false),
],
```

Rollout: OFF → internal → staging → production.

---

## Frontend Structure

```
/admin              → Operational dashboard
/admin/health       → Health center
/admin/orders       → Commerce (wired from orphaned pages)
/admin/products
/admin/operations   → Inventory, shipments, notifications tabs
/admin/services     → Service requests + bookings
/admin/shipping     → Shipping configuration
```

Shared: `useAdminListQuery`, `AdminResourceTable` (+ row selection for bulk), `AdminBulkActionBar`.

---

## Non-Regression

- Stages 18, 26.6, 26.7 admin APIs unchanged unless explicitly versioned
- Existing `/admin/dashboard` metrics endpoint preserved; operational metrics additive

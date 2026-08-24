# PROD_TEMP PostgreSQL Audit

**Branch:** `prod-temp`  
**Status:** IMPLEMENTED (code) · INFRASTRUCTURE-VERIFIED pending live migration  
**Date:** 2026-08-24

## Target

| Environment | Database |
|-------------|----------|
| `dev` | MySQL (unchanged) |
| `prod-temp` | Render PostgreSQL 18 |

## Compatibility fixes (this pass)

| Issue | Location | Fix |
|-------|----------|-----|
| `DATE(created_at)` | `AffiliateDashboardService::dailySeries` | `SqlDialect::dayPeriodExpression()` + `groupByRaw` |
| `DATE(created_at)` | `AdminReportController::ordersByDay` | Same |
| `DATE_FORMAT` | `SqlDialect::monthPeriodExpression` | Already portable |
| JSON `LIKE` on materials | `ProductService` | `whereJsonContains` only (prior pass) |
| MySQL `information_schema` | cart color migration | `Schema::hasIndex()` (prior pass) |
| Missing `libpq-dev` | `Dockerfile*` | Added for `pdo_pgsql` build |

## Index migration

`2026_08_24_120000_add_prod_performance_indexes.php`:

- `products(status, created_at)`, `(status, sale_price)`, `(slug)`
- `vendor_orders(vendor_account_id, created_at)`, `(vendor_account_id, status, created_at)`
- `order_items(product_id)`
- `product_inventory(available_quantity)`
- `product_colors(product_id, name)`
- `orders(created_at)`
- `payments(status)`

## Connection tuning (Render FREE)

- `DB_CONNECT_TIMEOUT=5` in `.env.production.example`
- `OCTANE_WORKERS=2` — limits concurrent PG connections
- Use Render **internal** database URL from API service env (not external hostname)

## Credential security

- **Never commit** `DATABASE_URL` / `DB_PASSWORD`
- Rotate credentials if exposed in plaintext chat/logs
- Render env vars only

## Remaining (CODE)

- Full PHPUnit suite on PostgreSQL (CI runs migrate + health smoke only)
- Optional `pg_trgm` indexes for `%LIKE%` catalog search (behavior parity)

## Remaining (INFRASTRUCTURE)

- Run `php artisan migrate --force` once against Render PG (not on every boot)
- Verify all domain tables after migration
- Manual `pg_dump` backup procedure (FREE tier may lack auto-backup)

# Security — Analytics

## Authorization (server-side)

| Attack vector | Mitigation | Tested |
|---------------|------------|--------|
| Vendor A → Vendor B analytics | Scoped via authenticated vendor account | ✅ `VendorAnalyticsTest` |
| Vendor → admin analytics | Role + permission middleware | ⚠️ No explicit denial test |
| Manipulated `vendor_id` query param | Ignored — auth scope only | ✅ |
| Admin export without permission | `analytics.export` middleware | ⚠️ No denial test |
| Search analytics without permission | `search.analytics.view` | ⚠️ Partial test |

## Export security

| Control | Status |
|---------|--------|
| UTF-8 BOM | ✅ |
| CSV formula injection (`=`, `+`, `-`, `@`) | ✅ `CsvExportHelper` |
| Row cap (admin) | ✅ 10,000 |
| Rate limit | ✅ 10 req/min per user |
| Tenant isolation (vendor/provider) | ✅ Resolver-scoped |

## Data sensitivity

- Admin export includes order numbers (not customer PII)
- Financial KPIs gated by `analytics.view_financial`
- Analytics events exclude email/phone/card data (`AnalyticsEventRecorder::sanitizePayload`)

## Recommendations (not yet implemented)

1. Explicit 403 tests for permission denial on all admin analytics routes
2. Provider tenant isolation test suite
3. Align legacy `/admin/reports/summary` with `analytics.view`

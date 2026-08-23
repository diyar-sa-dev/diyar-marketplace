# Database seeders

## Strategy

| Seeder | Purpose | Runs in production |
|--------|---------|-------------------|
| `RoleSeeder` | Reference roles | Yes (if invoked) |
| `AdminPermissionSeeder` | Admin permission matrix | Yes |
| `SystemSettingSeeder` | Runtime configuration defaults | Yes |
| `CategorySeeder` | Product/service category tree | Local/staging only via `DatabaseSeeder` |
| `CommissionRuleSeeder` | Platform commission rules | Local/staging |
| `VendorShippingSettingsSeeder` | Demo shipping defaults | Local/staging |
| `AdminSeeder` | **1 admin** (`admin@diyar.local`) | **No** (`APP_ENV=production` skip) |
| `PlatformDemoSeeder` | **Customer, vendor, marketer** demo users | **No** |
| `CatalogSeeder` | Products for demo vendor + empty showcase vendor | **No** |
| `ServiceMarketplaceSeeder` | Provider `eiwan@diyar.local` + minimal extra providers for tests | **No** |
| `HomeEngagementSeeder` | Product likes for demo customer | **No** |

## Demo accounts (local only)

Password: `DIYAR_DEMO_PASSWORD` (default `Password123!`)

| Role | Email | Phone |
|------|-------|-------|
| Admin | admin@diyar.local | 966500000001 |
| Vendor | vendor@diyar.local | 966500000002 |
| Provider | eiwan@diyar.local | 966500000101 |
| Customer | customer@diyar.local | 966500000010 |
| Marketer | marketer@diyar.local | 966500000011 |

Admin is a **control-plane identity only** — not combined with marketplace roles in seed data.

## Reset

```bash
cd backend
php artisan migrate:fresh --seed
```

## Redis

Production/staging should use `CACHE_STORE=redis` and `QUEUE_CONNECTION=redis` (see `.env.example`).  
Database `cache` / `jobs` tables remain for optional fallback drivers — not removed.

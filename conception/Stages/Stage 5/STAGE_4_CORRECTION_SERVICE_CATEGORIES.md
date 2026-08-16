# Stage 4 Correction — Service Categories

> **Date:** 2026-08-16  
> **Type:** Post-finalization correction (discovered at Stage 5 entry)  
> **Stage 4 completion report:** unchanged (historical)

---

## Problem

The storefront **خدمات ديار** section (`CategoriesStrip.tsx`) references 10 service category slugs. Stage 4 `CategorySeeder` seeded **10 product categories only**. Service categories were not in the database.

---

## Required Service Categories

| Slug | Arabic name | type |
|------|-------------|------|
| `interior-design` | تصميم داخلي | `service` |
| `maintenance` | تركيب وصيانة | `service` |
| `painting` | دهانات | `service` |
| `upholstery` | تنجيد وتجديد | `service` |
| `carpentry` | نجارة مخصصة | `service` |
| `consultation` | استشارات تصميم | `service` |
| `moving` | نقل وتغليف | `service` |
| `cleaning` | تنظيف وتلميع | `service` |
| `electrical` | إضاءة وكهربا | `service` |
| `curtains-install` | تركيب الستائر | `service` |

---

## Fix

**File:** `backend/database/seeders/CategorySeeder.php`

- Idempotent `updateOrCreate` by `slug`
- Product categories unchanged
- Service categories added with `type = CategoryType::Service`

---

## Verification

- `GET /api/v1/categories/interior-design` → `type: service`
- `php artisan db:seed --class=CategorySeeder` twice → no duplicate slugs
- Tests: `ServiceCategorySeederTest` (3 tests)

---

## Scope Note

This does **not** implement service listings or service inventory (services are not stock-tracked). Category resolution for storefront routes is enabled; service product catalog remains empty until a future stage.

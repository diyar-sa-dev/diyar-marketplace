# Phase 4.1 — Categories — Plan

> **Stage:** Stage 4 — Catalog & Products  
> **Phase:** 4.1 — Categories  
> **Status:** Pending  
> **Authorization:** PO authorized 2026-08-16

---

## Objective

Implement the category domain, public read API, admin management API, and full test coverage.

---

## Tasks

### Task 4.1.1 — Category database model

**Deliverables:**

- Migration: `categories` table
- Model: `App\Models\Category`
- Factory: `CategoryFactory`
- Seeder: initial V1 category tree (product-type categories aligned with storefront)

**Schema (UUID PKs):**

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| parent_id | UUID FK NULL | Self-referential |
| name | string | Arabic-primary V1 |
| slug | string UNIQUE | Auto-generated |
| type | enum | product, service, both |
| sort_order | integer | Default 0 |
| is_active | boolean | Default true |
| timestamps | | |

**Checklist:**

- [ ] Inspect existing migrations — confirm no duplicate
- [ ] Create migration
- [ ] Create model with relationships (`parent`, `children`, `products` placeholder)
- [ ] Create factory
- [ ] Add indexes on `slug`, `parent_id`, `is_active`

---

### Task 4.1.2 — Category hierarchy

**Deliverables:**

- Recursive `children` relationship
- Scope: `active()`, `roots()`, `ordered()`
- Document V1 depth: seed 1–2 levels for product categories

**Checklist:**

- [ ] Parent/child self-reference with cascade rules documented
- [ ] Prevent invalid parent (self-reference, inactive parent) in validation
- [ ] Seeder creates realistic tree (bedroom, living-room, kitchen, etc.)

---

### Task 4.1.3 — Public category API

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/categories` | List active categories (tree or flat) |
| GET | `/api/v1/categories/{slug}` | Single category detail |
| GET | `/api/v1/categories/{slug}/items` | Products in category (paginated; stub until Phase 4.3) |

**Checklist:**

- [ ] `CategoryController` (public)
- [ ] `CategoryResource` / collection resource
- [ ] Only `is_active=true` visible publicly
- [ ] 404 for unknown/inactive slug
- [ ] Pagination on `/items` via `ApiResponse`
- [ ] Eager load to avoid N+1

---

### Task 4.1.4 — Admin category operations

**Endpoints:**

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/admin/categories` | Admin |
| POST | `/api/v1/admin/categories` | Admin |
| PATCH | `/api/v1/admin/categories/{id}` | Admin |
| DELETE | `/api/v1/admin/categories/{id}` | Admin |

**Operations:** create, update, activate/deactivate, reorder, slug generation

**Checklist:**

- [ ] `Admin\CategoryController`
- [ ] Form requests with validation
- [ ] `CategoryPolicy` (admin only for mutations)
- [ ] Slug uniqueness enforced
- [ ] Soft constraints: cannot delete category with products (Phase 4.2+)

---

### Task 4.1.5 — Category tests

**Coverage:**

- [ ] Model: relationships, scopes
- [ ] Slug uniqueness
- [ ] Hierarchy (parent/child)
- [ ] Active/inactive public visibility
- [ ] Ordering
- [ ] Admin CRUD authorization
- [ ] Invalid parent rejection
- [ ] Public API 404 cases
- [ ] Regression: Stage 3 tests still pass

---

## Phase 4.1 Checklist

- [ ] Entry audit reviewed
- [ ] Existing category implementation inspected (none — greenfield)
- [ ] Schema reconciled with DATABASE_DESIGN.md
- [ ] Migration implemented
- [ ] Model implemented
- [ ] Relationships implemented
- [ ] Public category API implemented
- [ ] Admin category API implemented
- [ ] Authorization implemented
- [ ] Validation implemented
- [ ] Seeder implemented
- [ ] Tests implemented
- [ ] Tests passing
- [ ] Regression baseline maintained (75 backend / 45 frontend)
- [ ] Documentation updated
- [ ] Phase completion report created

---

## Files Expected

```
backend/database/migrations/*_create_categories_table.php
backend/app/Models/Category.php
backend/app/Http/Controllers/Api/V1/Catalog/CategoryController.php
backend/app/Http/Controllers/Api/V1/Admin/CategoryController.php
backend/app/Http/Resources/CategoryResource.php
backend/app/Http/Requests/Admin/StoreCategoryRequest.php
backend/app/Http/Requests/Admin/UpdateCategoryRequest.php
backend/app/Policies/CategoryPolicy.php
backend/database/factories/CategoryFactory.php
backend/database/seeders/CategorySeeder.php
backend/tests/Feature/Api/V1/Catalog/CategoryTest.php
backend/tests/Feature/Api/V1/Admin/CategoryTest.php
```

---

## Completion Criteria

- All Phase 4.1 checklist items checked
- Public category endpoints return seeded data
- Admin can manage categories
- All new tests pass + no Stage 3 regression

---

## Next Phase

[Phase 4.2 — Product Model](../Phase%204.2%20-%20Product%20Model/PHASE_4.2_PLAN.md)

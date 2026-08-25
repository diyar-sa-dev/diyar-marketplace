# Stage 26.2 — Performance Notes

## Query budgets (local PHPUnit, RefreshDatabase)

Measured with `DB::enableQueryLog()` on seeded data:

| Endpoint | Query budget |
|----------|--------------|
| `GET /b2b/companies?per_page=12` | ≤ 12 queries |
| `GET /b2b/companies/{slug}` | ≤ 18 queries |

Tests: `AdminB2bCompanyTest::public_company_*_avoids_n_plus_one_queries`

## Optimizations applied

- Selective columns on list queries
- Eager loading: category, tags, services (detail), portfolio projects + images
- `withCount` on categories for published company counts
- Indexed filters: `slug`, `publication_status`, `featured`, `b2b_category_id`, `published_at`
- Pagination capped at 48 items per page
- Admin list uses card resource (no portfolio/testimonial graph)

## Caching

`B2bCache` (15-minute TTL, versioned keys):

| Key area | Invalidated on |
|----------|----------------|
| Categories | Category/company publish changes |
| Listings | Company CRUD, publish, feature |
| Featured | Feature/unfeature |
| Detail | Company update affecting public fields |

Not cached: leads, admin lists, authorization.

## Frontend

- React Query `staleTime` on taxonomy and directory queries
- Debounced search (350ms) on `/b2b`
- Parallel fetch: companies + categories on listing page
- No mock/static B2B data in production paths

## Not measured in this phase

Production p50/p95/p99 latencies require staging instrumentation. Do not extrapolate from local SQLite/MySQL dev timings.

# Stage 26.1 — Blogs & Projects Delivery Report

## Status

**SUPERSEDED** — see [STAGE_26_1.md](./STAGE_26_1.md) (phase plan) and [STAGE_26_1_FINAL_REPORT.md](./STAGE_26_1_FINAL_REPORT.md) for COMPLETE status.

---

## Backend

- Migrations: `blog_categories`, `blog_tags`, `blog_articles`, `blog_article_tag`, `projects`, `project_images`
- Enums: `BlogArticleStatus`, `ProjectPublicationStatus`
- Models with UUID PKs, `published()` scopes, soft deletes on articles/projects
- Services: `BlogQueryService`, `BlogService`, `AdminBlogService`, `ProjectQueryService`, `ProjectService`, `AdminProjectService`
- HTML sanitization: `HtmlContentSanitizer` on admin store/update
- Redis cache: `BlogProjectCache` with TTL + invalidation on mutations
- Admin audit logging via `AdminAuditService`

## Database

- MySQL + PostgreSQL portable (Laravel Schema)
- Indexed: `(status, published_at)`, category, slug unique
- Seeders: `BlogContentSeeder`, `ProjectContentSeeder` (skipped in production)

## API

| Method | Endpoint |
|--------|----------|
| GET | `/api/v1/blog/articles` |
| GET | `/api/v1/blog/articles/{slug}` |
| GET | `/api/v1/blog/categories` |
| GET | `/api/v1/blog/tags/{slug}` |
| GET | `/api/v1/projects` |
| GET | `/api/v1/projects/{slug}` |

Admin CRUD under `/api/v1/admin/blog/*` and `/api/v1/admin/projects/*` with `blog.view` / `blog.manage` / `projects.view` / `projects.manage` permissions.

Pagination: default 12, max 48.

## Frontend

- `BlogPage` — listing with skeleton/error/empty/retry
- `BlogArticlePage` — slug-based detail, related articles, client `sanitizeHtml`
- `DesignBlog` — latest 3 articles from API, links enabled
- Sidebar projects modal — API-backed list + detail
- Routes: `/blog`, `/blog/:slug`, `/blog/tag/:tagSlug`
- Removed production use of `MOCK_ARTICLE`, `RELATED_ARTICLES`, `DEFERRED_SIDEBAR_PROJECTS`

## Admin

- `AdminBlogArticlesPage` — list + publish/unpublish/archive
- `AdminProjectsPage` — list + status filters
- Nav items added with permission gates

## Security

- Public APIs: published content only
- Draft/archived isolation tested
- HTML sanitized server + client
- Admin mutations authorized + audited
- Mass assignment guarded via Form Requests

## Performance

- Eager loading on list/detail (category, tags, images)
- Redis cache on public reads
- React Query caching on frontend

## Tests

| Suite | Result |
|-------|--------|
| `php artisan test --filter=Blog\|ProjectTest` | 17 passed |
| `vendor/bin/pint --test` | pass (after fix) |
| `npm run typecheck` | pass |
| `npm test` | 104 passed |
| `npm run lint` | pass |
| `npm run build` | see CI/local run |
| `e2e/blog.spec.ts` | added (skips if no seeded articles) |

## Migration

```bash
cd backend
php artisan migrate --force
php artisan db:seed --class=BlogContentSeeder
php artisan db:seed --class=ProjectContentSeeder
```

## Cache strategy

| Key pattern | TTL |
|-------------|-----|
| `blog:articles:list:{hash}` | 10 min |
| `blog:article:{slug}` | 20 min |
| `blog:categories` | 45 min |
| `blog:tags` | 45 min |
| `projects:list:{hash}` | 15 min |
| `project:{slug}` | 30 min |

Invalidated on admin create/update/delete/publish.

## Remaining risks

- Article images still use seeded HTTPS URLs; production should use storage/CDN uploads via admin (image upload UI is list-focused for V1.1)
- Full admin CRUD modals for create/edit article body not yet built (list + publish actions only)
- E2E blog flow needs local API + seed data running

## Next phase

**Stage 26.2 — B2B**

# Stage 26.1 — Blogs & Projects

**Status:** ✅ COMPLETE  
**Branch baseline:** `dev` (MySQL)  
**Completion report:** [STAGE_26_1_FINAL_REPORT.md](./STAGE_26_1_FINAL_REPORT.md)

---

## Goal

Replace blog and projects storefront prototypes with production APIs and admin CMS — **without redesigning existing UI/UX**. Preserve Arabic/English RTL/LTR layouts, card patterns, and sidebar projects modal behavior.

---

## Scope

### In scope

* Public blog listing, article detail, category/tag filters, related articles
* Public projects showcase (sidebar modal + list/detail)
* Admin CMS: articles, categories, tags, projects (CRUD + publish lifecycle)
* CMS image upload (hero, author avatar, project cover, gallery)
* Redis-backed public read cache + invalidation on admin mutations
* HTML sanitization (server + client)
* Permissions: `blog.view`, `blog.manage`, `projects.view`, `projects.manage`
* Admin audit logging for CMS mutations
* Feature tests, frontend unit tests, E2E with deterministic seed

### Out of scope

* WYSIWYG rich-text editor (textarea + HTML is intentional)
* Blog article wishlist/save (added in polish pass — see final report)
* Cross-domain slug uniqueness (blog and projects are separate tables)
* B2B, loyalty, and other V1.1 phases (Stage 26.2+)

---

## Phase breakdown

### 26.1.1 — Backend domain

Implement:

* migrations: `blog_categories`, `blog_tags`, `blog_articles`, `blog_article_tag`, `projects`, `project_images`
* enums: `BlogArticleStatus`, `ProjectPublicationStatus`
* models with UUID PKs, soft deletes, `published()` scopes
* services: `BlogQueryService`, `BlogService`, `AdminBlogService`, `ProjectQueryService`, `ProjectService`, `AdminProjectService`
* public + admin controllers, Form Requests, API resources
* slug generation with DB uniqueness
* reading time auto-calculation on article save

**Validation gate:** `php artisan test --filter=Blog|Project`

---

### 26.1.2 — Cache & performance

Implement:

* `BlogProjectCache` key patterns + TTLs
* `CachesQueryResults` for Redis-safe collection serialization
* eager loading on list/detail (category, tags, images)
* listing queries exclude heavy `content` column
* related articles via single optimized query

**Validation gate:** cache invalidation covered in feature tests; no stale published content after admin mutate

---

### 26.1.3 — Security & content safety

Implement:

* `HtmlContentSanitizer` on admin store/update
* client `sanitizeHtml` on article render
* draft/archived isolation (404 on public API)
* admin policies + permission middleware
* CMS upload validation (MIME, size, binary signature) via `MediaUploadService`
* isolated storage directories per CMS context

See [STAGE_26_1_SECURITY.md](./STAGE_26_1_SECURITY.md).

**Validation gate:** XSS + auth denial + draft isolation tests pass

---

### 26.1.4 — Public frontend

Wire without redesign:

* `BlogPage` — search, category filters, pagination, skeletons, empty/error states
* `BlogArticlePage` — detail, tags, share, related articles, EN/AR RTL
* `DesignBlog` homepage section — latest articles from API
* sidebar projects modal — API-backed gallery + detail
* routes: `/blog`, `/blog/:slug`, `/blog/tag/:tagSlug`
* remove production use of mock blog/project constants

**Validation gate:** `npm run typecheck`, `npm test`, manual AR/EN smoke

---

### 26.1.5 — Admin CMS

Implement:

* `AdminBlogArticlesPage` — list, filters, publish/unpublish/archive/delete
* `AdminProjectsPage` — same lifecycle for projects
* `AdminBlogArticleModal` — create/edit (category, tags, images, SEO)
* `AdminProjectModal` — create/edit (cover, gallery, delivery year)
* `POST /admin/cms/media/image` for storage-backed uploads
* nav entries gated by permissions

Default save behavior: **draft**; **published_at** set on publish action only.

See [STAGE_26_1_API.md](./STAGE_26_1_API.md).

**Validation gate:** admin feature tests + manual create → publish → public verify

---

### 26.1.6 — Seed, E2E & quality gates

Implement:

* `BlogContentSeeder`, `ProjectContentSeeder` (non-production)
* `BlogE2eSeeder` — deterministic slugs for Playwright
* E2E: `blog.spec.ts`, `projects.spec.ts`, `blog-admin.spec.ts`

**Validation gate:**

```bash
cd backend && php artisan test
cd frontend && npm run typecheck && npm test && npm run lint && npm run build
# E2E: scripts/e2e/bootstrap-backend.sh then playwright
```

---

## Documentation map

| File | Purpose |
|------|---------|
| [STAGE_26_1.md](./STAGE_26_1.md) | This phase plan |
| [STAGE_26_1_FINAL_REPORT.md](./STAGE_26_1_FINAL_REPORT.md) | Completion status + quality gates |
| [STAGE_26_1_API.md](./STAGE_26_1_API.md) | Endpoint reference |
| [STAGE_26_1_SECURITY.md](./STAGE_26_1_SECURITY.md) | Threat model + controls |
| [STAGE_26_1_DELIVERY_REPORT.md](./STAGE_26_1_DELIVERY_REPORT.md) | Initial delivery notes (superseded) |

---

## Migration & ops

```bash
cd backend
php artisan migrate --force
php artisan db:seed --class=BlogContentSeeder   # non-production
php artisan db:seed --class=ProjectContentSeeder  # non-production
php artisan db:seed --class=BlogE2eSeeder         # E2E / CI bootstrap
```

Configure storage disk URL in `.env` for CMS image URLs in each environment.

---

## Next phase

**Stage 26.2 — B2B** — see [PLAN.md](../../../PLAN.md#phase-262--b2b).

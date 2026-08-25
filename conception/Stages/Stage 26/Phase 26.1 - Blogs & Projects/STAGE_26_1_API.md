# Stage 26.1 — Blogs & Projects API

Base path: `/api/v1`

## Public — Blog

| Method | Path | Notes |
|--------|------|-------|
| GET | `/blog/articles` | Paginated published articles. Query: `page`, `per_page` (max 48), `category`, `tag`, `q`, `sort` |
| GET | `/blog/articles/{slug}` | Detail + related (max 6) |
| GET | `/blog/categories` | All categories with published count |
| GET | `/blog/tags/{slug}` | Articles filtered by tag slug |

## Public — Projects

| Method | Path | Notes |
|--------|------|-------|
| GET | `/projects` | Paginated published projects. Query: `page`, `per_page`, `category`, `sort` |
| GET | `/projects/{slug}` | Detail with ordered gallery |

## Admin — Blog

Requires `auth:admin` + permissions.

| Permission | Routes |
|------------|--------|
| `blog.view` | GET `/admin/blog/articles`, categories, tags |
| `blog.manage` | POST/PATCH/DELETE articles, categories, tags; publish/unpublish/archive |

## Admin — Projects

| Permission | Routes |
|------------|--------|
| `projects.view` | GET `/admin/projects` |
| `projects.manage` | CRUD + publish/unpublish/archive |

## Admin — CMS Media

| Method | Path | Body |
|--------|------|------|
| POST | `/admin/cms/media/image` | `image` (file), `context`: `blog_hero` \| `blog_avatar` \| `project_cover` \| `project_gallery` |

Returns `{ path, url }`. Storage path resolved to public URL via `CmsImageUrl`.

## E2E seed slugs

- Article: `e2e-blog-article`
- Project: `e2e-showcase-project`

Seeded by `BlogE2eSeeder` on every `migrate:fresh --seed`.

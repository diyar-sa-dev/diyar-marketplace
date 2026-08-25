# Stage 26.2 — B2B API Reference

All responses use the standard DIYAR envelope: `{ success, data, message? }`.

## Public (no auth)

### GET `/api/v1/b2b/companies`

Query params:

| Param | Type | Notes |
|-------|------|-------|
| `page` | int | Default 1 |
| `per_page` | int | Max 48 |
| `category` | string | Category slug |
| `q` | string | Name/description search |
| `featured` | bool | Featured only |
| `sort` | string | `featured` (default), `newest`, `rating` |

Returns: `{ companies[], pagination, stats }`

### GET `/api/v1/b2b/companies/{slug}`

Published company only. Returns `{ company }` with portfolio, services, testimonials, contact.

404 for draft/unpublished/archived.

### GET `/api/v1/b2b/categories`

Returns `{ categories[] }` with published company counts. Cached.

## Authenticated customer

### POST `/api/v1/b2b/companies/{slug}/leads`

Throttle: `b2b-leads`

Body:

```json
{
  "project_type": "string (required, max 120)",
  "estimated_quantity": "string (optional)",
  "details": "string (required, min 10)",
  "budget_range": "under_10k|10k_50k|50k_200k|over_200k|unspecified"
}
```

Returns `201` with `{ lead }`.

Errors: `401`, `404` (unpublished company), `422`, `429` (duplicate or daily limit).

### GET `/api/v1/b2b/leads`

Customer's own leads.

### GET `/api/v1/b2b/leads/{id}`

Own lead only. `403` for other users' leads.

## Admin (`auth:admin`)

Base: `/api/v1/admin/b2b`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/companies` | `b2b.view` |
| POST | `/companies` | `b2b.manage` |
| GET | `/companies/{id}` | `b2b.view` |
| PATCH | `/companies/{id}` | `b2b.manage` |
| DELETE | `/companies/{id}` | `b2b.manage` |
| POST | `/companies/{id}/publish` | `b2b.manage` |
| POST | `/companies/{id}/unpublish` | `b2b.manage` |
| POST | `/companies/{id}/archive` | `b2b.manage` |
| POST | `/companies/{id}/verify` | `b2b.manage` |
| POST | `/companies/{id}/reject` | `b2b.manage` |
| POST | `/companies/{id}/feature` | `b2b.manage` |
| POST | `/companies/{id}/unfeature` | `b2b.manage` |
| GET | `/categories` | `b2b.view` |
| GET | `/tags` | `b2b.view` |
| GET | `/leads` | `b2b.leads.view` |
| GET | `/leads/{id}` | `b2b.leads.view` |

Admin list returns card payloads (no full portfolio/testimonials). Detail returns full company graph.

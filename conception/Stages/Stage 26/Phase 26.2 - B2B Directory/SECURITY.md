# Stage 26.2 — Security Notes

## Authorization model

- **No new auth role.** B2B is enforced via policies + admin permissions.
- Public routes never expose draft/unpublished companies.
- Admin routes require `auth:admin` + explicit permission middleware.
- Lead endpoints require authenticated marketplace user; admin lead read requires `b2b.leads.view`.

## Policies

| Resource | Public | Customer | Admin |
|----------|--------|----------|-------|
| Published company | view | view + submit lead | full via permissions |
| Draft company | deny | deny | view/manage |
| Own lead | — | view | view with permission |
| Other user's lead | — | deny | view with permission |

## IDOR protections

- Public detail resolved by **slug** with published scope only.
- Admin detail resolved by **id** with admin auth.
- Lead show checks `user_id === auth()->id()` (customer) or admin permission.
- Mass assignment guarded via Form Requests; status/verification not settable from public endpoints.

## Content security

- Company `about` HTML sanitized on write (admin create/update).
- Public resources strip internal fields (`admin_notes`, FK ids where not needed).
- Website URLs validated; `tel:` / `mailto:` used for contact links on frontend.

## Rate limiting

- Route middleware: `throttle:b2b-leads` on lead POST.
- Application layer: duplicate detection (1 hour window) and daily cap (20/user).

## Test coverage

Feature tests cover:

- Draft leakage (public 404, admin 200)
- Customer blocked from admin routes
- Lead ownership (403 cross-user)
- Duplicate lead rejection (429)

## Out of scope (future)

- Vendor/provider self-service without explicit policy expansion
- CAPTCHA on lead form (rate limit + auth sufficient for V1.1)

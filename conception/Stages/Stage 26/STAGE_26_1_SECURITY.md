# Stage 26.1 — Blogs & Projects Security

## Content safety

- Article HTML sanitized server-side (`HtmlContentSanitizer`) on create/update
- Client renders via `sanitizeHtml.ts` (strips script, iframe, on* handlers, data: URLs)
- Tests verify `<script>` stripped from stored content

## Authorization

| Actor | Public read | Admin mutate |
|-------|-------------|--------------|
| Guest | Published only | Denied |
| Customer | Published only | Denied |
| Vendor | Published only | Denied |
| Admin (no permission) | Published only | Denied |
| Admin + `blog.manage` / `projects.manage` | Published only | Allowed |

All admin mutations use Laravel policies + `admin.permission` middleware.

## Draft isolation

- `draft` and `archived` articles/projects return 404 on public API
- `status` omitted from public card resources

## Upload security

- Reuses `MediaUploadService::validateImage` + `ImageContentValidator`
- MIME, extension, size, binary signature validated
- CMS contexts map to isolated storage directories

## IDOR

- Admin routes scope by UUID; no cross-tenant resources in CMS domain
- Feature tests deny non-admin access

## Rate limiting

- Public list endpoints validated via Form Requests (bounded `per_page`, filter whitelist)
- Follows existing Diyar public API throttle strategy

## Audit

CMS mutations logged via `AdminAuditService`: create, update, publish, unpublish, archive, delete.

Never logged: passwords, tokens, session data, payment secrets.

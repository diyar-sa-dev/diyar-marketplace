# Phase 28.4 — File Upload UI

---

## Upload surfaces (source inventory)

| Surface | API pattern | Module |
|---------|-------------|--------|
| Vendor product images | `FormData` | `api/client.ts` strips JSON Content-Type |
| Admin CMS/blog images | FormData | `adminCms.ts` |
| Profile/avatar | FormData | user profile APIs |
| Chat attachments | FormData | `chat.ts` |

**Client behavior:** `prepareRequestBody()` detects `FormData` and removes `Content-Type` for browser boundary.

---

## Validation (frontend)

| Check | Status |
|-------|--------|
| MIME type client-side | Partial — varies by component |
| File size limits | Backend authoritative |
| Preview before upload | Product/vendor forms |
| Progress indicator | **NOT VERIFIED** all surfaces |
| Upload cancel | **NOT VERIFIED** |
| Retry on failure | **NOT VERIFIED** |

---

## Automated tests

No dedicated upload UI Vitest/Playwright in Phase 28.4.

Vendor product E2E may touch image fields indirectly — **NOT VERIFIED** as upload test.

---

## Gate

```text
NOT VERIFIED
```

Upload flows exist in source; failure/progress/cancel matrix not executed.

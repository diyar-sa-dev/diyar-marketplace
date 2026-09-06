# Phase 28.6 — Security Input / Injection

---

## SQL injection

| Surface | Method |
|---------|--------|
| Catalog search | `CatalogSearchSecurityTest` — malicious query strings |
| Filters/sort params | Partial via feature tests |

**Result:** Parameterized queries; no SQL error disclosure in tests — **PASS** (tested subset)

---

## XSS

| Surface | Sanitization |
|---------|--------------|
| Blog article HTML | `sanitizeHtml()` before `dangerouslySetInnerHTML` |
| Admin B2B preview | **Raw HTML** — `AdminB2bCompaniesPage` KI-028-055 |
| Chat messages | Server storage + UI text (verify encoding) |
| CMS fields | Admin-only write paths |

---

## Path traversal

Upload filenames: server-generated storage names in media pipeline — **partial** UploadSecurityTest.

---

## Assistant prompt injection

Public `POST /assistant/chat` accepts user messages up to 4000 chars — prompt injection / cost abuse surface (**KI-028-053**).

---

## Gate

```text
PARTIAL
```

SQLi tests pass on search; XSS gap in admin B2B preview; assistant input not security-tested.

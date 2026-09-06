# Phase 28.6 — Security Uploads

**Tests:** `UploadSecurityTest` — **5/5 PASS** (in focused suite)

---

## Verified controls

| Test | Result |
|------|--------|
| PHP disguised as image | **422** |
| Oversized file | **422** |
| PNG MIME with non-image bytes | **422** |
| Customer uploading vendor logo | **403** |
| Valid vendor PNG | **200** |

---

## NOT VERIFIED in PHPUnit

| Vector | Status |
|--------|--------|
| SVG upload | **NOT TESTED** |
| HTML masquerading as image | Partial (PHP test only) |
| Path traversal filename | **NOT TESTED** |
| Double extension | **NOT TESTED** |
| Direct execution of uploaded file | Storage on `media` disk — execution risk **NOT VERIFIED** |
| Chat attachment MIME | **NOT TESTED** |
| E2E browser upload (28.5) | **NOT VERIFIED** KI-028-052 |

---

## Authorization

Upload endpoints role-gated per dashboard context.

---

## Gate

```text
PARTIAL
```

Core avatar/vendor logo validation tested; full upload attack matrix incomplete.

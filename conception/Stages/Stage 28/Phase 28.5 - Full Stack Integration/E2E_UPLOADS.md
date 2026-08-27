# Phase 28.5 — Upload Integration (KI-028-046)

---

## Method

Browser E2E via `upload-smoke.spec.ts` on CI-parity stack.

---

## Results

| Test | Result |
|------|--------|
| Vendor logo upload via settings file input | **FAIL** — logo_url not observed in `/auth/me` within 60s |
| Admin blog CMS page load | **PASS** |

---

## Analysis

**Vendor settings** (`VendorSettings.tsx`):
- File inputs exist for logo, cover, avatar
- Upload may require explicit save/submit — auto-upload on `setInputFiles` **NOT CONFIRMED**

**Classification:** **TEST GAP** — E2E did not complete full upload→persist→URL verification chain.

---

## Source-confirmed upload surfaces

| Surface | API | Verified E2E |
|---------|-----|--------------|
| Vendor logo/cover | FormData via vendor API | **NO** |
| Vendor product images | Vendor product form | **NO** |
| Admin CMS/blog | adminCms | **NO** (page load only) |
| Chat attachments | chat API | **NO** |

---

## Backend alignment

Upload validation remains **backend-authoritative** (Phase 28.3). No frontend weakening performed.

---

## Gate

```text
NOT VERIFIED
```

Upload integration requires dedicated E2E with correct save triggers + storage assertion (→ 28.6 or test hardening).

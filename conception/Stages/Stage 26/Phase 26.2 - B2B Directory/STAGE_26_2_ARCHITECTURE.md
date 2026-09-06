# Stage 26.2 — Architecture Decisions

**Status:** Approved for implementation (post-audit)  
**Date:** 2026-08-25  
**Baseline:** `dev` @ Stage 26.1 complete

---

## 1. Why B2B is not a new authentication role

| Finding | Decision |
|---------|----------|
| Platform roles are `customer`, `vendor`, `provider`, `marketer`, `admin` (`RoleName` enum) | **No `b2b` role** |
| B2B prototype is a **public directory + lead capture** surface | Company is a **domain entity**, not a login persona |
| Vendors/providers already have dashboards and team permissions | Optional **profile link** only |

A user with a B2B company profile keeps their existing role. Admin verifies/publishes companies; no parallel auth stack.

---

## 2. B2B Company ↔ Vendor

```
b2b_companies.vendor_account_id  →  vendor_accounts.id  (nullable, nullOnDelete)
b2b_companies.owner_user_id      →  users.id            (nullable, nullOnDelete)
```

- A **vendor may have at most one** linked B2B company (unique index on `vendor_account_id` where not null).
- Vendor dashboard gets **“B2B Profile”** section only when `vendor_account_id` is set on a company they own/manage.
- Vendor catalog data (products, store name) is **not duplicated** on `b2b_companies`; B2B profile holds marketing/portfolio/lead fields.

---

## 3. B2B Company ↔ Provider

```
b2b_companies.provider_account_id  →  provider_accounts.id  (nullable, nullOnDelete)
```

- Same rules as vendor: optional link, unique when present.
- Provider **service RFQ** (Stage 13) remains separate; B2B leads are **not** `ServiceRequest` rows.

---

## 4. B2B Company ↔ Projects (Stage 26.1)

```
b2b_company_project
  b2b_company_id  → b2b_companies.id  (cascadeOnDelete)
  project_id      → projects.id        (cascadeOnDelete)
  sort_order      unsigned integer
  PRIMARY (b2b_company_id, project_id)
```

- **No copy** of project rows into B2B tables.
- Only **published** projects may be attached (validated on admin sync).
- Public company detail loads portfolio via pivot + `ProjectCardResource`.

---

## 5. Who can create a company

| Actor | Capability |
|-------|------------|
| **Admin** (`b2b.manage`) | Create any company, with or without vendor/provider link |
| **Vendor / Provider** | Phase 26.2: **admin-only create**; dashboard self-service deferred to 26.2+ polish unless time permits |
| **Customer / Guest** | Cannot create companies |

*Rationale:* Prototype has “سجل شركتك” button with no flow; admin-first matches 26.1 CMS pattern and reduces abuse surface.

---

## 6. Who can edit a company

| Actor | Rule |
|-------|------|
| Admin + `b2b.manage` | Full edit |
| `owner_user_id` matching authenticated user | Edit own company (future vendor/provider tab; policy stub in 26.2) |
| Others | Denied |

---

## 7. Who can verify

**Admin only** (`b2b.manage`). Transitions: `pending` → `verified` | `rejected`. Public API may expose `verification_status` for badge display when `verified`.

---

## 8. Who can publish

**Admin** (`b2b.manage`) via publish/unpublish/archive actions (mirror blog/projects).  
`published_at` set on first publish (server-side), not from form.

---

## 9. Who receives leads

- Lead belongs to **`b2b_company_id`**.
- **Readable by:** admin (`b2b.view` / `b2b.manage`), company `owner_user_id`, linked vendor/provider owner (via company ownership resolver).
- **Customer** sees own submissions via `user_id` on lead (when authenticated).

---

## 10. Customer authentication for RFQ

| Decision | Detail |
|----------|--------|
| **Authenticated customers required** | Aligns with accountability + IDOR prevention |
| Guest | Redirect to login on submit (preserve modal UX) |
| Rate limit | `throttle:6,1` per user/IP on `POST /b2b/companies/{slug}/leads` |

---

## 11. Duplicate / spam RFQs

- Rate limiting (above)
- Optional duplicate window: reject identical `(user_id, company_id, project_type)` within 24h (configurable)
- Honeypot field omitted (SPA); rely on auth + throttle + validation

---

## 12. Dashboard placement

```
Admin nav
 └── B2B
      ├── Companies      (AdminB2bCompaniesPage)
      ├── Categories     (inline or sub-page)
      └── Leads          (AdminB2bLeadsPage)

Vendor dashboard (future tab)
 └── B2B Profile        (read-only until owner edit policy wired)

Provider dashboard (future tab)
 └── B2B Profile
```

No separate B2B admin app. Reuse `AdminResourceTable` + modal pattern from 26.1.

---

## 13. Cache strategy

New `B2bCache` (mirror `BlogProjectCache`):

| Key | TTL | Invalidated on |
|-----|-----|----------------|
| `b2b:categories` | 45 min | category mutate |
| `b2b:companies:list:{hash}` | 10 min | company mutate |
| `b2b:company:{slug}` | 20 min | company mutate |

Version bump invalidation. **Never cache leads or draft companies.**

---

## 14. Index strategy

On `b2b_companies`:

- `unique(slug)`
- `index(publication_status, published_at)`
- `index(b2b_category_id)`
- `index(verification_status)` (admin filters)
- `index(featured)` partial where featured = true (optional)
- `unique(vendor_account_id)` where not null
- `unique(provider_account_id)` where not null
- `index(owner_user_id)`

Query-driven only; no redundant composites.

---

## 15. Security model

- **Public:** `publication_status = published` only; no owner IDs in card resources
- **Policies:** `B2bCompanyPolicy`, `B2bLeadPolicy`
- **Permissions:** `b2b.view`, `b2b.manage`, `b2b.leads.view` (admin)
- **Sanitization:** `description` HTML via `HtmlContentSanitizer`; URLs validated
- **Uploads:** reuse `POST /admin/cms/media/image` contexts: `b2b_logo`, `b2b_cover`
- **Tests:** IDOR, draft hidden, XSS, throttle, ownership

---

## Domain model (minimal)

```text
b2b_categories
b2b_companies          (core + contact + stats + status enums)
b2b_tags
b2b_company_tag        (pivot)
b2b_company_project    (pivot → projects)
b2b_company_services   (company service lines for detail page)
b2b_company_testimonials
b2b_leads              (RFQ / quote requests)
```

**Not created:** separate auth tables, duplicate RFQ workflow, duplicate project storage.

---

## RFQ vs Stage 13 Service RFQ

| | Service RFQ (Stage 13) | B2B Lead (26.2) |
|--|------------------------|-----------------|
| Entity | `ServiceRequest` | `b2b_leads` |
| Counterparty | `ProviderAccount` | `B2bCompany` |
| Flow | Offers → Booking | Single lead record + admin/owner inbox |
| Reuse | **No** direct reuse | Thin lead layer; future integration possible |

---

## Route mapping (frontend preserved)

| Prototype | Production |
|-----------|------------|
| `/b2b` | Same — API directory |
| `/b2b/:id` | Same param name — value is **`slug`** (not numeric id) |

Remove `DeferredPrototypeBanner` when API wired.

---

## Audit references

- B2B UI: `frontend/src/pages/B2BPage.tsx`, `B2BCompanyPage.tsx`
- Stage 26.1 template: `Phase 26.1 - Blogs & Projects/`
- Service RFQ: `backend/app/Models/ServiceRequest.php` (do not extend)
- Admin permissions: `backend/app/Enums/AdminPermission.php`

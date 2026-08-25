# Stage 26.2 — Implementation Guide

**Status:** Complete  
**Date:** 2026-08-25

## Overview

Stage 26.2 wires the existing `/b2b` directory and `/b2b/:slug` company profile pages to a real Laravel backend. B2B companies are a **domain entity**, not a new authentication role.

## Domain model

| Entity | Purpose |
|--------|---------|
| `B2bCompany` | Public business directory profile |
| `B2bCategory` | Taxonomy for filtering |
| `B2bTag` | Optional labels on companies |
| `B2bCompanyService` | Services offered (1:N) |
| `B2bCompanyTestimonial` | Social proof (1:N) |
| `B2bLead` | Customer RFQ / quotation request |
| `b2b_company_project` | Pivot to existing `Project` rows (no duplication) |

Optional links on `b2b_companies`:

- `vendor_account_id`
- `provider_account_id`
- `owner_user_id`

## Backend layout

```
app/
  Enums/           B2bPublicationStatus, B2bVerificationStatus, B2bLeadBudgetRange
  Models/          B2bCompany, B2bCategory, B2bTag, B2bLead, ...
  Policies/        B2bCompanyPolicy, B2bLeadPolicy
  Services/B2b/    B2bService, B2bQueryService, AdminB2bService, B2bLeadService
  Support/Cache/   B2bCache
  Http/
    Controllers/Api/V1/B2b/
    Controllers/Api/V1/Admin/AdminB2bCompanyController.php
    Requests/      Store/Update admin + public lead validation
    Resources/     Card/detail/category/lead transformers
```

## Permissions

| Permission | Usage |
|------------|-------|
| `b2b.view` | Admin list/read B2B companies |
| `b2b.manage` | Admin CRUD, publish, verify, feature, archive |
| `b2b.leads.view` | Admin read B2B leads |

Public users require no permission to browse published companies.

## Frontend layout

```
src/
  api/b2b.ts
  types/b2b.ts
  hooks/b2b/
  pages/B2BPage.tsx
  pages/B2BCompanyPage.tsx
  admin/pages/AdminB2bCompaniesPage.tsx
  admin/components/AdminB2bCompanyModal.tsx
```

Admin route: `/admin/b2b/companies`

## Publishing rules

Only companies with `publication_status = published` and a non-null `published_at` are returned by public APIs. Draft and archived companies are admin-only.

## Lead flow

1. Customer must be authenticated (`sanctum`).
2. Company must be publicly eligible.
3. Request is validated server-side.
4. Duplicate submissions (same user + company + project type within 1 hour) return HTTP 429.
5. Daily cap: 20 leads per user.

## Cache

`B2bCache` namespaces public taxonomy, listings, featured sets, and company detail. All admin mutations invalidate affected keys via version bump + targeted forget.

## Seeders

- `B2bContentSeeder` — demo published + draft companies
- `B2bE2eSeeder` — deterministic `e2e-b2b-company` and `e2e-b2b-draft` for Playwright

## Known limitations

- Vendor/provider self-service editing deferred; admin manages listings in V1.1.
- Search uses portable SQL `LIKE`; no dedicated search engine.
- “سجّل شركتك” CTA remains a placeholder (no self-registration flow).

## Related docs

- [STAGE_26_2_ARCHITECTURE.md](./STAGE_26_2_ARCHITECTURE.md)
- [API.md](./API.md)
- [SECURITY.md](./SECURITY.md)
- [PERFORMANCE.md](./PERFORMANCE.md)
- [TESTING.md](./TESTING.md)
- [COMPLETION_REPORT.md](./COMPLETION_REPORT.md)

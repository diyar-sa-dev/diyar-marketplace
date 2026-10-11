# DIYAR V1 — ROLE ACCEPTANCE MATRIX (PHASE 4)

> **Document Status:** VERIFIED EMPIRICAL EVALUATION  
> **Execution Date:** 2026-10-11  
> **Execution Role:** Autonomous QA & Release Validation Engineer  
> **Commit SHA:** `466b289a51a6298448d72dbd2a112b028d238f82`  

---

## 1. Role Verification Summary

| Role Code | Role Name | System Name | Implementation Status | Automated Browser Test Coverage | Release Acceptance Result |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **Role A** | Guest / Unauthenticated | Unauthenticated | Complete | `responsive-smoke.spec.ts`, `blog.spec.ts`, `visual-search.spec.ts` | **VERIFIED PASS** |
| **Role B** | Customer | `customer` | Complete | `customer-journey.spec.ts`, `checkout-journey.spec.ts`, `loyalty.spec.ts` | **VERIFIED WITH LIMITATIONS** |
| **Role C** | Seller / Vendor | `vendor` | Complete | `vendor-journey.spec.ts`, `upload-smoke.spec.ts` | **VERIFIED PASS** |
| **Role D** | Service Provider | `provider` | Complete | `provider-journey.spec.ts` | **VERIFIED PASS** |
| **Role E** | Referral / Affiliate | `marketer` | Complete | Autonomous Browser Probe, `affiliate.ts`, API routes | **VERIFIED WITH LIMITATIONS** |
| **Role F** | Platform Admin | `admin` | Complete | `admin-journey.spec.ts`, `admin-shipping.spec.ts`, `maintenance.spec.ts` | **VERIFIED PASS** |

---

## 2. Role-by-Role Detailed Breakdown

### 2.1 Role A — Guest (Unauthenticated Public User)
- **Verified Capabilities:**
  - Public Storefront (`/`): Header, search bar, hero carousel, categories rail, curated sections.
  - Search & Discovery: `/search?q=...` with smart filter suggestions (`filter-suggestions.spec.ts`).
  - Product Details: `/product/:id` media display, variant details, pricing.
  - Responsive & RTL: 29 out of 29 viewport tests passed without horizontal overflow across 320px, 375px, 768px, 1024px, 1280px, 1440px, and 1920px.
  - Security Boundaries: Unauthenticated access to `/profile` correctly redirects to `/auth` with return state. Unauthenticated sessionless API requests handled safely (`SEC-01` regression verified).
- **Result:** **VERIFIED PASS** (100% of tested cases).

### 2.2 Role B — Customer (`phone: 500000010`)
- **Verified Capabilities:**
  - Login & Session: Authenticates via Saudi phone national format (`500000010`) with demo credentials.
  - Cart Operations: Items added, persistent cart state, line deletion.
  - Checkout & Financials: Checkout preview calculation, 15% VAT breakdown, SAR currency formatting, shipping fee snapshot immutability.
  - Order Completion: Full end-to-end checkout through sandbox simulator creating order number `DYR-*` with status `paid`.
  - Loyalty Program: Loyalty points preview, tier breakdown (`loyalty.spec.ts`).
- **Defects & Limitations:**
  - `DEF-01`: `ServicesPage.tsx` lacks an `<h1>` semantic heading, causing `customer-journey.spec.ts:32` locator timeout.
  - `DEF-04`: Dedicated 2FA test identity `500000012` is absent in local SQLite fixtures, blocking `two-factor.spec.ts`.
- **Result:** **VERIFIED WITH LIMITATIONS** (4 of 5 journey tests passed).

### 2.3 Role C — Seller / Vendor (`phone: 500000002`)
- **Verified Capabilities:**
  - Vendor Authentication: Seamless login and dashboard redirection.
  - Vendor Dashboard: Operations metrics, store metadata (`متجر ديار للأثاث`).
  - Product Management: Products listing (`vendor-products`), pricing, inventory status.
  - Order Fulfillment: Orders view (`vendor-orders`) displaying assigned line items.
  - Media Upload: Store logo file upload via vendor settings UI verified (`upload-smoke.spec.ts`).
- **Result:** **VERIFIED PASS** (100% of tested cases).

### 2.4 Role D — Service Provider (`phone: 500000101` — Eiwan)
- **Verified Capabilities:**
  - Provider Authentication: Login directs to service provider operations portal.
  - Service Dashboard: Active bookings, client inquiries, schedule status.
  - Services Management: Provider services catalog loading and status toggles.
  - Public Visibility: Seeded services appear in marketplace catalog (`provider-journey.spec.ts`).
- **Result:** **VERIFIED PASS** (100% of tested cases).

### 2.5 Role E — Referral / Affiliate (`phone: 500000011` — Marketer)
- **Verified Capabilities:**
  - Marketer Authentication: Successful login with role `marketer`.
  - Portal Routing: Directed to dedicated affiliate portal (`/dashboard/affiliate`).
  - Navigation Elements: Active sidebar navigation for Products, My Links, Reports, Payouts, and Settings.
  - Referral API Tracking: Click tracking (`POST /api/v1/affiliate/referrals/click`) and resolve endpoints.
- **Defects & Limitations:**
  - `DEF-03`: `AffiliateDashboardService` executes raw MySQL `DATE_FORMAT(created_at, "%Y-%m")` which fails under SQLite local dev (`PDOException: no such function: DATE_FORMAT`). Verified functional under MySQL Docker stack.
- **Result:** **VERIFIED WITH LIMITATIONS** (Architecture & auth passed; SQLite analytics query blocked).

### 2.6 Role F — Platform Admin (`phone: 500000001`)
- **Verified Capabilities:**
  - Admin Authentication: Dedicated admin login (`/admin/login`) with credential verification.
  - Admin Dashboard: System metrics, overview charts.
  - User Management: User lookup, status inspection.
  - Shipping Configuration: Carrier rate tables and shipping policies (`admin-shipping.spec.ts`).
  - Maintenance Control: Dynamic maintenance mode toggling verified against health endpoint (`maintenance.spec.ts`).
  - CMS & Moderation: Blog articles authoring, publishing, unpublishing lifecycle (`blog-admin.spec.ts`).
- **Result:** **VERIFIED PASS** (100% of journey cases passed in serial mode).

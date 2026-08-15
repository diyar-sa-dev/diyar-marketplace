# DIYAR — Repository Audit

> **Stage:** 0 — Discovery & Architecture  
> **Phase:** 0.1 — Repository Audit  
> **Date:** 2026-08-15  
> **Auditor:** AI Development Agent  
> **Classification:** EXISTING | INFERRED | REQUIRED | PROPOSED | UNKNOWN

---

## 1. Audit Purpose

Document the actual state of the `diyar-marketplace` Git repository before workspace reorganization and backend foundation. This audit is the authoritative baseline for Stage 0 deliverables.

---

## 2. Git State (EXISTING — captured 2026-08-15)

| Item | Value |
|------|-------|
| Repository root | `diyar-marketplace/` |
| Remote | `origin` → `https://github.com/diyar-sa-dev/diyar-marketplace.git` |
| Current branch | `dev` |
| `main` branch | Exists at same commit as `dev` |
| HEAD commit | `f324955` — *refactor: remove unused files and update project structure* |
| Staged changes | None |
| Unstaged changes | `package-lock.json` (modified) |
| Untracked | `conception/` (partial Stage 0 docs) |
| `.git` location | Repository root (preserved during restructure) |

### Pre-restructure checkpoint recommendation

Before moving files to `frontend/`, create a commit or tag checkpoint. **Not performed automatically** — project owner controls commits.

---

## 3. Repository Inventory

| Area | Current State | Details | Status |
|------|---------------|---------|--------|
| Frontend | React 19 SPA | ~66 TSX files, 46 routes, RTL Arabic UI | **Existing** |
| Backend | Laravel 13 scaffold | `backend/` — health route only, no business modules | **Partial (scaffold)** |
| Database | None | No migrations, schema, or ORM | **Missing** |
| Authentication | Mock | `localStorage.isLoggedIn = 'true'` in `AuthPage.tsx` | **Partial (mock)** |
| Authorization | None | No route guards; dashboards public | **Missing** |
| API | None | No HTTP client usage in frontend | **Missing** |
| Storage | External URLs | Unsplash, ui-avatars.com; SVGs in `public/` | **Partial** |
| Notifications | UI mocks | Customer + partner notification pages | **Partial (mock)** |
| Payments | UI mocks | Mada, Visa, Apple Pay, Tabby in checkout UI | **Partial (mock)** |
| Finance/Ledger | None | Vendor finance pages use chart mocks only | **Missing** |
| Admin | None | No admin routes or backend | **Missing** (V1 required per baseline) |
| Deployment | GitHub Pages | `.github/workflows/deploy-pages.yml` | **Existing (frontend only)** |
| Testing | None | `npm run lint` = `tsc --noEmit` | **Missing** |
| Environment | None | No `.env` or `.env.example` | **Missing** |
| Conception docs | Partial | `PROJECT_SPECIFICATION.md`, `PLAN.md` (prior discovery) | **Partial** |

---

## 4. Directory Structure (Pre-Reorganization)

```
diyar-marketplace/                 # Git root
├── .github/workflows/
│   ├── deploy-pages.yml           # Active: builds dist/ → GitHub Pages
│   └── npm-publish-github-packages.yml  # Unused template
├── conception/                    # Untracked — Stage 0 docs
├── public/                        # Static assets (logo, payment SVGs)
├── src/                           # React application
│   ├── App.tsx                    # All routes (46), global shell
│   ├── main.tsx                   # BrowserRouter + CartProvider
│   ├── index.css                  # Tailwind v4 theme
│   ├── components/                # cards, home, layout, modals
│   ├── context/CartContext.tsx    # Only global state
│   ├── layouts/DashboardLayout.tsx
│   └── pages/                     # 27 storefront + 21 dashboard pages
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── .gitignore
```

**Not present:** `backend/`, `frontend/`, `github/`, `tests/`, `docker/`, `src/api/`, `src/types/`, `src/services/`

---

## 5. Technology Stack (EXISTING)

| Layer | Technology | Version |
|-------|------------|---------|
| UI Framework | React | 19.0.1 |
| Language | TypeScript | ~5.8.2 |
| Bundler | Vite | ^6.2.3 |
| Styling | Tailwind CSS | ^4.1.14 (`@tailwindcss/vite`) |
| Routing | react-router-dom | ^7.15.0 |
| Icons | lucide-react | ^0.546.0 |
| Animation | motion | ^12.23.24 |
| Charts | recharts | ^3.8.1 |
| State | React Context | CartContext only |
| Lint | tsc --noEmit | No ESLint/Prettier |

---

## 6. Route Inventory (46 routes — EXISTING)

Defined in `src/App.tsx`.

### Storefront (18)

| Route | Page | Data Source |
|-------|------|-------------|
| `/` | HomePage | Inline mocks in Sections.tsx |
| `/auth` | AuthPage | localStorage simulation |
| `/category/:id` | CategoryPage | MOCK_PRODUCTS, MOCK_SERVICES |
| `/product/:id` | ProductDetailsPage | MOCK_PRODUCT |
| `/store/:id` | StorePage | STORE_INFO, PRODUCTS |
| `/search` | SearchPage | Client-side mock filter |
| `/services` | ServicesPage | MOCK_SERVICES |
| `/service/:id` | ServicePage | SERVICE_INFO |
| `/provider/:id` | ProviderPage | PROVIDER_INFO |
| `/b2b` | B2BPage | B2B_COMPANIES |
| `/b2b/:id` | B2BCompanyPage | COMPANIES |
| `/ai-designer` | AIDesignerPage | Simulated AI (setTimeout) |
| `/chat` | ChatPage | SEED_CONVERSATIONS |
| `/checkout` | CheckoutPage | MOCK_CART (not CartContext) |
| `/orders` | OrdersPage | MOCK_ORDERS |
| `/wishlist` | WishlistPage | Inline mock |
| `/loyalty` | LoyaltyPage | Inline mock |
| `/blog/:id` | BlogArticlePage | MOCK_ARTICLE |

### Profile (9)

| Route | Page |
|-------|------|
| `/profile` | ProfilePage |
| `/profile/personal-info` | PersonalInfoPage |
| `/profile/addresses` | AddressesPage |
| `/profile/security` | SecurityPage |
| `/profile/reviews` | ReviewsPage |
| `/profile/notifications` | NotificationsPage |
| `/profile/notification-settings` | NotificationSettingsPage |
| `/profile/language` | LanguagePage |
| `/profile/service-requests` | ServiceRequestsPage |

### Dashboard (19)

| Route | Page | Portal |
|-------|------|--------|
| `/dashboard` | DashboardIndex | Picker |
| `/dashboard/vendor` | VendorDashboard | Vendor |
| `/dashboard/vendor/orders` | VendorOrders | Vendor |
| `/dashboard/vendor/products` | VendorProducts | Vendor |
| `/dashboard/vendor/team` | VendorTeam | Vendor |
| `/dashboard/vendor/finance` | VendorFinance | Vendor |
| `/dashboard/vendor/settings` | VendorSettings | Vendor |
| `/dashboard/vendor/notifications` | Notifications | Vendor |
| `/dashboard/service` | ServiceDashboard | Provider |
| `/dashboard/service/client-requests` | ServiceClientRequests | Provider |
| `/dashboard/service/client-requests/:id` | ServiceClientRequestDetails | Provider |
| `/dashboard/service/bookings` | ServiceBookings | Provider |
| `/dashboard/service/services` | ServiceServices | Provider |
| `/dashboard/service/finance` | ServiceFinance | Provider |
| `/dashboard/service/settings` | ServiceSettings | Provider |
| `/dashboard/service/notifications` | Notifications | Provider |
| `/dashboard/affiliate/*` (7 routes) | Affiliate* pages | Marketer/Affiliate |
| `/dashboard/*` (catch-all) | Placeholder mockup | — |

**Gap:** `/blog` index route referenced in UI but not registered.

---

## 7. Mock Data & Simulated Workflows

### 7.1 Mock Data Pattern

- **No external JSON fixture files**
- All domain data is inline `const` in page/component files
- Only shared typed model: `CartItem` in `CartContext.tsx`
- Widespread `any` types on ProductCard/ServiceCard

### 7.2 Duplicated Mock Entities

| Entity | Files |
|--------|-------|
| Categories | CategoryPage, SidebarMenu, CategoriesStrip |
| Products | CategoryPage, StorePage, Sections (×4), FeaturedDeals, VendorProducts, AffiliateProducts |
| Services | CategoryPage, ServicesPage, ServicePage, Sections, ServiceServices |
| B2B Companies | B2BPage, B2BCompanyPage |

### 7.3 Simulated Workflows

| Workflow | Simulation Method | Real Backend Needed |
|----------|-------------------|---------------------|
| Login/Register | `localStorage.isLoggedIn`; 1.5s delay | Sanctum + OTP |
| Checkout | Local MOCK_CART; alert on coupon | Order engine + payment gateway |
| AI Designer | setTimeout + hardcoded products | LLM (V2) |
| Image Search | Redirect to /search | CV (V2) |
| Service RFQ | Local state only | Service request API |
| Vendor CRUD | Local useState mutation | Product/inventory API |
| Affiliate tracking | Static click counts | Click attribution API |
| Notifications | Static arrays | Notification service |
| Chat | Local message state | Polling API (V1) |

### 7.4 Critical Integration Gaps

1. **Checkout disconnected from CartContext** — checkout uses separate MOCK_CART
2. **No route guards** — `/dashboard/*` accessible without login
3. **Logout defined in App.tsx but not wired** to ProfilePage
4. **Cart not persisted** — resets on refresh except seed items in memory
5. **Hardcoded notification badge** — count `3` in header

---

## 8. Implied Domain Modules (INFERRED from UI)

| Module | UI Evidence | V1 Scope (per baseline) |
|--------|-------------|-------------------------|
| Identity & Auth | AuthPage | V1 |
| Users/Profiles | Profile pages | V1 |
| Vendors | Store, vendor dashboard | V1 |
| Providers | Provider page, service dashboard | V1 |
| Marketers | Affiliate dashboard, auth role `marketer` | Registration V1; full affiliate V1.1 |
| Catalog/Products | Category, product detail, search | V1 |
| Inventory | VendorProducts stock fields | V1 |
| Cart | CartContext, CartSidebar | V1 |
| Checkout/Orders | CheckoutPage, OrdersPage | V1 |
| Payments | Checkout payment methods | V1 |
| Finance/Ledger | VendorFinance, ServiceFinance | V1 |
| Shipping | Per-vendor shipping in checkout | V1 |
| Returns | Not in UI | V1 (required per baseline) |
| Services/RFQ | Service requests, offers | V1 |
| Bookings | ServiceBookings | V1 |
| Reviews | ReviewsPage, product reviews | V1 |
| Coupons | Checkout coupon mock | V1 (admin-controlled) |
| Notifications | Notification pages | V1 (simple) |
| Chat | ChatPage | V1 (polling) |
| Admin | Not in UI | V1 (required per baseline) |
| Loyalty | LoyaltyPage | V1.1 |
| Affiliate | Affiliate dashboard | V1.1 |
| B2B | B2B pages | V1.1 |
| Blog/CMS | BlogArticlePage | V1.1 |
| AI Designer | AIDesignerPage | V2 |

---

## 9. CI/CD (EXISTING)

| Workflow | Status | Notes |
|----------|--------|-------|
| `deploy-pages.yml` | Active | Node 20, `npm ci`, `npm run build`, deploy `./dist` |
| `npm-publish-github-packages.yml` | Dead template | References `npm test` — no test script |

**Post-restructure action required:** Update workflow to build from `frontend/`.

---

## 10. Technical Debt Summary

| Issue | Severity |
|-------|----------|
| No auth/route guards | Critical |
| Mock auth via localStorage | Critical |
| Checkout/cart disconnect | High |
| Duplicated inline mock data | High |
| No shared TypeScript domain types | High |
| Monolithic App.tsx routing | Medium |
| No tests | Medium |
| Missing admin UI prototype | Medium (backend admin V1 still required) |
| Unused npm-publish workflow | Low |

---

## 11. Contradictions with Prior Discovery Doc

The existing `conception/PROJECT_SPECIFICATION.md` (prior discovery) recommended **PostgreSQL**, **Redis**, and **Laravel 11**. The authoritative **Requirements Baseline** (product owner QCM) overrides these:

| Topic | Prior Spec | Authoritative Baseline |
|-------|-----------|------------------------|
| Database | PostgreSQL | **MySQL (V1)** |
| Cache | Redis | **Laravel Cache (V1)** |
| Queue | Redis + Horizon | **Database queue (V1)** |
| Laravel | 11 | **12** |
| Admin | Unknown | **V1 required** |
| Affiliate | Could have V1 | **V1.1** |

Stage 0 architecture documents follow the authoritative baseline.

---

## 12. Target Workspace Structure (PROPOSED)

```
diyar-marketplace/          # Git root (unchanged)
├── github/                 # Git/workflow documentation
├── conception/             # Product & architecture knowledge base
├── frontend/               # React/Vite SPA (moved from root)
└── backend/                # Laravel 13 API (scaffold)
```

---

## 13. Audit Conclusion

The repository is a **high-fidelity frontend prototype** with comprehensive UI coverage of a multi-vendor furniture and services marketplace. The **Laravel 13 API scaffold** exists in `backend/` (Stage 0 only — no business modules). The prototype is the primary source of product intent and must be preserved and progressively connected to the Laravel 13 modular monolith API.

**Next:** Phase 0.2 — Requirements Baseline (`REQUIREMENTS_BASELINE.md`).

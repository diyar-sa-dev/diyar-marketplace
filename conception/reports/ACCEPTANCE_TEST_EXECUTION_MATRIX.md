# DIYAR V1 — Acceptance Test Execution Matrix & Log

**Execution Environment:** `diyar-lap` (Local Windows / PHP-FPM + MySQL / XAMPP)  
**Baseline Commit:** `e8912e9`  
**Date:** 2026-10-11  
**Status Legend:** `NOT RUN` | `IN PROGRESS` | `PASS` | `FAIL` | `BLOCKED` | `NOT APPLICABLE` | `RETEST REQUIRED`

---

## Progress Overview

| Category | Total | Pass | Fail | Blocked | In Progress | Not Run |
|---|---|---|---|---|---|---|
| **A. Guest** | 14 | 0 | 0 | 0 | 0 | 14 |
| **B. Customer** | 20 | 0 | 0 | 0 | 0 | 20 |
| **C. Seller / Vendor** | 17 | 0 | 0 | 0 | 0 | 17 |
| **D. Service Provider** | 16 | 0 | 0 | 0 | 0 | 16 |
| **E. Referral / Affiliate** | 14 | 0 | 0 | 0 | 0 | 14 |
| **F. Admin** | 18 | 0 | 0 | 0 | 0 | 18 |
| **G. Multi-Role Workflows** | 10 | 0 | 0 | 0 | 0 | 10 |
| **H. Shared Usability** | 10 | 0 | 0 | 0 | 0 | 10 |
| **TOTAL** | **119** | **0** | **0** | **0** | **0** | **119** |

---

## A. Guest — Unauthenticated Visitor

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| G-01 | P1 | Open marketplace homepage | NOT RUN | | |
| G-02 | P2 | Navigate public pages (categories, products, services) | NOT RUN | | |
| G-03 | P2 | Browse categories and subcategories | NOT RUN | | |
| G-04 | P1 | Search products and empty search | NOT RUN | | |
| G-05 | P2 | Filters and sorting application | NOT RUN | | |
| G-06 | P1 | Product details (images, variants, pricing, stock) | NOT RUN | | |
| G-07 | P1 | Service details (public details vs private provider info) | NOT RUN | | |
| G-08 | P1 | Guest cart persistence across reloads | NOT RUN | | |
| G-09 | P0 | Guest cart isolation between clean sessions | NOT RUN | | |
| G-10 | P1 | Guest checkout boundary (redirect to login) | NOT RUN | | |
| G-11 | P1 | Login, registration, password recovery entry forms | NOT RUN | | |
| G-12 | P0 | Protected URL access while unauthenticated | NOT RUN | | |
| G-13 | P2 | Invalid route handling (clean 404, no stack trace) | NOT RUN | | |
| G-14 | P2 | Arabic RTL layout and mobile responsiveness | NOT RUN | | |

---

## B. Customer

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| C-01 | P1 | Customer login with valid credentials | NOT RUN | | |
| C-02 | P1 | Invalid customer login handling | NOT RUN | | |
| C-03 | P2 | Profile inspection and modification | NOT RUN | | |
| C-04 | P0 | Customer account data isolation | NOT RUN | | |
| C-05 | P1 | Customer address book CRUD | NOT RUN | | |
| C-06 | P2 | Browse, search, filter products | NOT RUN | | |
| C-07 | P2 | Wishlist persistence | NOT RUN | | |
| C-08 | P1 | Cart operations & quantities | NOT RUN | | |
| C-09 | P0 | Stock boundary enforcement | NOT RUN | | |
| C-10 | P0 | Price, VAT, discounts calculation | NOT RUN | | |
| C-11 | P1 | Checkout validation on missing fields | NOT RUN | | |
| C-12 | P0 | Successful sandbox checkout | NOT RUN | | |
| C-13 | P0 | Failed/cancelled payment handling | NOT RUN | | |
| C-14 | P0 | Order history visibility & isolation | NOT RUN | | |
| C-15 | P1 | Order lifecycle status updates | NOT RUN | | |
| C-16 | P0 | Order cancellation / refund boundary | NOT RUN | | |
| C-17 | P1 | Customer notifications | NOT RUN | | |
| C-18 | P0 | Chat permissions and isolation | NOT RUN | | |
| C-19 | P1 | Service booking completion | NOT RUN | | |
| C-20 | P0 | Customer logout & session invalidation | NOT RUN | | |

---

## C. Seller / Vendor

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| S-01 | P1 | Seller login and dashboard | NOT RUN | | |
| S-02 | P1 | Seller onboarding review/completion | NOT RUN | | |
| S-03 | P0 | Pending/suspended seller approval boundary | NOT RUN | | |
| S-04 | P2 | Store profile update | NOT RUN | | |
| S-05 | P1 | Product creation with required fields | NOT RUN | | |
| S-06 | P1 | Product validation rules | NOT RUN | | |
| S-07 | P1 | Product editing & field permissions | NOT RUN | | |
| S-08 | P1 | Product publish/archive lifecycle | NOT RUN | | |
| S-09 | P0 | Inventory/stock updates | NOT RUN | | |
| S-10 | P0 | Cross-seller product ownership isolation | NOT RUN | | |
| S-11 | P0 | Seller order list scoping | NOT RUN | | |
| S-12 | P1 | Order fulfillment actions | NOT RUN | | |
| S-13 | P0 | Multi-vendor order isolation | NOT RUN | | |
| S-14 | P1 | Seller analytics & reporting | NOT RUN | | |
| S-15 | P0 | Commission & payout calculations | NOT RUN | | |
| S-16 | P0 | Seller communication isolation | NOT RUN | | |
| S-17 | P0 | Seller logout & session invalidation | NOT RUN | | |

---

## D. Service Provider

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| SP-01 | P1 | Provider login & dashboard | NOT RUN | | |
| SP-02 | P1 | Provider onboarding & review | NOT RUN | | |
| SP-03 | P0 | Provider approval restrictions | NOT RUN | | |
| SP-04 | P2 | Provider profile & public info | NOT RUN | | |
| SP-05 | P1 | Service management (CRUD) | NOT RUN | | |
| SP-06 | P1 | Price & working hours availability | NOT RUN | | |
| SP-07 | P1 | Public service listing verification | NOT RUN | | |
| SP-08 | P0 | Booking list scoping | NOT RUN | | |
| SP-09 | P1 | Booking accept / reject | NOT RUN | | |
| SP-10 | P1 | Booking completion lifecycle | NOT RUN | | |
| SP-11 | P0 | Booking cancellation policy enforcement | NOT RUN | | |
| SP-12 | P0 | Double booking prevention | NOT RUN | | |
| SP-13 | P0 | Cross-provider isolation | NOT RUN | | |
| SP-14 | P0 | Chat & notifications isolation | NOT RUN | | |
| SP-15 | P1 | Provider earnings & reports | NOT RUN | | |
| SP-16 | P0 | Provider logout & session invalidation | NOT RUN | | |

---

## E. Referral / Affiliate

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| R-01 | P1 | Referral login & eligibility | NOT RUN | | |
| R-02 | P1 | Referral link / code generation | NOT RUN | | |
| R-03 | P1 | Referral link session capture | NOT RUN | | |
| R-04 | P1 | Registration attribution | NOT RUN | | |
| R-05 | P0 | Purchase conversion attribution | NOT RUN | | |
| R-06 | P0 | Commission calculation | NOT RUN | | |
| R-07 | P0 | Duplicate conversion protection | NOT RUN | | |
| R-08 | P0 | Self-referral prohibition | NOT RUN | | |
| R-09 | P1 | Invalid / expired code handling | NOT RUN | | |
| R-10 | P1 | Commission lifecycle | NOT RUN | | |
| R-11 | P0 | Cross-affiliate financial isolation | NOT RUN | | |
| R-12 | P0 | Payout / withdrawal validation | NOT RUN | | |
| R-13 | P1 | Referral analytics & metrics | NOT RUN | | |
| R-14 | P0 | Referral logout & session invalidation | NOT RUN | | |

---

## F. Admin

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| A-01 | P0 | Admin login & dashboard | NOT RUN | | |
| A-02 | P0 | Admin invalid login handling | NOT RUN | | |
| A-03 | P0 | Admin session timeout & logout | NOT RUN | | |
| A-04 | P1 | User lookup & profile controls | NOT RUN | | |
| A-05 | P0 | Seller approval / rejection | NOT RUN | | |
| A-06 | P0 | Service provider approval / rejection | NOT RUN | | |
| A-07 | P0 | User account suspension | NOT RUN | | |
| A-08 | P1 | Catalog moderation | NOT RUN | | |
| A-09 | P1 | Order inspection | NOT RUN | | |
| A-10 | P0 | Payment & refund controls | NOT RUN | | |
| A-11 | P1 | Disputes / support cases | NOT RUN | | |
| A-12 | P0 | Role-based least-privilege enforcement | NOT RUN | | |
| A-13 | P1 | Admin audit trail logging | NOT RUN | | |
| A-14 | P1 | Reports & secure data export | NOT RUN | | |
| A-15 | P0 | System settings management | NOT RUN | | |
| A-16 | P0 | Customer private data isolation | NOT RUN | | |
| A-17 | P0 | API boundary enforcement without admin role | NOT RUN | | |
| A-18 | P0 | Admin logout & back-navigation protection | NOT RUN | | |

---

## G. Multi-Role End-to-End Workflows

| ID | Priority | Test Case | Status | Actual Result / Evidence | Defect ID |
|---|---|---|---|---|---|
| WF-01 | P0 | Guest discovery to customer purchase | NOT RUN | | |
| WF-02 | P0 | Customer order through seller fulfillment | NOT RUN | | |
| WF-03 | P0 | Multi-vendor order scoping | NOT RUN | | |
| WF-04 | P1 | Customer service booking through provider | NOT RUN | | |
| WF-05 | P0 | Referral conversion and commission | NOT RUN | | |
| WF-06 | P0 | Seller onboarding and approval | NOT RUN | | |
| WF-07 | P0 | Service provider onboarding and approval | NOT RUN | | |
| WF-08 | P0 | Payment lifecycle and webhook effects | NOT RUN | | |
| WF-09 | P0 | Cancellation, refund and stock consistency | NOT RUN | | |
| WF-10 | P0 | Cross-role access-control challenge | NOT RUN | | |

---

## H. Shared Usability & Regression Checks

| ID | Check | Status | Actual Result / Evidence |
|---|---|---|---|
| UX-01 | Arabic RTL layout & text alignment | NOT RUN | |
| UX-02 | Navigation menus & deep linking | NOT RUN | |
| UX-03 | Form error validation & feedback | NOT RUN | |
| UX-04 | Loading & empty states | NOT RUN | |
| UX-05 | Responsive layout on laptop/desktop | NOT RUN | |
| UX-06 | Page reload state persistence | NOT RUN | |
| UX-07 | Double-click / duplicate submission protection | NOT RUN | |
| UX-08 | Session expiration response | NOT RUN | |
| UX-09 | Clean error handling (no stack traces) | NOT RUN | |
| UX-10 | Browser console clean of fatal errors | NOT RUN | |

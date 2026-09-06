# Phase 28.5 — E2E Workflow Matrix

**Evidence:** Playwright CI-parity run (`_e2e_playwright_ci_parity.txt`)

---

## Guest / public

| Workflow | Spec coverage | Result |
|----------|---------------|--------|
| Homepage | customer-journey, responsive-smoke | **PASS** |
| Catalog / search | customer-journey | **PASS** |
| Product detail | customer-journey | **PASS** |
| Services discovery | customer-journey, provider-journey | **PASS** |
| Blog public | blog.spec | **PASS** |
| B2B directory | b2b.spec | **PASS** |
| Loyalty guest | loyalty.spec | **PASS** |
| Projects sidebar | projects.spec | **PASS** (timing-sensitive) |

---

## Customer

| Workflow | Spec | Result |
|----------|------|--------|
| Login / profile | customer-journey | **PASS** |
| Cart prompt | customer-journey | **PASS** |
| Loyalty authenticated | loyalty.spec | **PASS** |
| Notifications | messaging.spec | **PASS** |
| Chat | messaging.spec | **PASS** |
| B2B RFQ | b2b-admin (serial — skipped after worker fail) | **NOT RUN** |
| Checkout E2E | — | **NOT VERIFIED** (no dedicated Playwright checkout spec) |
| Orders / payments | — | **NOT VERIFIED** browser E2E |

---

## Vendor

| Workflow | Spec | Result |
|----------|------|--------|
| Dashboard | vendor-journey | **PASS** |
| Products | vendor-journey | **PASS** |
| Orders | vendor-journey | **PASS** |
| Settings / upload | upload-smoke | **PARTIAL** |
| Coupons / analytics | — | **NOT VERIFIED** E2E |

---

## Provider

| Workflow | Spec | Result |
|----------|------|--------|
| Dashboard | provider-journey | **PASS** |
| Services mgmt | provider-journey | **PASS** |
| Public services | provider-journey | **PASS** |
| Bookings / RFQ | — | **NOT VERIFIED** E2E |

---

## B2B

| Workflow | Spec | Result |
|----------|------|--------|
| Public listing | b2b.spec | **PASS** |
| Draft hidden / admin filter | b2b-admin | **PASS** |
| Publish flow | b2b-admin | **PASS** |
| Admin authZ test | b2b-admin | **FAIL** (test harness) |

---

## Admin

| Workflow | Spec | Result |
|----------|------|--------|
| Login / dashboard | admin-journey | **PASS** |
| Users / settings | admin-journey | **PASS** |
| Shipping config | admin-shipping | **PASS** |
| Blog CRUD | blog-admin | **PASS** |
| Analytics hub | analytics.spec | **PASS** |
| Chat reports | messaging.spec | **PASS** |
| B2B companies | b2b-admin | **PASS** (2/3) |

---

## Auth / session

| Workflow | Spec | Result |
|----------|------|--------|
| Dual session isolation | auth-isolation | **6/6 PASS** |
| Admin/marketplace API separation | auth-isolation | **PASS** |
| Refresh persistence | auth-isolation | **PASS** |

---

## Realtime

| Workflow | Evidence |
|----------|----------|
| Chat page load | messaging.spec **PASS** |
| WebSocket delivery | **NOT VERIFIED** (polling/Echo not instrumented in E2E) |
| Notifications | Page load **PASS**; push **NOT VERIFIED** |

---

## Gate

```text
PARTIAL
```

Major portals covered; checkout/order/payment full browser flows **NOT VERIFIED**.

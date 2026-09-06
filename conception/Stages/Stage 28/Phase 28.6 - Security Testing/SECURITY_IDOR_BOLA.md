# Phase 28.6 — Security IDOR / BOLA

---

## Test matrix (automated — executed)

| Resource | User A → User B | Test | Result |
|----------|-----------------|------|--------|
| Vendor account | GET | OwnershipAuthorizationTest | **403** |
| Provider account | GET | OwnershipAuthorizationTest | **403** |
| Order | GET/PATCH | OrderAuthorizationTest | **403/404** |
| Cart item | GET/PATCH | CartTest | **403** |
| Product (vendor) | PATCH | ProductIdorTest | **403** |
| Return request | GET | ReturnAuthorizationTest | **403** |
| B2B lead | GET | B2bCompanyTest | **403** |
| Vendor B2B company | PATCH | PartnerB2bCompanyTest | **403** |
| Chat conversation | GET | ChatApiTest | **403** |
| Loyalty summary | GET | LoyaltyHardeningTest | **403** |
| Vendor analytics | vendor_id param | VendorAnalyticsTest | **403** |

---

## ID type coverage

| ID style | Tested |
|----------|--------|
| UUID (orders, users) | Yes |
| Slug (B2B, blog) | Yes |
| Nested routes | Partial |
| Query parameters | Partial (analytics) |

---

## MySQL 8 subset (Phase 28.3)

41 critical tests included IDOR/auth subsets — **41/41 PASS** on MySQL 8.0.46.

---

## Gaps (NOT VERIFIED)

| Resource | Status |
|----------|--------|
| Notifications (per-ID) | KI-028-031 |
| Payment records direct access | Partial via order tests |
| Affiliate ledger entries | Partial |
| Admin nested resources (all 167 routes) | Sample only |
| File/media direct URL guessing | **NOT VERIFIED** |

---

## Gate

```text
PARTIAL
```

No unauthorized 200/mutation observed in executed matrix. Exhaustive BOLA not proven.

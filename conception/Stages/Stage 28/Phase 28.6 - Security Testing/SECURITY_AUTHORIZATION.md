# Phase 28.6 — Security Authorization

**Method:** PHPUnit policy/middleware tests + source inspection

---

## Automated coverage (focused suite — PASS)

| Test class | Domain |
|------------|--------|
| `OwnershipAuthorizationTest` | Vendor/provider account ownership |
| `OrderAuthorizationTest` | Customer/vendor order access |
| `ReturnAuthorizationTest` | Return requests |
| `ProductIdorTest` | Vendor product mutations |
| `CartTest` | Cross-user cart items |
| `AdminB2bCompanyTest` | Admin vs customer |
| `PartnerB2bCompanyTest` | Vendor B2B scope |
| `BlogSecurityTest` | Admin blog routes |
| `ProjectSecurityTest` | Admin projects |
| `AdminSecurityHardeningTest` | Permission granularity |
| `AdminShippingSecurityTest` | Admin shipping |
| `VendorAnalyticsTest` | Cross-vendor analytics param |

---

## Chat authorization

**25/25 PASS** — `ChatApiTest`, `ChatModerationTest`

- Vendor cannot access another vendor's conversation  
- Customer conversation membership enforced  
- Admin oversight permission-gated  

---

## Loyalty authorization

`LoyaltyHardeningTest`: customer cannot view another customer's loyalty — **PASS** (in extended run; 4 unrelated commerce config tests failed)

---

## Gaps

| Area | Status |
|------|--------|
| Exhaustive per-route IDOR (480 routes) | **NOT VERIFIED** |
| Notification IDOR matrix | **PARTIAL** (KI-028-031) |
| Assistant endpoint authZ | **N/A** — intentionally public (KI-028-053) |

---

## Gate

```text
PARTIAL
```

Strong automated coverage on critical domains; not exhaustive per-endpoint.

# Phase 28.3 — API Authorization & IDOR

**Date:** 2026-08-27

---

## Role matrix (actual roles)

| Role | Marketplace API | Admin API | Test evidence |
|------|-----------------|-----------|---------------|
| **customer** | Own profile, cart, orders | Blocked | `OrderAuthorizationTest`, `CartTest` |
| **vendor** | Own products, orders, settings | Blocked from marketplace admin paths | `ProductIdorTest`, `AdminIsolationTest` |
| **provider** | Own services, bookings | Blocked | `OwnershipAuthorizationTest`, service tests |
| **marketer** | Affiliate dashboard | Blocked | `AffiliateCommerceTest` |
| **admin** | **Blocked** from marketplace me/vendor | Full admin with permissions | `AdminIsolationTest` |

---

## Object-level authorization tests

### Orders

| Test | Result |
|------|--------|
| Customer A cannot view Customer B's order | **403** — `OrderAuthorizationTest` |
| Dual-role admin+vendor cannot view another customer's order via marketplace | **403** — PASS |
| Vendor cannot view unrelated vendor order | **403** — PASS |

### Vendor / provider accounts

| Test | Result |
|------|--------|
| Vendor views own account | **200** |
| Vendor views another vendor account | **403** — `OwnershipAuthorizationTest` |
| Provider cross-access | **403** — PASS |
| Customer accessing vendor account | **403** — PASS |
| Admin via marketplace vendor account route | **403** — PASS |

### Products (vendor dashboard)

| Test | Result |
|------|--------|
| Vendor CRUD own product | **200/201** — `ProductIdorTest` |
| Vendor modify another vendor's product | **403** — PASS |
| Vendor adjust another vendor's inventory | **403** — PASS |

### Admin RBAC

| Test | Result |
|------|--------|
| Permission-gated admin routes | `AdminSecurityHardeningTest`, `CategoryAdminTest` |
| Admin chat oversight scoped | `AdminChatOversightTest` |
| Admin shipping security | `AdminShippingSecurityTest` |

### B2B

| Test | Result |
|------|--------|
| Company tenant isolation | `B2bCompanyTest`, `PartnerB2bCompanyTest` |
| Admin B2B management | `AdminB2bCompanyTest` |

### Chat

| Test | Result |
|------|--------|
| Participant-only conversation access | `ChatApiTest` |
| Non-participant denied | PASS |
| Admin oversight separate path | `AdminChatOversightTest` |

---

## IDOR probe summary

| Resource type | Cross-user access blocked? | Evidence |
|---------------|----------------------------|----------|
| Orders | YES | `OrderAuthorizationTest` |
| Vendor accounts | YES | `OwnershipAuthorizationTest` |
| Vendor products | YES | `ProductIdorTest` |
| Provider accounts | YES | `OwnershipAuthorizationTest` |
| Notifications | PARTIAL | `NotificationApiTest` — not exhaustive IDOR matrix |
| Conversations/messages | YES | `ChatApiTest` |
| B2B company data | YES | B2B test suite |
| Affiliate earnings | PARTIAL | Commerce tests — not every report endpoint |

---

## Expected denial semantics

Application consistently uses:

```text
401 — unauthenticated
403 — authenticated but forbidden
404 — not found (some public resources hide existence)
422 — validation / business rule
```

No **200 with another user's data** observed in executed test suite.

---

## MySQL 8 verification

Included in 41-test subset:

- `OrderAuthorizationTest`
- `OwnershipAuthorizationTest`
- `ProductIdorTest`

**Result:** **41/41 PASS** on MySQL 8.0.46

---

## Authorization gate

| Area | Result |
|------|--------|
| Role separation (admin vs marketplace) | **PASS** |
| Order/product ownership | **PASS** |
| Full IDOR matrix all 480 routes | **PARTIAL** |

---

## Security observations (not P0/P1)

| ID | Finding | Severity |
|----|---------|----------|
| KI-028-031 | Notification IDOR not exhaustively probed | P3 |
| KI-028-032 | 151 dashboard routes rely on suite coverage not per-route IDOR table | P3 |

Dedicated abuse matrix → **Phase 28.6**

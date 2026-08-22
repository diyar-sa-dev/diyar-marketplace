# Stage 18 — Admin Capability Matrix

**Date:** 2026-08-22  
**Legend:** ✅ Implemented today · 🎯 Stage 18 target · 👁 Observe only · 🚫 Must not · ⚠️ Partial

Matrix maps **existing repository domains** to admin capabilities. Financial/state actions must use domain services, not raw CRUD.

---

## Summary by Domain

| Domain | See | Search/Filter | Create | Edit | Approve/Reject | Suspend | Domain actions | Export | Audit |
|--------|-----|---------------|--------|------|----------------|---------|----------------|--------|-------|
| Users | 🎯 | 🎯 | 🚫 | 🎯 limited | — | 🎯 | password reset trigger 👁 | 🎯 | 🎯 |
| Roles | 🎯 | 🎯 | 🚫 | 👁 | — | 🎯 if supported | assign/revoke 🎯 | 👁 | 🎯 |
| Vendors | 🎯 | 🎯 | 🚫 | 🎯 | 🎯 | 🎯 | team 👁 | 🎯 | 🎯 |
| Providers | 🎯 | 🎯 | 🚫 | 🎯 | 🎯 | 🎯 | services 👁 | 🎯 | 🎯 |
| Categories | ✅ API | ✅ | ✅ | ✅ | — | ✅ deactivate | reorder 🎯 | 🎯 | 🎯 |
| Products | 🎯 | 🎯 | 🚫 | 🎯 ops | — | 🎯 | via ProductService | 🎯 | 🎯 |
| Inventory | 🎯 | 🎯 | 🚫 | 🚫 | — | — | adjust via InventoryService 🎯 | 🎯 | 🎯 |
| Cart | 👁 | 👁 | 🚫 | 🚫 | — | — | 🚫 | 👁 | 👁 |
| Orders | 🎯 | 🎯 | 🚫 | 🚫 | — | — | OrderStateService 🎯 | 🎯 | 🎯 |
| Payments | 🎯 | 🎯 | 🚫 | 🚫 | — | — | reconcile 👁 | 🎯 | 🎯 |
| Refunds/Returns | 🎯 | 🎯 | 🚫 | 🚫 | 🎯 | — | RefundCalculationService 🎯 | 🎯 | 🎯 |
| Commissions | 🎯 | 🎯 | 🚫 | 🚫 | — | — | reversal 👁 | 🎯 | 🎯 |
| Vendor balances | 🎯 | 🎯 | 🚫 | 🚫 | — | — | 🚫 direct edit | 🎯 | 🎯 |
| Vendor payouts | ✅ API | ✅ | 🚫 | 🚫 | ✅ | — | PayoutService ✅ | 🎯 | 🎯 |
| Provider payouts | 🎯 | 🎯 | 🚫 | 🚫 | 🎯 | — | ProviderPayoutService 🎯 | 🎯 | 🎯 |
| Affiliate profiles | 🎯 | 🎯 | 🚫 | 🎯 | — | 🎯 | — | 🎯 | 🎯 |
| Affiliate links | 🎯 | 🎯 | 🚫 | 🚫 | — | 🎯 disable | — | 🎯 | 🎯 |
| Affiliate attribution | 👁 | 👁 | 🚫 | 🚫 | — | — | abuse review 👁 | 🎯 | 👁 |
| Affiliate commissions | 🎯 | 🎯 | 🚫 | 🚫 | — | — | reversal 👁 | 🎯 | 🎯 |
| Affiliate payouts | ✅ API | ✅ | 🚫 | 🚫 | ✅ | — | AffiliateAdminPayoutService ✅ | 🎯 | 🎯 |
| Coupons | 🎯 | 🎯 | 🎯 | 🎯 | — | 🎯 | VendorCouponManagementService | 🎯 | 🎯 |
| Reviews | 🎯 | 🎯 | 🚫 | 🎯 moderate | 🎯 hide | — | — | 🎯 | 🎯 |
| Service requests | 🎯 | 🎯 | 🚫 | 🚫 | — | — | intervene ⚠️ domain only | 🎯 | 🎯 |
| Service bookings | 🎯 | 🎯 | 🚫 | 🚫 | — | — | booking transitions 🎯 | 🎯 | 🎯 |
| Notifications | 👁 | 👁 | 🚫 | 🎯 config | — | — | resend 👁 | 👁 | 🎯 |
| Chat | 👁 | 👁 | 🚫 | 🚫 | — | — | archive 👁 | 🚫 | 🎯 |
| Shipping | 🎯 | 🎯 | 🎯 rules | 🎯 | — | — | VendorShippingSettings 👁 | 🎯 | 🎯 |
| Settings | 🎯 | 🎯 | 🎯 | 🎯 | — | — | SystemSettingService 🎯 | 🚫 | 🎯 |
| Feature flags | 🎯 | 🎯 | 🎯 | 🎯 | — | — | — | 🚫 | 🎯 |

---

## Stage 0 — Discovery / Architecture

| Capability | Admin |
|------------|-------|
| See module health, version, queue status | 🎯 Phase 18.1 dashboard widgets |
| Edit infrastructure secrets | 🚫 |
| Feature flags (business) | 🎯 Phase 18.3 |

---

## Stage 2 — Identity & Access

### Users (`User`, `UserRole`)

| SEE | SEARCH/FILTER | CONTROL | MUST NOT |
|-----|---------------|---------|----------|
| Profile, status, roles, created_at | email, phone, status, role | suspend/restore, role assign/revoke | passwords, OTP, tokens |
| Auth metadata (last login if stored) | date range | force logout ⚠️ if exists | impersonate without audit |

**Reuse:** `AuthService`, `ProfileService`, existing `Role` / `UserRole` models.

### Roles (`Role`)

| SEE | CONTROL | MUST NOT |
|-----|---------|----------|
| List roles, assigned counts | activate/deactivate if enum supports | invent new roles without migration |

---

## Stage 4 — Catalog

### Categories — ⚠️ **Only admin CRUD implemented today**

| SEE | CONTROL | Service |
|-----|---------|---------|
| Full CRUD via API ✅ | activate, reorder, hierarchy | `CategoryService` + `CategoryPolicy` |

**Filament:** Wrap existing controller logic or call `CategoryService` directly.

### Products (`Product`, `ProductImage`, `ProductColor`)

| SEE | CONTROL | Service |
|-----|---------|---------|
| list, vendor, category, price, status, inventory link | activate/deactivate/archive via domain | `ProductService`, policies |
| affiliate settings link | moderate content fields | `ProductAffiliateSettingsService` (vendor-owned; admin override ⚠️ PO decision) |

---

## Stage 5 — Inventory

| SEE | CONTROL | Service |
|-----|---------|---------|
| stock, reserved, movements, reservations | **adjustment with reason** | `InventoryService` |
| low stock alerts | 🚫 set qty directly from UI | movements audit trail exists |

---

## Stage 6 — Cart

| SEE | CONTROL |
|-----|---------|
| active carts, items, totals, user | 🚫 edit quantities silently |
| abandoned carts (by updated_at) | 🚫 delete without audit |

---

## Stage 7 — Orders

| SEE | CONTROL |
|-----|---------|
| order, vendor_orders, items, snapshots, totals, VAT | **explicit actions only** via `OrderStateService` |
| payment link, shipment link | 🚫 PATCH status field |

**Detail tabs:** Overview · Customer · Vendor orders · Items · Financials · Payment · Shipping · Reservations · Affiliate · Timeline · Audit

---

## Stage 8 — Payments

| SEE | MUST NOT |
|-----|----------|
| payment records, gateway ids (safe), status, attempts | card data, gateway secrets |
| webhook events | fake paid status |

---

## Stage 9 — Finance

### Vendor commissions & balances

| SEE | CONTROL |
|-----|---------|
| `FinancialTransaction` ledger, commission status | 🚫 edit amounts |
| vendor balance summary | adjustments only via defined services |

### Vendor payouts — ✅ **Admin API exists**

| Action | Service | Implemented |
|--------|---------|-------------|
| list | `PayoutService` | ✅ |
| approve / reject / mark-paid | `PayoutService` | ✅ |

**Filament:** Call same service methods; record audit log.

---

## Stage 10 — Shipping

| SEE | CONTROL |
|-----|---------|
| `VendorShippingSettings`, `Shipment` on orders | configure rules where `ShippingQuoteService` applies |
| fulfillment status | vendor fulfillment service for ops overrides ⚠️ |

---

## Stage 11 — Returns / Refunds

| SEE | CONTROL |
|-----|---------|
| `ReturnRequest`, `Refund`, evidence | approve/reject via return/refund services |
| commission reversal linkage | 🚫 direct total mutation |

**Services:** `ReturnEligibilityService`, `RefundCalculationService`, listeners on payment/refund.

---

## Stage 12 — Vendor Portal

| SEE | CONTROL |
|-----|---------|
| `VendorAccount`, legal profile, team, products, orders | suspend/activate account |
| finance summary | 🚫 bypass vendor permissions |

---

## Stage 13 — Provider Portal

| SEE | CONTROL |
|-----|---------|
| `ProviderAccount`, services, requests, offers, bookings | approve/suspend provider |
| provider finance | payout review 🎯 |

---

## Stage 15 — Coupons

| SEE | CONTROL |
|-----|---------|
| `VendorCoupon`, usage | via `VendorCouponManagementService` |
| activate/deactivate | audited |

---

## Stage 16 — Notifications

| SEE | CONTROL |
|-----|---------|
| `UserNotification`, delivery status | template/config 🎯 Phase 18.3 |
| failures | resend ⚠️ if service supports |

---

## Stage 17 — Chat

| SEE | CONTROL |
|-----|---------|
| conversations (privacy-safe) | archive/moderate ⚠️ |
| messages metadata | 🚫 expose attachments unnecessarily |

**Reuse:** `ConversationService`, `ChatAuthorizationService`.

---

## Stage 17.6 — Affiliate

### Profiles, links, clicks, attribution, commissions

| Entity | Admin SEE | Admin CONTROL |
|--------|-----------|---------------|
| `AffiliateProfile` | ✅ data exists | suspend/activate 🎯 |
| `AffiliateLink` | ✅ | disable abusive links 🎯 |
| `AffiliateClick` / `AffiliateAttribution` | ✅ | 👁 abuse detection |
| `AffiliateCommission` | ✅ | 👁 reversal via order/refund domain |
| `ProductAffiliateSetting` | ✅ | inspect; override ⚠️ PO |

### Affiliate payouts — ✅ **Admin API exists**

Same pattern as vendor payouts: approve → processing → mark-paid / reject.

### Platform config (env today → DB Phase 18.3)

| Setting | Current source | Admin edit |
|---------|----------------|------------|
| min/max commission % | `DIYAR_AFFILIATE_*` env | 🎯 DB override |
| attribution days | env | 🎯 |
| payout minimum | env | 🎯 |

---

## Stage 18 — New Infrastructure

| Component | Purpose |
|-----------|---------|
| `SystemSetting` | Typed runtime business config |
| `AdminAuditLog` | Append-only admin action log |
| `FeatureFlag` | Optional; or settings group `feature.*` |
| Filament panel `/admin` | Operational UI |
| Effective config resolver | DB → cache → env fallback |

---

## Permissions Model (Proposed — reconcile with Stage 2)

Start with **`admin` role gate** (existing) + introduce capability keys incrementally:

```text
users.view | users.suspend | roles.manage
vendors.view | vendors.approve | vendors.suspend
orders.view | orders.action.*
payments.view
payouts.view | payouts.approve | payouts.process
refunds.view | refunds.approve
affiliate.view | affiliate.payouts.process
settings.view | settings.update
audit.view
```

**V1 default:** full access for `admin` role; split roles deferred unless PO requires in 18.1.

---

## Must NOT Matrix (Global)

| Action | Reason |
|--------|--------|
| Edit `.env` from UI | Security / deployment boundary |
| Display/write secrets | PCI / auth safety |
| Direct balance/commission/total fields | Financial integrity |
| Arbitrary order status PATCH | State machine bypass |
| Bulk financial actions without per-record auth | Fraud risk |
| CSS/JS injection via settings | XSS |
| Fake KPIs on dashboard | Operational trust |

---

## Filament Resource Priority (Phase 18.2)

### Tier 1 — Critical
Users · Roles · Vendors · Providers · Products · Categories · Orders · Payments · Refunds · Commissions · Balances · Payouts (vendor + affiliate)

### Tier 2
Coupons · Reviews · Service requests · Bookings · Notifications · Affiliate links/clicks · Inventory · Shipping

### Tier 3
Reports · Content/theme · Health · Advanced config

---

*Cross-reference: [STAGE_18_ENTRY_AUDIT.md](./STAGE_18_ENTRY_AUDIT.md) · [STAGE_18_ARCHITECTURE.md](./STAGE_18_ARCHITECTURE.md)*

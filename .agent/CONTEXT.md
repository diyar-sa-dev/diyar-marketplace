# DIYAR — Project Context

> **Status:** CURRENT — quick reference for AI agents  
> **Live stage status:** [.agent/CURRENT_STATE.md](./CURRENT_STATE.md) · [Stage 18 README](../conception/Stages/Stage%2018/README.md)

---

## Product

Arabic RTL multi-vendor marketplace targeting Saudi Arabia. Furniture + home services. Currency: SAR. VAT: 15%.

---

## User Roles

Customer · Vendor · Service Provider · Marketer · **Admin (operations)**

---

## V1 Domains

**Stages 0–12.5 (COMPLETE):** Identity, catalog, commerce, payments, finance, shipping, returns, vendor portal, vendor teams, preorders.

**Stage 13 (COMPLETE):** Provider / service marketplace — catalog, RFQ, offers, bookings, provider portal.

**Stage 14 (COMPLETE):** Reviews audit — unified history, provider review guards.

**Stage 15 (COMPLETE):** Vendor percentage coupons — checkout integration + vendor UI.

**Stage 16 (COMPLETE):** Notifications — in-app, email, push, Reverb broadcasts, preference resolver.

**Stage 17 (COMPLETE):** Realtime chat — conversations, messages, attachments, Echo/Reverb UI.

**Stage 17.6 (COMPLETE):** Affiliate commerce — attribution, commissions, marketer dashboard, ledger integration.

**Stage 18 (COMPLETE / VERIFIED — automated):** Admin / Operations — React admin SPA, dual-guard auth, RBAC, audit, runtime settings.

**Not yet authorized:** V1 production deploy without explicit sign-off.

---

## Key Business Rules

| Domain | Rule |
|--------|------|
| Commission | Product → Vendor → Category → Global resolution; configurable, do not hard-code 10% |
| Orders | Parent order + separate VendorOrder statuses |
| Inventory | `available = stock - reserved`; transaction-safe |
| Payments | `PaymentGatewayInterface`; Mada, Card, Apple Pay, Tabby; webhook verification |
| Finance | Append-only ledger |
| Chat | Reverb/Echo realtime (Stage 17) |
| Admin auth | Separate `admin` guard; marketplace `web` guard — contexts must not leak |

---

## Repository Layout

```
diyar-marketplace/
├── .agent/           ← AI control layer
├── backend/          ← Laravel 13 API (/api/v1 + /api/v1/admin)
├── frontend/         ← React 19 SPA (marketplace + dashboards + admin)
├── conception/       ← Product & architecture docs
└── .github/          ← CI/CD
```

---

## Doc Priority

1. Repository state
2. `.agent/`
3. `conception/REQUIREMENTS_BASELINE.md`
4. `conception/MASTER_DEVELOPMENT_PLAN.md`
5. Architecture, business, ADRs
6. Stage completion reports (latest: **Stage 18**)

Laravel 13 wins over any Laravel 11/12 references in older docs.

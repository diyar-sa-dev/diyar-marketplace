# DIYAR — Project Context

> **Status:** CURRENT — quick reference for AI agents  
> **Live stage status:** [.agent/CURRENT_STATE.md](./CURRENT_STATE.md) · [Stage 13 README](../conception/Stages/Stage%2013/README.md)

---

## Product

Arabic RTL multi-vendor marketplace targeting Saudi Arabia. Furniture + home services. Currency: SAR. VAT: 15%.

---

## User Roles

Customer · Vendor · Service Provider · Marketer · Admin

---

## V1 Domains

**Stages 0–12.5 (COMPLETE):** Identity, catalog, commerce, payments, finance, shipping, returns, **vendor** portal, vendor teams, preorders.

**Stage 13 (COMPLETE):** **Provider / service marketplace** — catalog, RFQ, offers, bookings, negotiation UI, provider portal.

**Stage 14 (COMPLETE):** Reviews audit — unified history, provider review guards.

**Stage 15 (IN PROGRESS):** Vendor percentage coupons — checkout integration + vendor UI.

**Not authorized yet:** Admin ops, real notification pipeline, chat, production hardening.

---

## Key Business Rules

| Domain | Rule |
|--------|------|
| Commission | Product → Vendor → Category → Global resolution; configurable, do not hard-code 10% |
| Orders | Parent order + separate VendorOrder statuses |
| Inventory | `available = stock - reserved`; transaction-safe |
| Payments | `PaymentGatewayInterface`; Mada, Card, Apple Pay, Tabby; webhook verification |
| Finance | Append-only ledger |
| Chat V1 | HTTP polling |

---

## Repository Layout

```
diyar-marketplace/
├── .agent/           ← AI control layer
├── backend/          ← Laravel 13 API
├── frontend/         ← React 19 SPA (auth integrated; catalog still mock)
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
6. Stage completion reports

Laravel 13 wins over any Laravel 11/12 references in older docs.

# DIYAR — Project Context

> **Status:** CURRENT — quick reference for AI agents

---

## Product

Arabic RTL multi-vendor marketplace targeting Saudi Arabia. Furniture + home services. Currency: SAR. VAT: 15%.

---

## User Roles

Customer · Vendor · Service Provider · Marketer · Admin

---

## V1 Domains (Not Stage 1)

Identity · Users · Vendors · Providers · Catalog · Products · Categories · Inventory · Cart · Checkout · Orders · Payments · Finance · Shipping · Returns · Reviews · Services · Bookings · Coupons · Notifications · Messaging · Admin · Media

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
├── frontend/         ← React 19 SPA (mock UI)
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

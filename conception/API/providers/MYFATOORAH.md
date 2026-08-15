# MyFatoorah — Payment Provider

> **Status:** SELECTED — integration **DEFERRED**  
> **Region:** Saudi Arabia  
> **Target stage:** Payments / Checkout (Stage 5 in master plan)

---

## Provider

**MyFatoorah**

Saudi Arabia API base:

```text
https://api-sa.myfatoorah.com/
```

DIYAR is a **Saudi Arabia** marketplace. Do not configure or document Algeria-specific endpoints.

---

## Integration Status

| Item | Status |
|------|--------|
| Provider selected | **Yes** |
| API credentials in repo | **No** |
| `MyFatoorahGateway` implementation | **NOT YET IMPLEMENTED** |
| Payment / webhook endpoints | **NOT YET IMPLEMENTED** |

---

## DIYAR Architecture (Required)

```text
Checkout / PaymentService
    ↓
PaymentGateway (internal interface)
    ↓
MyFatoorahGateway
    ↓
MyFatoorah Saudi API
```

**Rule:** Controllers and domain services must not call MyFatoorah HTTP APIs directly.

---

## Future Implementation Requirements

When the Payments stage is authorized, implementation must account for:

| Requirement | Notes |
|-------------|-------|
| Payment creation | Order-linked payment records |
| Payment initiation | Redirect / embedded flow per MyFatoorah |
| Payment status | Polling + webhook reconciliation |
| Webhook V2 | Intended webhook architecture |
| Webhook signature verification | Mandatory before state changes |
| Webhook retries | Idempotent handling |
| Idempotency | Keys on checkout + webhook processing |
| Refunds | Gateway-aligned refund flow |
| Reconciliation | Ledger + gateway reference matching |
| Transaction references | Stored on payment + order records |
| Order/payment state sync | Verified webhook-driven transitions |

Tabby BNPL remains a separate product decision (OD-02).

---

## Environment Variables (Future — Local Only)

```text
MYFATOORAH_API_KEY=           # never commit
MYFATOORAH_WEBHOOK_SECRET=    # never commit
MYFATOORAH_BASE_URL=https://api-sa.myfatoorah.com/
```

---

## Related

- [`../../business/ORDER_RULES.md`](../../business/ORDER_RULES.md)
- [`../../adr/ADR-005-financial-ledger.md`](../../adr/ADR-005-financial-ledger.md)
- [`../../adr/ADR-006-external-providers.md`](../../adr/ADR-006-external-providers.md)

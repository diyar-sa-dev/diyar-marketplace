# Phase 28.6 — Webhook Security

**Test:** `PaymentWebhookSecurityTest` — **PASS**

---

## MyFatoorah payment webhook

| Control | Verified |
|---------|----------|
| Invalid HMAC signature | **401** |
| Valid signature | Processes once |
| Duplicate delivery | Idempotent (`duplicate: true`) |
| Inventory release | Confirmed on paid |

---

## Trust boundary

| Environment | Gateway |
|-------------|---------|
| Local/CI | `DIYAR_PAYMENT_USE_FAKE_GATEWAY=true` + test secret |
| Production | Real MyFatoorah keys — **NOT TESTED** in 28.6 |

**Do not claim production gateway certification** — only application webhook handler logic verified.

---

## Other webhooks

No additional external webhook endpoints identified beyond payment.

---

## Gate

```text
PARTIAL
```

Handler logic verified with test secret; production MyFatoorah trust chain **NOT VERIFIED**.

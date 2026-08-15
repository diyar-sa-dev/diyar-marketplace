# ADR-006 — External Provider Abstraction

| | |
|---|---|
| **Status** | Accepted |
| **Date**  | 2026-08-15 |
| **Stage** | 1 finalization (decisions); integrations deferred |

## Problem

DIYAR integrates with external SaaS providers (payments, SMS/OTP, AI). Direct coupling in controllers or domain services creates vendor lock-in, untestable business logic, and security risks (leaked credentials in scattered code).

## Decision

**External providers are infrastructure adapters, not business logic.**

The application layer depends on internal contracts:

| Domain | Interface | Selected provider | Region | Integration |
|--------|-----------|-------------------|--------|-------------|
| Payments | `PaymentGateway` | **MyFatoorah** | Saudi Arabia (`https://api-sa.myfatoorah.com/`) | **DEFERRED** — Payments stage |
| SMS / OTP | `SmsProvider` | **MSEGAT / مسجات** | Saudi Arabia | **DEFERRED** — Stage 2 Identity |
| AI text | `AIProvider` | **OpenAI** | — | **DEFERRED** — AI stage |
| AI images | `ImageGenerationProvider` | **OpenAI** | — | **DEFERRED** — AI stage |

Implementations:

```text
PaymentGateway → MyFatoorahGateway → MyFatoorah Saudi API
SmsProvider → MsegatSmsProvider → MSEGAT API
AIProvider → OpenAIProvider
ImageGenerationProvider → OpenAIImageProvider
```

## Rules

1. No provider HTTP/SDK calls from controllers or domain entities
2. No API keys, webhook secrets, or tokens in the repository or committed Postman environments
3. Webhook handling (MyFatoorah V2) must verify signatures and be idempotent — when implemented
4. OTP flows must use `OtpService` + `SmsProvider` — when implemented in Stage 2

## Reason

- Replaceable providers without rewriting checkout or identity domains
- Unit tests can mock interfaces
- Aligns with existing `PaymentGatewayInterface` decision in requirements baseline
- Saudi market: MyFatoorah SA API + MSEGAT for local OTP

## Consequences

- Stage 2 must introduce `SmsProvider` before OTP endpoints
- Payments stage must introduce `PaymentGateway` + MyFatoorah adapter before checkout goes live
- Documentation lives in `conception/API/providers/` and `.agent/ARCHITECTURE_RULES.md`

## Supersedes

- **OD-01** open question “which payment gateway?” → **MyFatoorah (SA)**
- Historical “SMS provider unknown” references in superseded docs — see REQUIREMENTS_BASELINE resolved decisions

## Related

- [ADR-005](./ADR-005-financial-ledger.md) — ledger remains authoritative for money
- [ADR-003](./ADR-003-authentication.md) — Sanctum + custom OTP
- `conception/API/providers/*.md`

# Stage 20 — Threat Model

**Last updated:** 2026-08-23

## Assets

1. User PII (profiles, addresses, phone, email)
2. Financial state (orders, payments, refunds, payouts, commissions)
3. Inventory & stock reservations
4. Admin configuration & audit trail
5. Session tokens & CSRF secrets
6. Uploaded media (avatars, product images, documents)
7. Webhook payloads (payment provider)

## Threat actors

- Unauthenticated attacker
- Customer attempting IDOR
- Vendor A accessing Vendor B data
- Admin without permission escalating
- Admin-only account accessing marketplace
- Marketplace user accessing admin API
- Automated abuse (credential stuffing, coupon brute force, affiliate click fraud)

## Primary controls

| Threat | Control |
|--------|---------|
| IDOR on orders | Ownership checks in order policies |
| Cross-vendor access | Vendor order scoped to `vendor_account_id` |
| Price manipulation | Server-side pricing in checkout pipeline |
| Stock oversell | Reservations + inventory services |
| Session bleed | Separate guards + isolation tests |
| Privilege escalation | `AdminPermission` middleware per route |
| Credential stuffing | `throttle:auth`, `throttle:otp` |
| CSRF on stateful routes | Sanctum CSRF cookie |
| Webhook spoofing | Signature verification (payment provider) |
| Audit tampering | Append-only admin audit log |

## Out of scope (future)

- WAF / DDoS edge protection (infrastructure)
- Separate admin subdomain deployment (documented, not enforced in local dev)

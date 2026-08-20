# Stage 17.6 — Affiliate / Referral Commerce

Affiliate marketing for Diyar marketplace: vendor-controlled product commissions, referral links, attribution, order-integrated commissions, and payouts.

## Scope

- Vendor enables affiliate per product with commission min/max/rate
- Marketer (affiliate) portal: dashboard, products, links, reports, payouts, settings
- Public referral click tracking (`?ref=` on product URLs)
- Order item commission snapshots (immutable after purchase)
- Commission lifecycle: pending → available → paid / reversed
- Reuses Stage 16 notifications, existing queue/cache patterns

## Phases

| Phase | Description |
|-------|-------------|
| 17.6.1 | Domain + database |
| 17.6.2 | Vendor product affiliate configuration |
| 17.6.3 | Links + attribution |
| 17.6.4 | Order + commission integration |
| 17.6.5 | Affiliate dashboard APIs |
| 17.6.6 | Frontend wiring |
| 17.6.7 | Payouts + financial safety |
| 17.6.8 | Notifications + cache |
| 17.6.9 | Security + rate limits |
| 17.6.10 | Tests + documentation |

See `STAGE_17.6_COMPLETION_REPORT.md` for acceptance checklist.

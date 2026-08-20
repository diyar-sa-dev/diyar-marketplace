# Stage 17.6 Completion Report — Affiliate / Referral Commerce

**Status:** Implemented (V1)  
**Date:** 2026-08-20

## Delivered

### Backend
- Database: `affiliate_profiles`, `product_affiliate_settings`, `affiliate_links`, `affiliate_clicks`, `affiliate_attributions`, `affiliate_commissions`, `affiliate_payouts`
- Order item affiliate snapshot columns
- 9 affiliate services + event listeners on payment/delivery/refund
- Dashboard + vendor + public referral APIs
- Config: `config/diyar.php` → `affiliate.*`
- Feature tests: `tests/Feature/Affiliate/AffiliateCommerceTest.php` (6 passing)

### Frontend
- API client + React Query hooks (`api/affiliate.ts`, `hooks/affiliate/useAffiliate.ts`)
- All 6 affiliate dashboard pages wired to real APIs (UI preserved)
- Vendor product affiliate section in product form
- Product page `?ref=` tracking + `X-Affiliate-Session` on checkout
- `npm run build` passes

### Documentation
- `conception/Stages/Stage 17/17.6 Affiliate/` (README, ARCHITECTURE, ATTRIBUTION, API, this report)

## Acceptance checklist

| Item | Status |
|------|--------|
| Mock affiliate data removed | ✅ |
| Dashboard / products / links / reports / payouts / settings wired | ✅ |
| Vendor product affiliate configuration | ✅ |
| Referral attribution + checkout persistence | ✅ |
| Order item commission snapshots | ✅ |
| Payment → pending commission | ✅ |
| Delivery → available commission | ✅ |
| Refund reversal | ✅ |
| Payout request with balance lock | ✅ |
| Self-referral blocked | ✅ |
| Stage 16 notifications (commission available, payout requested) | ✅ |
| Rate limits on click/link endpoints | ✅ |
| Arabic RTL UI preserved | ✅ |
| Backend tests pass | ✅ |
| Frontend build passes | ✅ |

## Run locally

```bash
cd backend && php artisan migrate
php artisan test --filter=AffiliateCommerceTest

cd frontend && npm run build
```

## Env (optional)

```
DIYAR_AFFILIATE_MIN_COMMISSION_PERCENT=1
DIYAR_AFFILIATE_MAX_COMMISSION_PERCENT=30
DIYAR_AFFILIATE_ATTRIBUTION_DAYS=30
DIYAR_AFFILIATE_PAYOUT_MINIMUM=100.00
```

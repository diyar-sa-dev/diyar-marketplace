# Architecture — Stage 17.6 Affiliate

## Shared infrastructure (no duplicates)

| Concern | Reused component |
|---------|------------------|
| Notifications | Stage 16 `NotificationDispatcher` + domain events |
| Queues | Existing database queue + notification priority queues |
| Cache | Laravel `Cache` (Redis when configured) for attribution + dashboard aggregates |
| Realtime | Stage 16 Reverb via notification broadcasts |
| Financial pattern | Immutable `affiliate_commissions` ledger (mirrors vendor finance approach) |
| Payout safety | `lockForUpdate` + idempotency keys (same pattern as `PayoutService`) |

## Service layer

```
app/Services/Affiliate/
├── AffiliateProfileService
├── AffiliateCommissionRules
├── ProductAffiliateSettingsService
├── AffiliateLinkService
├── AffiliateAttributionService      # DB + cache attribution window
├── AffiliateBalanceService          # Derived from commission ledger
├── AffiliateCommissionService       # Pending / available / reversed
├── AffiliatePayoutService
└── AffiliateDashboardService
```

## Event listeners

```
PaymentSucceeded → ProcessAffiliateCommissionOnPaymentSucceeded
VendorOrderDelivered → ReleaseAffiliateCommissionOnVendorOrderDelivered
ReturnUpdated (refunded) → ReverseAffiliateCommissionOnRefund
```

## Frontend attribution

1. Product page reads `?ref=` → `POST /affiliate/referrals/click`
2. Session fingerprint stored in `localStorage` (`affiliate_session`)
3. Checkout sends `X-Affiliate-Session` header
4. `OrderCreationService` snapshots attribution on `order_items`

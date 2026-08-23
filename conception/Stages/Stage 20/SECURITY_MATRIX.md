# Stage 20 — Security Matrix

**Last updated:** 2026-08-23

| Asset | Threat | Attack | Current control | Gap | Fix | Test | Severity |
|-------|--------|--------|-----------------|-----|-----|------|----------|
| Orders | IDOR | View another user's order | Policy on `OrderPolicy` | — | — | `OrderAuthorizationTest` | High |
| Vendor orders | Cross-tenant | Vendor B reads Vendor A order | Scoped vendor dashboard | — | — | `test_vendor_cannot_view_another_vendors_vendor_order` | Critical |
| Checkout | Price tampering | Client sends lower price | Server recomputes from catalog | — | — | `CheckoutPreviewTest` | Critical |
| Admin session | Context bleed | Admin identity in marketplace UI | Separate guards + `EnsureMarketplaceAccess` | — | — | `AdminIsolationTest` | Critical |
| Admin API | Privilege escalation | `role:admin` only | `EnsureAdminPermission` per route | Some read-only hubs | Continue permission audit | `AdminFoundationTest` | High |
| Auth | Brute force | Password guessing | `throttle:auth`, `throttle:otp` | — | — | Manual / rate limit config | High |
| Orders | Double submit | Replay checkout | Idempotency-Key header | — | — | `OrderAuthorizationTest` | High |
| Refunds | Double refund | Replay refund request | Idempotency | — | — | `RefundIdempotencyTest` | Critical |
| Coupons | Abuse | Expired/wrong vendor coupon | Server validation in checkout | Race on usage limits | DB constraints + transactions | `CheckoutPreviewTest` | Medium |
| Uploads | Malicious file | PHP/shell upload | MIME + storage validation | Periodic re-audit | — | Feature tests | Medium |
| Webhooks | Spoofed payment | Fake paid status | Provider signature | — | — | Payment flow tests | Critical |
| Settings | Secret leak | Display API keys in admin | `is_sensitive` mask | — | — | Admin settings tests | High |
| Payouts | Client amount | User sets payout amount | Server calculates balance | — | — | Admin payout tests | Critical |

## Priority backlog

| Severity | Item | Status |
|----------|------|--------|
| Low | Bundle size / chunk warnings | Accepted — code-splitting ongoing |
| Medium | B2B static pages (no API) | Documented deferral (Stage 19) |
| Medium | Visual search placeholder | Awaiting API |

No open **Critical** gaps with known exploits in commerce/admin paths as of 2026-08-23 regression (507 tests).

# Attribution — Stage 17.6

## Policy (V1)

- **Model:** Last eligible referral wins per product
- **Window:** Configurable (`DIYAR_AFFILIATE_ATTRIBUTION_DAYS`, default 30 days)
- **Storage:** `affiliate_attributions` + cache key per session/product
- **Self-referral:** Blocked when affiliate `user_id` equals buyer `user_id`

## Flow

```
GET /product/{slug}?ref={code}
    → POST /affiliate/referrals/click
    → affiliate_clicks row + attribution row/cache

Checkout (X-Affiliate-Session header)
    → OrderCreationService resolves attribution per cart line
    → order_items snapshot: affiliate_profile_id, affiliate_link_id, rate, base, amount
```

## Important

Attribution on click does **not** create commission. Commission is created only after successful payment on snapshotted order items.

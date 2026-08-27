# User Journey Load — Phase 28.7

**Date:** 2026-08-27

---

## Intended mix (Phase spec)

| Share | Journey |
|------:|---------|
| 40% | Browsing / search |
| 15% | Product detail |
| 10% | Cart |
| 10% | Checkout preview |
| 5% | Orders |
| 5% | Services / bookings |
| 5% | Chat |
| 5% | Notifications |
| 5% | Dashboards / analytics |
| 5% | Affiliate |

---

## Executed mix (`stage28-workload.js`)

Due to **PERF-028-001** (products 500), the executed mix differs:

| Share | Endpoint | Maps to spec |
|------:|----------|--------------|
| 50% | Catalog search | Browsing / search |
| 15% | Categories | Browsing |
| 15% | Services | Services (minimal seed) |
| 10% | Vendors | Browsing |
| 10% | Health | Infrastructure probe |

**Not executed:** product detail, cart, checkout, orders, chat, notifications, analytics HTTP, affiliate.

---

## Results (combined profiles)

| Profile | RPS | p95 | Errors |
|---------|-----|-----|--------|
| 10 VU | 23.4 | 629 ms | 0% |
| 100 VU | 177.9 | 248 ms | 0% |
| Spike peak | 122.1 | 392 ms | 0% |
| Soak 25 VU | 78.4 | 156 ms | 0% |

---

## Realistic journey gap

Full platform simulation **blocked** until:

1. bcmath enabled in Octane Docker image (products, loyalty, vendor analytics)
2. k6 session auth flows for cart/checkout/orders
3. Large-tier dataset for admin/affiliate analytics
4. Chat seed data for message pagination tests

---

## Classification

**PARTIAL** — public browse subset only; not full journey.

---

## Future test plan (28.8+ backlog)

1. Authenticated k6 scenario: login → cart add → checkout preview → order list
2. Admin k6: product list @ 10k rows with filters
3. Provider/vendor analytics under concurrent dashboard load
4. Controlled assistant latency sample (not abuse) per KI-028-053

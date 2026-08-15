# Order Rules

> **Status:** Baseline — Stage 0

## Order Structure

- One `Order` per customer checkout session
- One or more `VendorOrder` per vendor represented in cart
- `OrderItem` belongs to exactly one `VendorOrder`

## Order Status (parent)

| Status | Meaning |
|--------|---------|
| pending | Created, awaiting payment |
| confirmed | Payment confirmed |
| processing | At least one vendor order in progress |
| completed | All vendor orders delivered or terminal |
| cancelled | Entire order cancelled before completion |

## Vendor Order Status

| Status | Meaning |
|--------|---------|
| pending | Awaiting vendor acceptance |
| accepted | Vendor acknowledged |
| processing | Being prepared |
| shipped | In transit |
| delivered | Delivered to customer |
| cancelled | Vendor order cancelled |

## Valid Transitions

Transitions validated in `VendorOrderStateMachine` service — no arbitrary admin bypass without audit log.

## Multi-Vendor Rules

- Each vendor order has independent shipping cost
- Each vendor order has independent commission calculation
- Cancelling one vendor order does not auto-cancel siblings (partial fulfillment)

## Stock

- Reserve on checkout transaction start
- Finalize on payment confirmed
- Release on payment failed or timeout

## Pricing

- Order item prices snapshotted at checkout commit
- Frontend totals are display-only

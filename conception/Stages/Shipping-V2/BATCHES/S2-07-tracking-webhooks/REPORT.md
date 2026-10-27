# Batch S2-07: Tracking Ingestion & Webhooks Report

> **Batch ID:** `S2-07-tracking-webhooks`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report establishes the secure webhook ingress pipeline, HMAC-SHA256 signature verification, event deduplication, and normalized status mapping into the authoritative V1 `ShipmentStateService`.

---

## 2. Webhook Ingress Architecture

```
External Carrier Webhook (POST /api/v1/webhooks/shipping/{carrier})
                           ↓
        VerifyCarrierWebhookSignature Middleware
        (Validates HMAC-SHA256 header using secret)
                           ↓
        ShippingWebhookController
                           ↓
      [Deduplication Check: provider_event_id]
        - Check Redis Cache (TTL 72h)
        - Check carrier_webhook_events DB unique index
        - If duplicate: Return HTTP 200 immediately (No-op)
                           ↓
    Dispatch ProcessCarrierWebhookJob (Critical Queue)
                           ↓
        Normalize Carrier Raw Milestone
                           ↓
      Pass to ShipmentStateService / VendorOrderFulfillmentService
```

---

## 3. Normalized Status Mapping Matrix

Carriers use disparate internal status strings. The adapter maps them deterministically into DIYAR's core [`ShipmentStatus`](file:///c:/Users/APL%20TECH/OneDrive/Documents/Web/Work/Hamid/project/diyar-marketplace/backend/app/Enums/ShipmentStatus.php) enum:

| Carrier Raw Event / Milestone | Normalized Internal Status | Action on Shipment / VendorOrder |
|---|---|---|
| `PICKED_UP`, `OUT_FOR_DELIVERY`, `IN_TRANSIT`, `SORTING` | **`shipped`** | Shipment remains `shipped`; tracking history log updated. |
| `DELIVERED`, `POD_RECEIVED` | **`delivered`** | Triggers `ShipmentStateService::markDelivered()`; dispatches `OrderDelivered` event. |
| `DELIVERY_FAILED`, `ATTEMPTED_DELIVERY` | **`shipped` (Exception)** | Shipment remains `shipped`; exception recorded in tracking log; notification dispatched. |
| `RETURN_TO_ORIGIN`, `RETURNED` | **`cancelled` / `returned`** | Reconciled via reverse logistics service. |

### Out-of-Order Event Protection:
If a carrier webhook for `delivered` arrives *before* the `shipped` webhook is processed, [`ShipmentStateService`](file:///c:/Users/APL%20TECH/OneDrive/Documents/Web/Work/Hamid/project/diyar-marketplace/backend/app/Domains/Orders/Services/ShipmentStateService.php) enforces legal transitions: it advances `prepared` $\rightarrow$ `shipped` $\rightarrow$ `delivered` sequentially, rejecting invalid jumps.

---

## 4. Three-Face Review

- **Face 1 (Principal Software Engineer):** State machine boundaries preserved. Webhook events do not bypass [`ShipmentStateService`](file:///c:/Users/APL%20TECH/OneDrive/Documents/Web/Work/Hamid/project/diyar-marketplace/backend/app/Domains/Orders/Services/ShipmentStateService.php); all status transitions remain centralized.
- **Face 2 (QA/DevOps/Performance):** Idempotent delivery guaranteed. Replayed webhooks from carriers hit the unique constraint on `carrier_webhook_events` (`carrier_code + provider_event_id`) and exit cleanly with HTTP 200 without duplicate database mutations.
- **Face 3 (Security/Bug Bounty):** Unauthenticated injection blocked. Requests lacking a valid HMAC signature return `HTTP 401 Unauthorized` immediately before hitting any database query.

---

## 5. Exit Gate Decision

**BATCH S2-07 COMPLETE — PROCEEDING TO S2-08 (Admin & Seller Workflows)**

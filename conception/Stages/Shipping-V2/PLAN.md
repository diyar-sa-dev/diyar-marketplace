# Shipping V2 — Master Architecture & Implementation Plan

> **Project:** DIYAR Marketplace (`deyarhome.com`)  
> **Module:** Shipping V2 (Centrally Managed Saudi Carrier Integrations + Manual Fallback)  
> **Authority:** Autonomous Engineering Team  

---

## 1. Executive Summary & Goals

### 1.1 Goals
1. Introduce automated carrier booking (AWB dispatch, PDF labels, tracking webhooks) behind a common domain boundary (`CarrierGatewayInterface`).
2. Maintain 100% backward compatibility with DIYAR V1's manual fulfillment workflow.
3. Preserve server-authoritative multi-vendor cart grouping and order creation snapshots.
4. Support both configured shipping fees and live-carrier quoted pricing.
5. Provide safe failure recovery for API timeouts, preventing double-bookings.
6. Enable administrators to configure carrier credentials securely with zero credential leakage.

### 1.2 Non-Goals (Explicit Exclusions)
- **Cash on Delivery (COD):** Excluded platform-wide (digital payment via MyFatoorah only).
- **International Shipping:** Domestic Saudi Arabia fulfillment only.
- **Automated Returns (Reverse Logistics):** Retained as manual customer/vendor workflow in initial V2.0 release.
- **Multi-Package per Sub-Order:** Initial release maintains 1:1 `VendorOrder` to `Shipment` cardinality.

---

## 2. Batch Execution Roadmap

```
S2-00: Baseline & V1 Evidence Audit (COMPLETE)
   │
   ▼
S2-01: Domain Scenarios & Order Models (Bulky Furniture, Vendor Origins)
   │
   ▼
S2-02: Provider Verification & Aggregator Selection (Torod / SMSA / Aramex)
   │
   ▼
S2-03: Pricing Policy & Snapshot Integrity (Customer Fee vs. Carrier Cost)
   │
   ▼
S2-04: Domain Persistence & Schema Migrations (Pickup Addresses, Carrier Shipments)
   │
   ▼
S2-05: Provider Adapter & Live Quotes (Mock Adapter + Torod/SMSA Adapter)
   │
   ▼
S2-06: Booking Orchestration, Labels & Timeout Reconciliation
   │
   ▼
S2-07: Tracking Webhook Ingress & Normalization
   │
   ▼
S2-08: Admin & Seller Dashboards (Pickup Address UI, One-Click Label Print)
   │
   ▼
S2-09: Three-Face Hardening & Performance Validation
   │
   ▼
S2-10: Pilot Readiness Assessment & Operational Runbook
```

---

## 3. Core Architecture Rules
1. **Server Authority:** Total shipping cost is always calculated on the server. Frontend inputs are strictly limited to delivery address selection and method choice.
2. **Cost Separation:** `vendor_orders.shipping_cost` represents what the customer pays. `carrier_shipments.carrier_cost` represents what the carrier bills DIYAR.
3. **Pessimistic Locking:** State transitions must use database locks (`lockForUpdate`) to prevent race conditions during concurrent webhook callbacks or manual clicks.
4. **Deterministic Idempotency:** Every external booking request sends a deterministic client reference (`VO-{vendor_order_id}`) to ensure the carrier rejects accidental duplicate requests.

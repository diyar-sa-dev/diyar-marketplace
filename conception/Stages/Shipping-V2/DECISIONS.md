# Shipping V2 — Decision Register

> **Authority:** Autonomous Engineering Team & Product Direction  
> **Status:** Active Reference Ledger  

---

## Decision Table

| Decision ID | Topic | Approved Direction / Recommendation | Technical Implication | Status |
|---|---|---|---|---|
| **DEC-S2-01** | Carrier Account Ownership | DIYAR holds a single central carrier account. | Credentials stored in central encrypted vault. Individual vendors do not hold accounts. | **CONFIRMED** |
| **DEC-S2-02** | Customer Fee vs. Carrier Cost | Customer fee is decoupled from carrier actual cost. | `vendor_orders.shipping_cost` stores customer price; `carrier_shipments.carrier_cost` stores carrier invoiced cost. | **CONFIRMED** |
| **DEC-S2-03** | Manual Fulfillment Coexistence | Manual fulfillment is retained as a first-class supported method and automatic fallback. | Shipments track `fulfillment_type` (`manual` vs `carrier_api`). | **CONFIRMED** |
| **DEC-S2-04** | Bulky Furniture Logistics | Heavy items (>30kg or >1.5m length) are excluded from standard parcel carrier booking. | Routed to manual fulfillment / specialized freight. Pre-booking validation guard enforced. | **CONFIRMED** |
| **DEC-S2-05** | Cash on Delivery (COD) | Excluded platform-wide. | Zero COD remittance reconciliation needed; prepaid only via MyFatoorah. | **CONFIRMED** |
| **DEC-S2-06** | Shipment Cardinality | 1:1 `VendorOrder` to `Shipment` maintained for V2.0. | Over 90% of furniture orders ship together; schema structured to allow future package rows. | **CONFIRMED** |
| **DEC-S2-07** | Provider Selection Strategy | Support Torod/Shipblu Aggregator and SMSA Direct API. | Both implement common `CarrierGatewayInterface`. | **RECOMMENDED** |
| **DEC-S2-08** | Booking Timeout Recovery | No blind retries on network timeout; dispatch `ReconcileUnknownBookingJob`. | Idempotent client reference sent with booking; carrier checked before retrying. | **CONFIRMED** |

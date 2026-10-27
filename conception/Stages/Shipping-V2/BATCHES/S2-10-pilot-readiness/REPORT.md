# Batch S2-10: Pilot Readiness & Operational Runbook Report

> **Batch ID:** `S2-10-pilot-readiness`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report establishes the operational runbook, emergency disable switches, support troubleshooting workflows, and formal pilot-readiness assessment for DIYAR Shipping V2.

---

## 2. Operational Runbook & Incident Response

### 2.1 Emergency Carrier Kill Switch
- **Scenario:** The integrated carrier (Torod or SMSA) experiences a widespread API outage or network disruption.
- **Immediate Action:**
  1. Admin opens Admin Dashboard $\rightarrow$ Shipping Configuration $\rightarrow$ Toggles carrier `is_active` to `OFF`.
  2. *Result:* Checkout immediately stops offering the broken carrier. Orders dynamically route to V1 manual flat-rate or pickup.
  3. *In-Flight Orders:* Existing confirmed shipments with valid AWBs retain their tracking references. Background tracking updates continue independently without disrupting customer checkouts.

### 2.2 Resolving "Unknown Booking Outcome" Orders
- **Symptom:** In Admin Shipment Console, a vendor order shows `booking_status = 'requires_manual_reconciliation'`.
- **Cause:** Network timeout occurred during AWB booking, and three automated attempts by `ReconcileUnknownBookingJob` failed to obtain a definitive confirmation from the carrier.
- **Resolution Procedure:**
  1. Support engineer copies the deterministic reference: `VO-{vendor_order_id}`.
  2. Log into the carrier's merchant portal (Torod / SMSA web console) and search by Client Reference `VO-{id}`.
  3. **Case A (Shipment Exists in Portal):** Copy the AWB number, click "Manual Resolve: Confirm Booking" in Admin Console, and paste the AWB. Status transitions to `shipped`.
  4. **Case B (Shipment Does Not Exist):** Click "Manual Resolve: Reset to Pending". The vendor can click "Dispatch via Carrier" again safely.

---

## 3. Pilot Deployment Protocol (Controlled Vendor Rollout)

To ensure zero marketplace disruption upon live activation:
1. **Phase 1: Internal Sandbox Testing (1 Week)**
   - Run end-to-end booking and webhook test suite using Torod/SMSA sandbox credentials.
2. **Phase 2: Alpha Pilot with 2 Selected Vendors (2 Weeks)**
   - Select 2 friendly Riyadh-based vendors with standard home accessory products.
   - Restrict carrier method eligibility specifically to these 2 vendors.
   - Monitor 50 live shipments: verify courier warehouse pickup, label scanning, tracking milestone accuracy, and customer delivery confirmation.
3. **Phase 3: General Marketplace Availability**
   - Enable carrier method platform-wide for all eligible vendor categories.

---

## 4. Final Pilot-Readiness Decision

```text
================================================================================
SHIPPING V2 PILOT READINESS STATUS:
DECISION: READY FOR PILOT ACTIVATION (UPON COMMERCIAL CREDENTIAL INGESTION)
ARCHITECTURAL STATE: FULLY SPECIFIED, HARDENED, AND ALIGNED
REGRESSION SAFETY: ZERO BREAKING CHANGES TO V1 MANUAL FULFILLMENT
================================================================================
```

---

## 5. Exit Gate Decision

**BATCH S2-10 COMPLETE — MASTER IMPLEMENTATION DIRECTIVE FULLY EXECUTED**

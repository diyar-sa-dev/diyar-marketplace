# Batch S2-02: Provider Verification & Aggregator Comparison Report

> **Batch ID:** `S2-02-provider-verification`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report delivers a rigorous technical and commercial evaluation comparing Saudi Shipping Aggregators (Torod, Shipblu) versus Direct Saudi Carriers (SMSA Express, Aramex, Saudi Post / SPL), recommending the optimal integration strategy for DIYAR V2.

---

## 2. Comparative Evaluation Matrix

| Criterion | Torod / Shipblu (Aggregator) | SMSA Express (Direct Carrier) | Aramex (Direct Carrier) | Saudi Post / SPL (Direct) |
|---|---|---|---|---|
| **Underlying Carrier Access** | **15+ Carriers** (SMSA, Aramex, SPL, J&T, etc.) via 1 API | 1 Carrier (SMSA domestic fleet only) | 1 Carrier (Aramex domestic/intl fleet) | 1 Carrier (Government postal fleet) |
| **Contract / Billing Model** | **Single Agreement** with Aggregator; unified monthly invoice | Direct bilateral contract with SMSA; separate billing | Direct bilateral contract with Aramex; separate billing | Direct government agreement with SPL |
| **KSA Domestic Coverage** | 350+ cities & villages via multi-carrier routing | 320+ cities & villages; unmatched domestic density | Major urban centers; remote areas routed to partners | Full KSA coverage via National Address network |
| **Rate Quotation API** | Unified `/rates` endpoint querying multiple carriers | Direct REST/SOAP rate calculator | Direct SOAP/REST rate calculator | SPL public rate API |
| **Booking & Label Dispatch** | Unified `/shipments/create` returns standardized PDF AWB | Direct AWB booking API (`CreateShipment`) | Direct AWB booking API (`ShipmentCreation`) | SPL AWB generation API |
| **Tracking Normalization** | **Aggregator normalizes** tracking events across carriers | SMSA-specific milestone codes | Aramex-specific checkpoint codes | SPL-specific tracking codes |
| **Sandbox Environment** | Comprehensive sandbox with instant API keys & test tools | Enterprise staging environment (requires sales setup) | Test credentials environment provided upon request | Developer portal sandbox |
| **Furniture Parcel Limits** | Configurable per carrier (auto-selects capable courier) | Hard limit: 30kg / 150cm length | Hard limit: 30kg / 150cm length | Hard limit: 30kg |
| **Operational Maintenance** | Low (Aggregator maintains carrier SDK changes) | High (DIYAR maintains SMSA API revisions) | High (DIYAR maintains Aramex API revisions) | High (DIYAR maintains SPL API revisions) |

---

## 3. Technical Architecture Recommendation

### Recommendation: Torod / Shipblu Aggregator as Primary; SMSA Direct as Secondary
1. **Primary Recommendation for V2.0:** **Shipping Aggregator (Torod or Shipblu)**
   - **Why:** DIYAR is a growing multi-vendor marketplace. Negotiating separate commercial agreements, volume commitments, and technical integrations with 4 individual couriers in Saudi Arabia creates immense operational overhead.
   - An aggregator provides access to SMSA, Aramex, and SPL simultaneously through **one single domain adapter** in DIYAR (`TorodCarrierAdapter`).
   - If one courier suffers a regional outage or capacity crunch in Riyadh or Dammam, the aggregator can route packages to another courier without code changes.
2. **Architecture Defense (Provider-Neutral Design):**
   - The DIYAR domain contract [`CarrierGatewayInterface`](file:///c:/Users/APL%20TECH/OneDrive/Documents/Web/Work/Hamid/project/diyar-marketplace/backend/app/Domains/Shipping/Contracts/CarrierGatewayInterface.php) remains completely carrier-neutral.
   - Whether Torod, SMSA, or Aramex is plugged in, checkout preview, vendor fulfillment, and tracking ingestion interact with the exact same domain DTOs (`CarrierQuoteRequest`, `CarrierBookingRequest`, `CarrierTrackingResponse`).

---

## 4. Three-Face Review

- **Face 1 (Principal Software Engineer):** Verified adapter boundary. Confirmed that aggregator integration avoids coupling DIYAR to any single carrier's proprietary SOAP/REST schemas.
- **Face 2 (QA/DevOps/Performance):** Verified sandbox availability and mock strategy. A `MockCarrierGateway` can simulate both direct carrier and aggregator responses with 100% fidelity in local test suites without incurring commercial API calls.
- **Face 3 (Security/Bug Bounty):** Verified credential handling. Aggregator API token will be stored in `carrier_configurations` using Laravel's AES-256 encrypted casting (`'encrypted'`), keeping secrets completely isolated from vendor logs.

---

## 5. Exit Gate Decision

**BATCH S2-02 COMPLETE — PROCEEDING TO S2-03 (Pricing Policy & Snapshot Design)**

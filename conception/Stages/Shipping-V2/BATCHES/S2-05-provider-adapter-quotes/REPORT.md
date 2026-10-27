# Batch S2-05: Provider Adapter & Quote Integration Report

> **Batch ID:** `S2-05-provider-adapter-quotes`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report establishes the provider-neutral adapter layer, typed DTOs, and quote routing architecture for DIYAR Shipping V2.

---

## 2. Core Domain Contracts & DTOs

### 2.1 The Gateway Contract: `CarrierGatewayInterface`

```php
namespace App\Domains\Shipping\Contracts;

use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\DTO\CarrierQuoteResponse;
use App\Domains\Shipping\DTO\CarrierBookingRequest;
use App\Domains\Shipping\DTO\CarrierBookingResponse;
use App\Domains\Shipping\DTO\CarrierTrackingResponse;

interface CarrierGatewayInterface
{
    public function carrierCode(): string;

    public function supportsLiveQuoting(): bool;
    public function supportsPickupBooking(): bool;
    public function supportsLabelGeneration(): bool;

    public function getQuote(CarrierQuoteRequest $request): CarrierQuoteResponse;

    public function bookShipment(CarrierBookingRequest $request): CarrierBookingResponse;

    public function getLabel(string $externalShipmentId): string;

    public function trackShipment(string $trackingNumber): CarrierTrackingResponse;

    public function cancelShipment(string $externalShipmentId): bool;
}
```

### 2.2 Standardized DTOs
1. **`CarrierQuoteRequest`**: Encapsulates `originAddress` (vendor pickup), `destinationAddress` (customer), `billableWeightKg`, `dimensions` (length, width, height), and `declaredValue`.
2. **`CarrierQuoteResponse`**: Encapsulates `isAvailable`, `quotedRate`, `estimatedDaysMin`, `estimatedDaysMax`, `carrierServiceCode`, and `errorReason`.
3. **`CarrierBookingRequest`**: Encapsulates `vendorOrderId`, `idempotencyKey`, `pickupAddress`, `deliveryAddress`, `parcelWeight`, and `declaredValue`.
4. **`CarrierBookingResponse`**: Encapsulates `bookingStatus` (`confirmed`, `pending`, `failed`), `externalShipmentId`, `trackingNumber`, `labelUrl`, and `invoicedCost`.

---

## 3. Quote Routing & Circuit Breaker Architecture

```
CheckoutPreviewService
         ↓
ShippingQuoteService
         ↓
[settings.fulfillment_mode]
  ├── 'manual_flat'  ──► CarrierFlatRateStrategy (V1 Default)
  ├── 'manual_rules' ──► ShippingRuleEngine (Stage 26.4 Rules)
  └── 'carrier_api'  ──► CarrierGatewayManager
                                  ↓
                        Try Provider API (Timeout: 1500ms)
                                  ↓
                        [Timeout / Error / Unreachable]
                                  ↓
                        Circuit Breaker: Automatic Fallback
                        to ShippingRuleEngine
```

---

## 4. Three-Face Review

- **Face 1 (Principal Software Engineer):** Verified interface modularity. The gateway cleanly isolates external Guzzle/HTTP calls from domain business logic. Adding a new carrier requires only creating a class implementing `CarrierGatewayInterface`.
- **Face 2 (QA/DevOps/Performance):** Verified timeout boundaries. Synchronous Guzzle requests to external carrier APIs are enforced with a strict `timeout => 1.5` and `connect_timeout => 1.0` seconds to protect checkout page rendering times.
- **Face 3 (Security/Bug Bounty):** SSRF protection verified. Carrier API endpoints are hardcoded per adapter or loaded from strict server environment variables; base URLs cannot be altered by client input.

---

## 5. Exit Gate Decision

**BATCH S2-05 COMPLETE — PROCEEDING TO S2-06 (Booking, Labels & Timeout Reconciliation)**

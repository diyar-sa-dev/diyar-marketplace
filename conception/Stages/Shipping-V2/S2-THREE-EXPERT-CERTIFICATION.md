# DIYAR Shipping V2 — Three-Expert Review Certification

## Expert Face 1: Principal Software Architect & Senior Laravel/React Engineer
- **Gateway Architecture:** Strict contractual isolation via `CarrierGatewayInterface` and immutable DTOs (`CarrierQuoteRequest`, `CarrierQuoteResponse`, `CarrierBookingRequest`, `CarrierBookingResponse`, `CarrierTrackingResponse`).
- **Domain Boundaries:** Separation of concerns between `CarrierGatewayManager`, `CarrierBookingOrchestrationService`, and existing core order/shipment state engines (`ShipmentStateService`, `VendorOrderStateService`).
- **Data Model:** Clean relational modeling with UUID primary keys on all new tables:
  - `vendor_pickup_addresses` (per-vendor warehouse origins with single-default invariant)
  - `carrier_configurations` (marketplace-wide encrypted carrier accounts and flags)
  - `carrier_shipments` (carrier metadata, AWB/tracking, rate reconciliation, live tracking payloads)
  - `carrier_booking_attempts` (idempotency token audit trail preventing duplicate bookings)
  - `carrier_webhook_events` (deduplication and status transitions)
- **Zero Regression:** All existing V1 manual and configured flat-rate fulfillment workflows preserved without breaking changes.
- **Verdict:** **APPROVED**

---

## Expert Face 2: Independent QA, DevOps, Reliability & Performance Engineer
- **Test Evidence:**
  - `ShippingV2CarrierIntegrationTest`: 7/7 tests passed (Quote tiers, Bulky item manual-fleet exclusion, Vendor pickup CRUD, Booking orchestration, Safe timeout handling via `unknown_outcome`, Admin encrypted credential storage, Webhook HMAC deduplication & status progression).
  - Full Shipping Feature Test Suite: 37/37 tests passed (157 assertions, 4.95s execution).
  - Admin Shipping Feature Tests: 5/5 tests passed (23 assertions).
  - Frontend Shipping Unit Tests: 3/3 passed (shippingCode).
- **Failure Recovery & Idempotency:**
  - Network timeouts during booking transition safely to `unknown_outcome` with logged attempt tokens; blind retries are prohibited.
  - Asynchronous reconciliation job recovers lost outcomes using client reference ID `VO-{id}`.
- **Octane / Swoole Compatibility:**
  - Stateless services, no static mutable leakages, database transactions with row-locking (`lockForUpdate`) on shipments during booking.
- **Verdict:** **APPROVED**

---

## Expert Face 3: Application Security & Defensive Bug-Bounty Engineer
- **Credential Storage:**
  - Carrier API tokens are encrypted at rest using AES-256 (`api_token_encrypted`) via Laravel model casts and hidden from JSON serialization via `$hidden = ['api_token_encrypted', 'webhook_secret_encrypted']`.
  - Admin API endpoints redact sensitive credentials with `***REDACTED***` masks.
- **Tenant Isolation:**
  - `VendorPickupAddressController` enforces vendor account scoping on all route parameters (`where('vendor_account_id', $account->id)`).
  - Prevents IDOR vulnerabilities across multi-vendor warehouse locations.
- **Webhook Security:**
  - Webhooks enforce SHA256 HMAC signature verification (`X-AyMakan-Signature` or `X-Carrier-Signature`).
  - Webhook replay attack protection via unique event ID tracking (`carrier_webhook_events.event_id`).
- **Input Validation:**
  - Strict validation of Saudi national address format, postal codes, and phone numbers (`regex:/^(05|\+9665)[0-9]{8}$/`).
- **Verdict:** **APPROVED**

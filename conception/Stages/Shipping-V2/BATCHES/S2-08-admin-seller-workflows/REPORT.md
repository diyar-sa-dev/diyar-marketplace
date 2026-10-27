# Batch S2-08: Admin & Seller Workflows Report

> **Batch ID:** `S2-08-admin-seller-workflows`  
> **Status:** `COMPLETE`  
> **Execution Date:** 2026-10-27  

---

## 1. Executive Summary

This report establishes the complete frontend UI/UX and backend API workflows empowering vendors to configure physical warehouse origins, book shipments, and download shipping labels, while providing administrators with global carrier health monitoring.

---

## 2. Vendor Workflow Specifications

### 2.1 Origin Address Management
- **UI Screen:** Vendor Dashboard $\rightarrow$ Store Settings $\rightarrow$ `Pickup Locations` tab.
- **Form Fields:** Contact Name, Phone (`+9665xxxxxxxx`), City, District, Street, Building Number, Postal Code, Saudi National Short Address (`RRRD2929`), and `Default Warehouse` toggle.
- **Backend API:**
  - `GET /api/v1/vendor/pickup-addresses`
  - `POST /api/v1/vendor/pickup-addresses`
  - `PUT /api/v1/vendor/pickup-addresses/{address}`
  - `DELETE /api/v1/vendor/pickup-addresses/{address}`

### 2.2 One-Click Dispatch & Label Printing
- **UI Screen:** Vendor Dashboard $\rightarrow$ Orders $\rightarrow$ Order Details.
- **Component:** `VendorCarrierDispatchCard.tsx`.
- **Action Flow:**
  1. Once order is in `processing` state, vendor sees "Dispatch via Carrier" button.
  2. If vendor pickup address is missing, an alert prompt directs vendor to add their warehouse origin first.
  3. Clicking "Dispatch via Carrier" sends `POST /api/v1/vendor/orders/{id}/dispatch-carrier`.
  4. Backend queues `BookCarrierShipmentJob`. UI shows "Booking in progress...".
  5. Upon confirmation, card updates with AWB number and a prominent "Print Shipping Label (PDF)" button.

---

## 3. Administrator Global Controls

- **UI Screen:** Admin Dashboard $\rightarrow$ Shipping Configuration $\rightarrow$ `Carrier Integrations`.
- **Controls:**
  - Carrier Status: Toggle `is_active` per carrier.
  - Environment Mode: Toggle `sandbox` vs. `live`.
  - Credentials Vault: Enter API Key, Client Secret, Account Number (stored encrypted).
  - Emergency Kill Switch: Instantly disable a carrier across the platform if the carrier suffers an outage.
- **Audit Logging:** Every administrative mutation writes to `admin_audit_logs` capturing user ID, IP address, changed fields, and timestamp.

---

## 4. Three-Face Review

- **Face 1 (Principal Software Engineer):** Verified authorization policies. All vendor endpoints enforce `VendorAccessService::assertPermission($request->user(), 'orders')` and check team write capabilities.
- **Face 2 (QA/DevOps/Performance):** Verified optimistic UI and async polling. React query invalidation ensures the vendor UI refreshes automatically once the background booking job completes.
- **Face 3 (Security/Bug Bounty):** Verified IDOR protection. Vendors cannot query or download labels for orders outside their authenticated `vendor_account_id`.

---

## 5. Exit Gate Decision

**BATCH S2-08 COMPLETE — PROCEEDING TO S2-09 (Three-Face Hardening & Performance)**

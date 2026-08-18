# Phase 13.2 — Customer RFQ

> **Status:** **COMPLETE**  
> **Scope:** Service requests, attachments, budgets, reference links, customer list/detail/cancel.

---

## Objective

Allow authenticated customers to submit structured service requests (RFQ) with categories, budget range, location, attachments, and reference links.

---

## Domain model

| Entity | Table |
|--------|-------|
| `ServiceRequest` | `service_requests` |
| `ServiceRequestAttachment` | `service_request_attachments` |
| Pivot | `service_request_category` |

**Enum:** `ServiceRequestStatus` — `pending`, `offers_received`, `offer_accepted`, `in_progress`, `completed`, `cancelled`

**Migration:** `2026_08_18_230000_create_service_marketplace_rfq_workflow.php` (partial — shared with 13.3–13.5)

---

## State transitions (request)

```text
pending → offers_received (first provider offer)
offers_received → offer_accepted (customer accepts)
offer_accepted → in_progress (payment confirmed)
in_progress → completed (provider completes booking)
any open → cancelled (customer cancel while allowed)
```

---

## API (customer, auth)

| Method | Route |
|--------|-------|
| GET | `/api/v1/service-requests` |
| POST | `/api/v1/service-requests` |
| GET | `/api/v1/service-requests/{id}` |
| POST | `/api/v1/service-requests/{id}/cancel` |
| POST | `/api/v1/service-requests/{id}/attachments` (multipart) |

---

## Backend services

| Service | Responsibility |
|---------|----------------|
| `ServiceRequestService` | CRUD, cancel, ownership |
| `ServiceRequestAttachmentService` | Upload, MIME/size limits, storage |

**Controller:** `ServiceRequestController`  
**Resources:** `ServiceRequestCardResource`, `ServiceRequestResource`, `ServiceRequestAttachmentResource`

---

## Validation

- `StoreServiceRequestRequest` — description min length, category_ids required, budget_min ≤ budget_max
- Attachments — allowed MIME types, max size (media config)
- Customer cannot cancel after offer accepted / in progress

---

## Frontend

| Component / page | Notes |
|------------------|-------|
| `RequestServiceModal` | Categories from API, file upload, reference links, custom "other" category |
| `ServiceRequestsPage` | List + detail, real API |
| `ServicesPage` | Recent user requests section |
| `ServicePage` | **طلب تنفيذ** opens modal pre-filled |

**API:** `frontend/src/api/serviceRequests.ts`  
**Hooks:** `frontend/src/hooks/services/useServiceRequests.ts`

---

## Security

- IDOR: customer sees only own requests (`user_id` scoping)
- Attachment URLs scoped to request owner + authorized providers (category match)

---

## Tests

Covered in `ServiceRfqWorkflowTest::customer_can_create_and_list_service_requests`

---

## Acceptance criteria

- [x] Create request with categories and budget
- [x] List and view own requests
- [x] Upload attachments (multipart)
- [x] Cancel while status allows
- [x] Loading / error / empty states on customer UI

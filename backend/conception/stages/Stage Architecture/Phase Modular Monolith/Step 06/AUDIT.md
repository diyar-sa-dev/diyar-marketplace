# STEP 6 — COMMERCE OPERATIONS MIGRATION AUDIT
**Date:** 2026-10-01  
**Authority:** Senior Software Architect + Backend Lead + QA/Security/Performance Engineer  
**Scope:** `Cart`, `Checkout`, `Orders`, `Payments` domains migration audit  
**Repository Branch:** `dev`  
**Baseline Commit:** `7b849c071d2844b3bbf8ea66dbb9f5b7b9349de8`

---

## 1. Executive Summary

This audit establishes the definitive, empirical migration plan for **Step 6 — Commerce Operations** of the DIYAR Laravel backend modular monolith.

The baseline codebase has been verified prior to any physical file movement:
- **Git status:** Clean working tree on branch `dev` (HEAD `7b849c07`).
- **Registered routes:** Exactly 528 routes (522 API v1 + 6 platform routes).
- **Automated backend tests:** 1,108 tests (1,101 passed, 7 skipped for environment constraints, 0 failed, 4,560 assertions).
- **Automated frontend tests:** 87 test files passed, 350/350 tests passed.
- **Database migrations:** 0 changes pending; database migrations directory will remain 100% untouched.

In accordance with architectural principles:
- **Structural Migration Only:** No business rules, price calculations, VAT, discounts, coupon evaluations, stock management, payment state machines, transaction boundaries, or idempotency semantics will be altered.
- **Model Rule:** All Eloquent models remain strictly centralized in `App\Models\*` (including `Order`, `OrderItem`, `VendorOrder`, `Payment`, `PaymentTransaction`, `PaymentVendorAllocation`, `PaymentWebhookEvent`, `PaymentStateTransition`, `Cart`, `CartItem`, `Product`, `ProductInventory`, `InventoryReservation`, `InventoryMovement`, `Coupon`).
- **Policies Rule:** Framework policy auto-discovery (`App\Policies\{Model}Policy`) is preserved in `App\Policies\*` (`OrderPolicy`, `VendorOrderPolicy`).
- **Enums Rule:** Domain enums remain centralized in `App\Enums\*` (`OrderStatus`, `VendorOrderStatus`, `PaymentStatus`, `PaymentMethod`, `PaymentAttemptStatus`, `PaymentWebhookProcessingStatus`, `FakePaymentScenario`, `CartStatus`).
- **Events & Listeners Rule:** System-wide domain events remain in `App\Events\Domain\*` (`OrderCreated`, `OrderDelivered`, `OrderShipped`, `VendorOrderReceived`, `PaymentSucceeded`, `PaymentFailed`) and listeners remain in `App\Listeners\*`.

---

## 2. Commerce Domain Inventory & Target File Mapping

Total classes identified for physical migration across the four Commerce Operations domains: **85 classes**.

### 2.1 Domain: Cart (8 classes) -> `App\Domains\Cart\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Cart/CartController.php` | `app/Domains/Cart/Controllers/CartController.php` | `App\Domains\Cart\Controllers` |
| `app/Http/Requests/Cart/StoreCartItemRequest.php` | `app/Domains/Cart/Requests/StoreCartItemRequest.php` | `App\Domains\Cart\Requests` |
| `app/Http/Requests/Cart/UpdateCartItemRequest.php` | `app/Domains/Cart/Requests/UpdateCartItemRequest.php` | `App\Domains\Cart\Requests` |
| `app/Http/Resources/CartResource.php` | `app/Domains/Cart/Resources/CartResource.php` | `App\Domains\Cart\Resources` |
| `app/Http/Resources/CartItemResource.php` | `app/Domains/Cart/Resources/CartItemResource.php` | `App\Domains\Cart\Resources` |
| `app/Services/Cart/CartService.php` | `app/Domains/Cart/Services/CartService.php` | `App\Domains\Cart\Services` |
| `app/Services/Cart/CartMergeService.php` | `app/Domains/Cart/Services/CartMergeService.php` | `App\Domains\Cart\Services` |
| `app/Services/Cart/CartValidationService.php` | `app/Domains/Cart/Services/CartValidationService.php` | `App\Domains\Cart\Services` |

### 2.2 Domain: Checkout (9 classes) -> `App\Domains\Checkout\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Services/Checkout/AssemblyCalculator.php` | `app/Domains/Checkout/Contracts/AssemblyCalculator.php` | `App\Domains\Checkout\Contracts` |
| `app/Http/Controllers/Api/V1/Checkout/CheckoutController.php` | `app/Domains/Checkout/Controllers/CheckoutController.php` | `App\Domains\Checkout\Controllers` |
| `app/Http/Requests/Checkout/CheckoutPreviewRequest.php` | `app/Domains/Checkout/Requests/CheckoutPreviewRequest.php` | `App\Domains\Checkout\Requests` |
| `app/Http/Requests/Checkout/StoreOrderRequest.php` | `app/Domains/Checkout/Requests/StoreOrderRequest.php` | `App\Domains\Checkout\Requests` |
| `app/Http/Resources/CheckoutPreviewResource.php` | `app/Domains/Checkout/Resources/CheckoutPreviewResource.php` | `App\Domains\Checkout\Resources` |
| `app/Services/Checkout/CheckoutPreviewService.php` | `app/Domains/Checkout/Services/CheckoutPreviewService.php` | `App\Domains\Checkout\Services` |
| `app/Services/Checkout/StubAssemblyCalculator.php` | `app/Domains/Checkout/Services/StubAssemblyCalculator.php` | `App\Domains\Checkout\Services` |
| `app/Services/Checkout/VatCalculator.php` | `app/Domains/Checkout/Services/VatCalculator.php` | `App\Domains\Checkout\Services` |
| `app/Services/Checkout/VendorGroupService.php` | `app/Domains/Checkout/Services/VendorGroupService.php` | `App\Domains\Checkout\Services` |

### 2.3 Domain: Orders (18 classes) -> `App\Domains\Orders\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Order/OrderController.php` | `app/Domains/Orders/Controllers/OrderController.php` | `App\Domains\Orders\Controllers` |
| `app/Http/Controllers/Api/V1/Dashboard/VendorOrderController.php` | `app/Domains/Orders/Controllers/VendorOrderController.php` | `App\Domains\Orders\Controllers` |
| `app/Http/Requests/Dashboard/ShipVendorOrderRequest.php` | `app/Domains/Orders/Requests/ShipVendorOrderRequest.php` | `App\Domains\Orders\Requests` |
| `app/Http/Requests/Dashboard/StoreManualVendorOrderRequest.php` | `app/Domains/Orders/Requests/StoreManualVendorOrderRequest.php` | `App\Domains\Orders\Requests` |
| `app/Http/Resources/OrderResource.php` | `app/Domains/Orders/Resources/OrderResource.php` | `App\Domains\Orders\Resources` |
| `app/Http/Resources/OrderItemResource.php` | `app/Domains/Orders/Resources/OrderItemResource.php` | `App\Domains\Orders\Resources` |
| `app/Http/Resources/VendorOrderResource.php` | `app/Domains/Orders/Resources/VendorOrderResource.php` | `App\Domains\Orders\Resources` |
| `app/Services/Order/OrderCancellationService.php` | `app/Domains/Orders/Services/OrderCancellationService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/OrderCreationService.php` | `app/Domains/Orders/Services/OrderCreationService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/OrderNumberService.php` | `app/Domains/Orders/Services/OrderNumberService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/OrderStateService.php` | `app/Domains/Orders/Services/OrderStateService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/OrderTotalsReconciliationService.php` | `app/Domains/Orders/Services/OrderTotalsReconciliationService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/SelfPurchaseGuard.php` | `app/Domains/Orders/Services/SelfPurchaseGuard.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/ShipmentStateService.php` | `app/Domains/Orders/Services/ShipmentStateService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/VendorManualOrderService.php` | `app/Domains/Orders/Services/VendorManualOrderService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/VendorOrderFulfillmentService.php` | `app/Domains/Orders/Services/VendorOrderFulfillmentService.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/VendorOrderQueryFilter.php` | `app/Domains/Orders/Services/VendorOrderQueryFilter.php` | `App\Domains\Orders\Services` |
| `app/Services/Order/VendorOrderStateService.php` | `app/Domains/Orders/Services/VendorOrderStateService.php` | `App\Domains\Orders\Services` |

### 2.4 Domain: Payments (50 classes) -> `App\Domains\Payments\`
| Source Path | Target Path | Target Namespace |
| :--- | :--- | :--- |
| `app/Contracts/Payments/PaymentGatewayInterface.php` | `app/Domains/Payments/Contracts/PaymentGatewayInterface.php` | `App\Domains\Payments\Contracts` |
| `app/Http/Controllers/Api/V1/Payment/PaymentController.php` | `app/Domains/Payments/Controllers/PaymentController.php` | `App\Domains\Payments\Controllers` |
| `app/Http/Controllers/Api/V1/Payment/PaymentWebhookController.php` | `app/Domains/Payments/Controllers/PaymentWebhookController.php` | `App\Domains\Payments\Controllers` |
| `app/Http/Controllers/Api/V1/Payment/FakePaymentWebhookController.php` | `app/Domains/Payments/Controllers/FakePaymentWebhookController.php` | `App\Domains\Payments\Controllers` |
| `app/Http/Requests/Payment/InitiatePaymentRequest.php` | `app/Domains/Payments/Requests/InitiatePaymentRequest.php` | `App\Domains\Payments\Requests` |
| `app/Http/Requests/Payment/SimulatePaymentRequest.php` | `app/Domains/Payments/Requests/SimulatePaymentRequest.php` | `App\Domains\Payments\Requests` |
| `app/Http/Requests/Payment/SubmitPaymentRequest.php` | `app/Domains/Payments/Requests/SubmitPaymentRequest.php` | `App\Domains\Payments\Requests` |
| `app/Http/Resources/PaymentResource.php` | `app/Domains/Payments/Resources/PaymentResource.php` | `App\Domains\Payments\Resources` |
| `app/Http/Resources/PaymentInitiationResource.php` | `app/Domains/Payments/Resources/PaymentInitiationResource.php` | `App\Domains\Payments\Resources` |
| `app/Http/Resources/PaymentSubmissionResource.php` | `app/Domains/Payments/Resources/PaymentSubmissionResource.php` | `App\Domains\Payments\Resources` |
| `app/Jobs/Payments/ProcessPaymentWebhookJob.php` | `app/Domains/Payments/Jobs/ProcessPaymentWebhookJob.php` | `App\Domains\Payments\Jobs` |
| `app/Services/Order/PaymentStateService.php` | `app/Domains/Payments/Services/PaymentStateService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentAllocationSnapshotService.php` | `app/Domains/Payments/Services/PaymentAllocationSnapshotService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentApplicationService.php` | `app/Domains/Payments/Services/PaymentApplicationService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentFinalizationService.php` | `app/Domains/Payments/Services/PaymentFinalizationService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentGatewayManager.php` | `app/Domains/Payments/Services/PaymentGatewayManager.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentHealthService.php` | `app/Domains/Payments/Services/PaymentHealthService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentMethodLabelResolver.php` | `app/Domains/Payments/Services/PaymentMethodLabelResolver.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentMethodResolver.php` | `app/Domains/Payments/Services/PaymentMethodResolver.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentOrchestrator.php` | `app/Domains/Payments/Services/PaymentOrchestrator.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentOutboxService.php` | `app/Domains/Payments/Services/PaymentOutboxService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentReconciliationService.php` | `app/Domains/Payments/Services/PaymentReconciliationService.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentRequestBuilder.php` | `app/Domains/Payments/Services/PaymentRequestBuilder.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentWebhookEventProcessor.php` | `app/Domains/Payments/Services/PaymentWebhookEventProcessor.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/PaymentWebhookProcessor.php` | `app/Domains/Payments/Services/PaymentWebhookProcessor.php` | `App\Domains\Payments\Services` |
| `app/Services/Payments/Exceptions/PaymentGatewayException.php` | `app/Domains/Payments/Exceptions/PaymentGatewayException.php` | `App\Domains\Payments\Exceptions` |
| `app/Services/Payments/Gateways/FakePaymentGateway.php` | `app/Domains/Payments/Services/Gateways/FakePaymentGateway.php` | `App\Domains\Payments\Services\Gateways` |
| `app/Services/Payments/Gateways/LocalPaymentGateway.php` | `app/Domains/Payments/Services/Gateways/LocalPaymentGateway.php` | `App\Domains\Payments\Services\Gateways` |
| `app/Services/Payments/Gateways/MyFatoorah/DiyarMyFatoorah.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/DiyarMyFatoorah.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/DiyarMyFatoorahHttp.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/DiyarMyFatoorahHttp.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/DiyarMyFatoorahPaymentEmbedded.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/DiyarMyFatoorahPaymentEmbedded.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/DiyarMyFatoorahPayments.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/DiyarMyFatoorahPayments.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/DiyarMyFatoorahSessions.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/DiyarMyFatoorahSessions.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahConfigFactory.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahConfigFactory.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahGateway.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahGateway.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahPaymentMapper.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahPaymentMapper.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahPaymentMethodMapper.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahPaymentMethodMapper.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahPaymentResponseMapper.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahPaymentResponseMapper.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahSupplierMapper.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahSupplierMapper.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahWebhookMapper.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahWebhookMapper.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/Gateways/MyFatoorah/MyFatoorahWebhookVerifier.php` | `app/Domains/Payments/Services/Gateways/MyFatoorah/MyFatoorahWebhookVerifier.php` | `App\Domains\Payments\Services\Gateways\MyFatoorah` |
| `app/Services/Payments/DTO/PaymentCreationRequest.php` | `app/Domains/Payments/Services/DTO/PaymentCreationRequest.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentCreationResult.php` | `app/Domains/Payments/Services/DTO/PaymentCreationResult.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentDetailsRequest.php` | `app/Domains/Payments/Services/DTO/PaymentDetailsRequest.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentDetailsResult.php` | `app/Domains/Payments/Services/DTO/PaymentDetailsResult.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentMethodCapability.php` | `app/Domains/Payments/Services/DTO/PaymentMethodCapability.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentMethodsRequest.php` | `app/Domains/Payments/Services/DTO/PaymentMethodsRequest.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentSessionRequest.php` | `app/Domains/Payments/Services/DTO/PaymentSessionRequest.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/PaymentSessionResult.php` | `app/Domains/Payments/Services/DTO/PaymentSessionResult.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/RefundPaymentRequest.php` | `app/Domains/Payments/Services/DTO/RefundPaymentRequest.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/RefundPaymentResult.php` | `app/Domains/Payments/Services/DTO/RefundPaymentResult.php` | `App\Domains\Payments\Services\DTO` |
| `app/Services/Payments/DTO/VerifiedWebhookPayload.php` | `app/Domains/Payments/Services/DTO/VerifiedWebhookPayload.php` | `App\Domains\Payments\Services\DTO` |

---

## 3. Classes Intentionally Preserved in Place

1. **`app/Http/Controllers/Api/V1/Order/OrderStoreReviewController.php`:**
   Mapped explicitly under the **Reviews** domain (`conception/Architecture/BACKEND_REORGANIZATION_MAP.md` line 39). Consumes `StoreReviewService::eligibilityForOrder()`. Preserved until the Reviews domain migration.
2. **`app/Http/Controllers/Api/V1/Admin/AdminOrderController.php` & `AdminPaymentController.php`:**
   Belong to the **Admin** domain presentation layer (`BACKEND_ARCHITECTURE.md` Section 3, Rule 4). Consumes domain models/services; will be migrated with Admin control plane.
3. **`app/Policies/OrderPolicy.php` & `VendorOrderPolicy.php`:**
   Preserved in `app/Policies/*` to maintain automatic policy discovery by Laravel convention.
4. **`app/Events/Domain/Order*.php` & `Payment*.php`:**
   Preserved in `app/Events/Domain/*` to maintain consistent domain event dispatcher semantics.
5. **`app/Domains/Catalog/Services/InventoryService.php`:**
   Already migrated in Step 4 under Catalog. Owns `reserve()`, `finalize()`, `release()`, and `lockInventory()`. Unchanged.

---

## 4. Cross-Domain Dependencies & Safety Analysis

1. **Orders -> Payments:** `OrderCreationService` dispatches `OrderCreated` and coordinates with `PaymentStateService`. `OrderCancellationService` coordinates with `PaymentStateService`.
2. **Orders -> Catalog/Inventory:** `OrderCreationService` calls `InventoryService::reserve()` and `InventoryService::finalize()`.
3. **Orders -> Shipping:** `OrderCreationService` references `ShippingMethod` and creates `Shipment` entities. `VendorOrderFulfillmentService` coordinates tracking numbers and shipment states.
4. **Orders -> Coupons:** `OrderCreationService` applies and records `Coupon` usage.
5. **Payments -> Returns:** `RefundProcessingService` (Returns) consumes `PaymentStateService` (Payments) and `PaymentGatewayManager` (Payments).
6. **Checkout -> Cart & Catalog:** `CheckoutPreviewService` reads Cart items, checks product availability, and computes vendor shipping groups and VAT.
7. **Service Provider Bindings:** `AppServiceProvider` binds `AssemblyCalculator`, `MyFatoorahGateway`, `PaymentGatewayInterface`, and `PaymentGatewayManager`. These bindings will be updated to their canonical domain namespaces.

---

## 5. Execution Sequence

The migration will be executed through the approved topological sequence:
- **Subphase 6.1: Cart** (8 classes) + verify.
- **Subphase 6.2: Checkout** (9 classes) + verify.
- **Subphase 6.3: Orders** (18 classes) + verify.
- **Subphase 6.4: Payments** (50 classes) + verify.
- **Subphase 6.5: Reference updates & container bindings** (AppServiceProvider, routes, tests).
- **Subphase 6.6: Full regression verification** (Backend, Frontend, Routes, Migrations diff).

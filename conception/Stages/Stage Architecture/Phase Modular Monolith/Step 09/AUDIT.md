# STEP 9 — REMAINING BACKEND DOMAINS MIGRATION AUDIT
**Date:** 2026-10-03  
**Authority:** Senior Software Engineer, Laravel Architect, Full-Stack Developer, Security Engineer, QA Engineer  
**Scope:** `Shipping`, `Chat`, `Notifications`, `Analytics`, `Blog`, `Projects`, `Assistant`, `Platform`, `Admin` domains and legacy stragglers  
**Repository Branch:** `dev`  
**Baseline Commit:** `292353b2bb42f76a9d2f1fbb9118e7d2163930bb`  

---

## 1. Executive Summary & Architectural Scope

Step 9 of the physical architecture migration completes the domain-driven modular monolith transformation of the DIYAR Laravel backend. Prior migration steps (Steps 2 through 8) established Core foundations, Infrastructure, Identity, Search, Catalog, Spatial/Media, Commerce Operations, Support/Engagement, and Marketplace Operations.

The objectives of Step 9 are:
1. Complete physical organization of remaining business capabilities into canonical domain directories under `backend/app/Domains/`.
2. Migrate 9 target domains:
   - `App\Domains\Shipping\`
   - `App\Domains\Chat\`
   - `App\Domains\Notifications\`
   - `App\Domains\Analytics\`
   - `App\Domains\Blog\`
   - `App\Domains\Projects\`
   - `App\Domains\Assistant\`
   - `App\Domains\Platform\`
   - `App\Domains\Admin\`
3. Migrate isolated legacy stragglers to their established domains (`Vendors`, `ServicesMarketplace`, `Identity`).
4. Preserve all application behavior, routes (528 routes), test suites (1,101 backend passed / 350 frontend passed), database migrations (0 changes), and framework auto-discovery boundaries.

---

## 2. Baseline Quality Gates

| Verification Gate | Expected Baseline Metric | Verification Source |
| :--- | :--- | :--- |
| **Backend Test Suite** | 1,108 tests: 1,101 passed, 7 skipped, 0 failed, 4,560 assertions | `php artisan test` |
| **Frontend Test Suite** | 87 test files: 350 passed, 0 failed | `npm test -- --run` |
| **Registered Routes** | Exactly 528 routes (522 API v1 + 6 platform routes) | `php artisan route:list` |
| **Database Migrations** | 0 files modified or added | `git diff HEAD -- backend/database/migrations` |
| **Working Tree** | Clean on branch `dev` | `git status --short` |

---

## 3. Comprehensive Repository Inventory & Classification

Across `backend/app/`, exactly **623 PHP files** currently reside outside `backend/app/Domains/`.
Every file has been analyzed and classified under the standard architecture categories:
- **`MOVE` (232 files):** Domain-specific HTTP controllers, form requests, API resources, application services, domain contracts, domain channels, domain jobs, and domain support utilities.
- **`KEEP` (163 files):**
  - Shared Eloquent model layer in `App\Models\*` (114 models)
  - Core platform foundations in `App\Core\*` (36 files)
  - Infrastructure drivers in `App\Infrastructure\*` (13 files)
- **`FRAMEWORK-BOUNDARY` (183 files):**
  - Framework policy auto-discovery in `App\Policies\*` (20 policies)
  - Framework domain enums and casts in `App\Enums\*` (81 enums)
  - Artisan CLI commands in `App\Console\*` (28 commands)
  - Framework service providers in `App\Providers\*` (6 providers)
  - Domain events and broadcast events in `App\Events\*` (30 events)
  - Framework event listeners in `App\Listeners\*` (14 listeners)
  - Framework exceptions in `App\Exceptions\*` (4 exceptions)
- **`SHARED / DEFER` (25 files):**
  - Cross-domain financial ledger & payouts engine in `App\Services\Finance\*` (18 files), `App\Http\Requests\Finance\*` (2 files), `App\Http\Resources\FinancialTransactionResource.php` (1 file), `App\Support\Finance\IbanValidator.php` (1 file) — spans Payments, Vendors, Admin, Orders. Deferred to Step 10 (Architecture Seams & Cleanup).
  - Cross-cutting media image optimization & upload services in `App\Services\Media\*` (2 files) — consumed across 12 domains. Deferred to Step 10.
  - Cross-cutting cache helpers in `App\Support\Cache\*` (2 files) — deferred to Step 10.

---

## 4. Step 9 Migration Matrix (232 Classes to Move)

### 4.1 Domain: Shipping (17 classes) -> `App\Domains\Shipping\`
| Current Path | Class | Namespace | Target Path | Target Namespace | Framework-Bound? | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `app/Http/Controllers/Api/V1/Dashboard/VendorShippingSettingsController.php` | `VendorShippingSettingsController` | `App\Http\Controllers\Api\V1\Dashboard` | `app/Domains/Shipping/Controllers/VendorShippingSettingsController.php` | `App\Domains\Shipping\Controllers` | No | `MOVE` |
| `app/Http/Requests/Dashboard/UpdateVendorShippingSettingsRequest.php` | `UpdateVendorShippingSettingsRequest` | `App\Http\Requests\Dashboard` | `app/Domains/Shipping/Requests/UpdateVendorShippingSettingsRequest.php` | `App\Domains\Shipping\Requests` | No | `MOVE` |
| `app/Http/Resources/VendorShippingSettingsResource.php` | `VendorShippingSettingsResource` | `App\Http\Resources` | `app/Domains/Shipping/Resources/VendorShippingSettingsResource.php` | `App\Domains\Shipping\Resources` | No | `MOVE` |
| `app/Http/Resources/ShipmentResource.php` | `ShipmentResource` | `App\Http\Resources` | `app/Domains/Shipping/Resources/ShipmentResource.php` | `App\Domains\Shipping\Resources` | No | `MOVE` |
| `app/Contracts/Shipping/ShippingCalculatorInterface.php` | `ShippingCalculatorInterface` | `App\Contracts\Shipping` | `app/Domains/Shipping/Contracts/ShippingCalculatorInterface.php` | `App\Domains\Shipping\Contracts` | No | `MOVE` |
| `app/Contracts/Shipping/ShippingProviderInterface.php` | `ShippingProviderInterface` | `App\Contracts\Shipping` | `app/Domains/Shipping/Contracts/ShippingProviderInterface.php` | `App\Domains\Shipping\Contracts` | No | `MOVE` |
| `app/Services/Shipping/ShippingConfigCache.php` | `ShippingConfigCache` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ShippingConfigCache.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/ShippingQuoteService.php` | `ShippingQuoteService` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ShippingQuoteService.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/ShippingRuleCatalog.php` | `ShippingRuleCatalog` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ShippingRuleCatalog.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/ShippingRuleEngine.php` | `ShippingRuleEngine` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ShippingRuleEngine.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/ShippingWeightCalculator.php` | `ShippingWeightCalculator` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ShippingWeightCalculator.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/VendorShippingSettingsService.php` | `VendorShippingSettingsService` | `App\Services\Shipping` | `app/Domains/Shipping/Services/VendorShippingSettingsService.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/ZoneResolver.php` | `ZoneResolver` | `App\Services\Shipping` | `app/Domains/Shipping/Services/ZoneResolver.php` | `App\Domains\Shipping\Services` | No | `MOVE` |
| `app/Services/Shipping/DTO/ShippingQuote.php` | `ShippingQuote` | `App\Services\Shipping\DTO` | `app/Domains/Shipping/Services/DTO/ShippingQuote.php` | `App\Domains\Shipping\Services\DTO` | No | `MOVE` |
| `app/Services/Shipping/DTO/ShippingQuoteContext.php` | `ShippingQuoteContext` | `App\Services\Shipping\DTO` | `app/Domains/Shipping/Services/DTO/ShippingQuoteContext.php` | `App\Domains\Shipping\Services\DTO` | No | `MOVE` |
| `app/Services/Shipping/Strategies/CarrierFlatRateStrategy.php` | `CarrierFlatRateStrategy` | `App\Services\Shipping\Strategies` | `app/Domains/Shipping/Services/Strategies/CarrierFlatRateStrategy.php` | `App\Domains\Shipping\Services\Strategies` | No | `MOVE` |
| `app/Services/Shipping/Strategies/PickupStrategy.php` | `PickupStrategy` | `App\Services\Shipping\Strategies` | `app/Domains/Shipping/Services/Strategies/PickupStrategy.php` | `App\Domains\Shipping\Services\Strategies` | No | `MOVE` |
| `app/Services/Shipping/Strategies/ShippingMethodStrategy.php` | `ShippingMethodStrategy` | `App\Services\Shipping\Strategies` | `app/Domains/Shipping/Services/Strategies/ShippingMethodStrategy.php` | `App\Domains\Shipping\Services\Strategies` | No | `MOVE` |

### 4.2 Domain: Chat (27 classes) -> `App\Domains\Chat\`
- **Controllers (3):** `AttachmentController`, `ConversationController`, `MessageController` -> `App\Domains\Chat\Controllers\`
- **Requests (4):** `CreateConversationRequest`, `ReportMessageRequest`, `SendMessageRequest`, `UpdateMessageRequest` -> `App\Domains\Chat\Requests\`
- **Resources (3):** `ChatReportReasonResource`, `ConversationResource`, `MessageResource` -> `App\Domains\Chat\Resources\`
- **Services (16):** `ChatArchiveService`, `ChatAttachmentService`, `ChatAuthorizationService`, `ChatCacheService`, `ChatDeliveryService`, `ChatLockService`, `ChatMetrics`, `ChatModerationEnforcementService`, `ChatModerationService`, `ChatPresenceService`, `ChatRealtimeBroadcaster`, `ChatReportNotificationService`, `ChatTypingService`, `ChatUnreadCounterService`, `ConversationService`, `MessageService` -> `App\Domains\Chat\Services\`
- **Jobs (1):** `ArchiveOldMessagesJob` -> `App\Domains\Chat\Jobs\`

### 4.3 Domain: Notifications (32 classes) -> `App\Domains\Notifications\`
- **Controllers (2):** `NotificationController`, `NotificationPreferenceController` -> `App\Domains\Notifications\Controllers\`
- **Requests (1):** `UpdateNotificationPreferencesRequest` -> `App\Domains\Notifications\Requests\`
- **Resources (3):** `NotificationBroadcastResource`, `NotificationDeliveryResource`, `UserNotificationResource` -> `App\Domains\Notifications\Resources\`
- **Contracts (3):** `NotificationChannelInterface`, `PushProviderInterface`, `TriggersNotification` -> `App\Domains\Notifications\Contracts\`
- **Channels (4):** `EmailNotificationChannel`, `InAppChannel`, `PushNotificationChannel`, `SmsNotificationChannel` -> `App\Domains\Notifications\Channels\`
- **Services (17):** `NotificationAggregationService`, `NotificationBroadcastProgressService`, `NotificationBroadcastService`, `NotificationCatalog`, `NotificationCategoryRegistry`, `NotificationCircuitBreaker`, `NotificationContextBuilder`, `NotificationDeliveryRecoveryService`, `NotificationDeliveryStateMachine`, `NotificationDeviceService`, `NotificationDispatcher`, `NotificationIntent`, `NotificationPreferenceResolver`, `NotificationPreferenceService`, `NotificationRealtimeBroadcaster`, `NotificationRenderer`, `NotificationService`, `NotificationUnreadCounterService` -> `App\Domains\Notifications\Services\`
- **Jobs (2):** `DeliverNotificationChannelJob`, `ProcessNotificationBroadcastJob` -> `App\Domains\Notifications\Jobs\`

### 4.4 Domain: Analytics (10 classes) -> `App\Domains\Analytics\`
- **Services (9):** `AdminAnalyticsService`, `AnalyticsCache`, `AnalyticsCacheInvalidator`, `AnalyticsDateRangeResolver`, `AnalyticsEventRecorder`, `AnalyticsTimeBuckets`, `ProductViewAnalyticsService`, `ProviderAnalyticsService`, `VendorAnalyticsService` -> `App\Domains\Analytics\Services\`
- **Jobs (1):** `RecordAnalyticsEventJob` -> `App\Domains\Analytics\Jobs\`

### 4.5 Domain: Blog (13 classes) -> `App\Domains\Blog\`
- **Controllers (4):** `BlogArticleController`, `BlogCategoryController`, `BlogEngagementController`, `BlogTagController` -> `App\Domains\Blog\Controllers\`
- **Requests (1):** `BlogArticleListRequest` -> `App\Domains\Blog\Requests\`
- **Resources (4):** `BlogArticleCardResource`, `BlogArticleDetailResource`, `BlogCategoryResource`, `BlogTagResource` -> `App\Domains\Blog\Resources\`
- **Services (4):** `AdminBlogService`, `BlogEngagementService`, `BlogQueryService`, `BlogService` -> `App\Domains\Blog\Services\`

### 4.6 Domain: Projects (7 classes) -> `App\Domains\Projects\`
- **Controllers (1):** `ProjectController` -> `App\Domains\Projects\Controllers\`
- **Requests (1):** `ProjectListRequest` -> `App\Domains\Projects\Requests\`
- **Resources (2):** `ProjectCardResource`, `ProjectDetailResource` -> `App\Domains\Projects\Resources\`
- **Services (3):** `AdminProjectService`, `ProjectQueryService`, `ProjectService` -> `App\Domains\Projects\Services\`

### 4.7 Domain: Assistant (4 classes) -> `App\Domains\Assistant\`
- **Controllers (1):** `AssistantChatController` -> `App\Domains\Assistant\Controllers\`
- **Requests (1):** `AssistantChatRequest` -> `App\Domains\Assistant\Requests\`
- **Services (2):** `AssistantChatService`, `AssistantSystemPromptBuilder` -> `App\Domains\Assistant\Services\`

### 4.8 Domain: Platform (22 classes) -> `App\Domains\Platform\`
- **Controllers (9):** `HealthController`, `LiveHealthController`, `ReadinessController`, `WebsiteFeedbackController`, `PlatformAnnouncementController`, `PlatformCommerceController`, `PlatformContactController`, `PlatformSearchController`, `PlatformThemeController` -> `App\Domains\Platform\Controllers\`
- **Requests (3):** `StoreWebsiteFeedbackRequest`, `PlatformConsultationRequest`, `PlatformNewsletterRequest` -> `App\Domains\Platform\Requests\`
- **Resources (1):** `WebsiteFeedbackResource` -> `App\Domains\Platform\Resources\`
- **Services (9):** `PlatformInboundMailService`, `PlatformNewsletterService`, `EffectiveConfigService`, `SystemSettingService`, `EnvironmentSafetyValidator`, `PhpRuntimeValidator`, `PlatformHealthService`, `DomainOutboxProcessor`, `DomainOutboxPublisher` -> `App\Domains\Platform\Services\`

### 4.9 Domain: Admin (97 classes) -> `App\Domains\Admin\`
- **Controllers (47):** `Admin*Controller` (46 controllers) + `CategoryController` -> `App\Domains\Admin\Controllers\`
- **Requests (15):** `StoreB2bCompanyRequest`, `StoreBlogArticleRequest`, `StoreBlogCategoryRequest`, `StoreBlogTagRequest`, `StoreCategoryRequest`, `StoreNotificationBroadcastRequest`, `StoreProjectRequest`, `UpdateB2bCompanyRequest`, `UpdateBlogArticleRequest`, `UpdateBlogCategoryRequest`, `UpdateBlogTagRequest`, `UpdateCategoryRequest`, `UpdateChatReportRequest`, `UpdateProjectRequest`, `UploadCmsImageRequest` -> `App\Domains\Admin\Requests\`
- **Resources (18):** 14 `Admin*Resource` in `Resources/` + 4 resources in `Resources/Admin/` -> `App\Domains\Admin\Resources\`
- **Services (16):** 16 `Admin*Service` in `Services/Admin/` -> `App\Domains\Admin\Services\`
- **Jobs (1):** `RecordAdminAuditLogJob` -> `App\Domains\Admin\Jobs\`

### 4.10 Domain Stragglers (3 classes)
- `app/Services/Catalog/VendorService.php` -> `App\Domains\Vendors\Services\VendorService.php`
- `app/Http/Requests/Catalog/ServiceListRequest.php` -> `App\Domains\ServicesMarketplace\Requests\ServiceListRequest.php`
- `app/Http/Controllers/Api/V1/Profile/WishlistController.php` -> `App\Domains\Identity\Controllers\WishlistController.php`

---

## 5. Architectural Boundaries Preserved

1. **Centralized Models Layer:** All 114 Eloquent models remain centralized in `App\Models\*`. Zero models moved.
2. **Framework Policy Discovery:** All 20 policy classes remain in `App\Policies\*` (`Admin*Policy`, `ShippingPolicy`, `ChatPolicy`, etc.).
3. **Framework Enums:** All 81 enum classes remain in `App\Enums\*`.
4. **Artisan Console Commands:** All 28 commands remain in `App\Console\Commands\*`.
5. **Events & Listeners:** System-wide broadcast and domain events remain in `App\Events\*` and listeners in `App\Listeners\*`.
6. **Infrastructure SMS & Mail:** `App\Infrastructure\Sms\*` and `App\Infrastructure\Mail\*` remain dedicated transport infrastructure.

---

## 6. Cross-Domain Coupling & Dependency Map

- **Shipping ↔ Orders / Vendors:** `ShippingQuoteService` calculates rates against vendor sub-orders and snapshots shipping costs onto orders.
- **Chat ↔ Identity:** `ConversationService` validates user authentication, handles participant permissions, and broadcasts via Reverb.
- **Notifications ↔ Identity / Orders:** `NotificationDispatcher` routes transactional alerts across email, SMS, push, and in-app feeds.
- **Analytics ↔ Catalog / Vendors:** `ProductViewAnalyticsService` and `VendorAnalyticsService` aggregate interaction metrics.
- **Admin ↔ All Domains:** Admin controllers act as the control-plane gateway orchestrating operations across Commerce, Catalog, Identity, Services, and Support.
- **Finance (Deferred to Step 10):** Ledger posting (`FinancialPostingService`), escrow release (`EscrowReleaseService`), and payout processing (`PayoutService`) interact across Orders, Payments, Vendors, and Admin. Kept under `App\Services\Finance` pending Step 10 seam audit.

---

## 7. Migration Execution Plan

1. **Substep 9.1: Shipping Domain Migration (17 classes)** — Move files, update namespaces, verify routes and targeted tests.
2. **Substep 9.2: Chat Domain Migration (27 classes)** — Move files, update namespaces, verify routes and targeted tests.
3. **Substep 9.3: Notifications Domain Migration (32 classes)** — Move files, update namespaces, verify routes and targeted tests.
4. **Substep 9.4: Analytics, Blog, Projects & Assistant Domains Migration (34 classes)** — Move files, update namespaces, verify routes and targeted tests.
5. **Substep 9.5: Platform Domain Migration (22 classes)** — Move files, update namespaces, verify routes and targeted tests.
6. **Substep 9.6: Admin Domain Migration & Stragglers (100 classes)** — Move files, update namespaces, verify routes and targeted tests.
7. **Substep 9.7: Verification & Invariant Certification** — Static reference scan, full backend suite (1,101 passed, 7 skipped), frontend test suite (350/350 passed), frontend build, and route invariant (528 routes).
8. **Substep 9.8: Documentation & Commit** — Create `REPORT.md`, update `.agent/CURRENT_STATE.md`, commit cleanly.

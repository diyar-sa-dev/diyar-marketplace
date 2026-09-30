# Phase 21 — Service / Module Dependency Map

**Date:** 2026-09-30  
**Authority:** DIYAR Enterprise Performance & Capacity Engineering  
**Scope:** Internal call graph, downstream storage, caching boundaries, and queue dispatch points  

---

## 1. High-Level Architecture Topology

```text
                                 [CLIENT]
                         (Browser / Mobile Web)
                                    │
                                    ▼
                         [NGINX REVERSE PROXY]
                            (Port :8193)
                                    │
                   ┌────────────────┴────────────────┐
                   ▼                                 ▼
             [VITE SPA ASSETS]              [LARAVEL OCTANE]
            (Static JS/CSS/Media)        (2 Workers, FrankenPHP)
                                                     │
        ┌───────────────────┬────────────────────────┼───────────────────────┐
        ▼                   ▼                        ▼                       ▼
 [AUTHENTICATION]    [CATALOG / SEARCH]     [COMMERCE / CHECKOUT]   [BACKGROUND QUEUE]
   (Sanctum/DB)    (ProductSearchContract)    (Orders/Inventory)       (Worker/Redis)
        │                   │                        │                       │
        │                   ▼                        ▼                       ▼
        │             [ProductService]        [CheckoutService]      [Analytics/Jobs]
        │                   │                        │                       │
        ▼                   ▼                        ▼                       ▼
    [REDIS 7]          [MYSQL 8]               [TRANSACTION]           [REDIS QUEUE]
 (Session/Cache)   (InnoDB + Fulltext)        (Row-Level Locks)      (Default/Analytics)
```

---

## 2. Key Subsystem Dependency Chains

### A. Catalog Search & Facet Discovery
```text
HTTP GET /api/v1/catalog/search
  └── CatalogSearchController::search
        ├── CatalogFilterNormalizer::normalizeForCatalogSearch
        ├── CatalogSearchService::facets
        │     └── StampedeSafeCache::remember(lock:diyar:catalog:facets:v1:*)
        │           ├── VendorAccount::whereHas(...) [MySQL]
        │           └── Category::whereHas(...)      [MySQL]
        └── ProductSearchContract (ProductSearchService)
              └── ProductService::listPublic
                    ├── ProductService::cardQuery (Lean select)
                    ├── ProductService::applyFilters (ngram FULLTEXT MATCH)
                    ├── Product::paginate(12) [MySQL InnoDB]
                    └── ProductService::hydrateReviewAggregates
                          └── ProductReview::whereIn('product_id', 12 IDs) [MySQL Range Scan (0.29ms)]
```

### B. Product Detail & Engagement Path
```text
HTTP GET /api/v1/products/{id}
  └── ProductController::show
        └── ProductService::findPublic
              ├── VersionedCache::remember(diyar:catalog:product:v1:*)
              │     └── Product::with(['vendorAccount', 'category', 'images', 'inventory'])
              │           ├── withCount(['likes', 'reviews'])
              │           └── withAvg('reviews', 'rating') [MySQL]
              └── ProductDetailResource::toArray
                    └── ProductEngagementService::userSaved / userLiked
                          └── Redis Set / MySQL exists check
```

### C. Cart Modification & Inventory Lock
```text
HTTP POST /api/v1/cart/items
  └── CartController::addItem
        └── CartService::addItem
              └── DB::transaction
                    ├── ProductInventory::where('product_id', $id)->lockForUpdate() [MySQL Row Lock]
                    ├── CartItem::updateOrCreate(...)                               [MySQL]
                    └── Redis::del("diyar:cart:summary:{$userId}")                   [Cache Invalidation]
```

### D. Checkout & Order Creation
```text
HTTP POST /api/v1/checkout/orders
  └── CheckoutController::createOrder
        └── OrderService::createFromCart
              └── DB::transaction
                    ├── CartService::validateStockAndLock()      [MySQL Row Lock]
                    ├── CouponService::validateAndApply()        [MySQL + Redis]
                    ├── ShippingRuleService::calculateRate()     [Vendor Rules]
                    ├── Order::create(...)                       [MySQL insert]
                    ├── OrderItem::insert(...)                   [MySQL insert]
                    ├── ProductInventory::decrement(...)         [MySQL atomic update]
                    ├── OutboxEvent::create(...)                 [MySQL outbox pattern]
                    └── Queue::push(ProcessOrderCreatedEvent)    [Redis Queue]
```

### E. Room Designer Interactive Canvas
```text
HTTP POST /api/v1/room-designs
  └── RoomDesignController::store
        └── RoomDesignService::saveDesign
              ├── RoomDesignValidator::validateDocumentSchema (Fabric.js 2.5D / Three.js 3D bounds)
              ├── RoomDesign::create(['layout_data' => $json]) [MySQL JSON column]
              └── SpatialEngine::deriveCartLines              [In-memory geometry derivation]
```

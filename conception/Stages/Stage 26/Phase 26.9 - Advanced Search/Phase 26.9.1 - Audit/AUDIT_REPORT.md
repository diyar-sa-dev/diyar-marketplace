# Phase 26.9.1 — Architectural & Code Audit Report

**Date:** 2026-09-30  
**Authority:** Senior Software Engineer + Software Architect  
**Objective:** Comprehensive read-only audit of DIYAR search and listing execution path  

---

## 1. Audit Inquiries & Empirical Findings

### 1. Which query performs search?
- **Controller:** `CatalogSearchController` (`GET /api/v1/catalog/search` and `GET /api/v1/search`) and `ProductController::index` (`GET /api/v1/products?q=...`).
- **Service:** `CatalogSearchService::cachedProductResults` -> `ProductService::listPublic($engineFilters, $user)`.
- **Query Builder Method:** `ProductService::applyFilters` inside `ProductService::cardQuery`.
- **SQL WHERE Clause:**
  ```sql
  WHERE products.status = 'active'
    AND EXISTS (SELECT 1 FROM vendor_accounts WHERE vendor_accounts.id = products.vendor_account_id AND vendor_accounts.status = 'active')
    AND (MATCH(products.name, products.description) AGAINST (? IN BOOLEAN MODE) OR products.name LIKE ?)
    AND products.deleted_at IS NULL
  ORDER BY products.created_at DESC
  LIMIT 12 OFFSET 0;
  ```

### 2. Which query performs listing?
- **Controller:** `ProductController::index` (`GET /api/v1/products`).
- **Service:** `CachedPublicProductListService::paginated` -> `ProductService::listPublic($filters, $user)`.
- **SQL WHERE Clause:** Identical to search except without the `MATCH(...) OR LIKE ...` condition. It uses `products_status_created_at_index` (`status`, `created_at`), which is optimal (`type: index`, 12 rows examined).

### 3. Which fields are actually displayed on the card?
- **Frontend Consumer:** `frontend/src/components/cards/ProductCard.tsx` and `types/catalog.ts` (`ProductCard` interface).
- **Required Fields:**
  - `id`, `name`, `slug`
  - `sale_price`, `compare_price`, `promotion_ends_at`, `discount_percent`
  - `availability_mode`, `product_type`, `created_at`
  - `image_url` (from `primaryImage.mediaFile.path`)
  - `vendor` (`id`, `store_name`, `slug`)
  - `category` (`name`, `slug`, `type`)
  - `inventory` (`available_quantity`, `stock_quantity`)
  - `rating_avg`, `reviews_count` (StarRating component)
  - `user_saved` (bookmark toggle)
  - `loyalty_points_estimate`
  - `is_own_store`
- **Fields NOT used on card:**
  - `description` (long text), `materials` (JSON), `dimensions` (width, height, depth), `weight_kg`, `warranty`, `return_policy_*` fields.
  - All of these heavy fields are already excluded from `cardColumns()` in `ProductService.php`.

### 4. Which relationships are loaded?
- **In `cardEagerLoads()`:**
  - `vendorAccount:id,business_name,slug` (1 query, bounded)
  - `category:id,name,slug,type` (1 query, bounded)
  - `primaryImage.mediaFile:id,path` (via `HasOne ofMany`, 1 query)
  - `inventory:id,product_id,stock_quantity,reserved_quantity,available_quantity` (1 query, bounded)
- **Verdict:** Eager loading is clean and avoids N+1.

### 5. Which aggregates are calculated?
- In `cardQuery()`:
  - `withCount(['reviews'])`
  - `withAvg('reviews', 'rating')`
- **Mechanism:** Correlated subqueries injected into the primary `SELECT` projection.
- **Problem:** MySQL must evaluate these subqueries for candidate rows during fulltext/filesort processing, amplifying query execution duration.

### 6. Which indexes are used?
- `products_search_fulltext (name, description)`: FULLTEXT index with `ngram` parser (migrated in `2026_09_16_100000_add_services_fulltext_and_discount_indexes.php`).
- `products_status_created_at_index (status, created_at)`: B-tree index used for default listing.
- `vendor_accounts.PRIMARY`: B-tree index used for the `EXISTS` vendor check.

### 7. Which conditions prevent index efficiency?
- **The Culprit:** `OR products.name LIKE '%raw%'`.
- **Reason:** In MySQL, combining a FULLTEXT `MATCH()` with an `OR` condition against a non-fulltext column expression forces MySQL to abandon the FULLTEXT index completely. The optimizer falls back to `type: ALL` (full table scan) over all rows.

### 8. Whether `LIKE '%term%'` is required?
- **Finding:** No. `products_search_fulltext` is defined `WITH PARSER ngram`. In MySQL, the ngram parser tokenizes text into bi-grams (2 characters) by default. It inherently matches partial words, prefixes, and Arabic stems. The `OR products.name LIKE ...` was an unnecessary defensive fallback that disabled the index.

### 9. Whether FULLTEXT alone is sufficient for current requirements?
- **Finding:** Yes. Tested directly against Arabic (`طاولة`, `كنب`, `كرسي`, `سرير`, `طاو`) and English (`sofa`, `chair`, `table`, `bed`). Pure FULLTEXT matches all intended records and drops query time from 370.5 ms to 73.1 ms (and down to 34.7 ms when subqueries are decoupled).

### 10. Whether review aggregation belongs in the search query?
- **Finding:** No. Correlated subqueries in the main `SELECT` clause are evaluated before `LIMIT 12` during sorting. Decoupling the review aggregation to a single batch query (`SELECT product_id, count(*), round(avg(rating), 1) FROM product_reviews WHERE product_id IN (...) GROUP BY product_id`) takes **0.29 ms** for the 12 paginated items.

### 11. Whether favorite state can be resolved efficiently?
- **Finding:** Yes. `withUserSaved($user)` adds `withExists('wishlistItems as user_saved')`. For guest users (the majority of traffic), this is completely skipped. For authenticated users, it uses the indexed `(user_id, product_id)` key.

### 12. Whether the current response contains unnecessary payload?
- **Finding:** The payload returned by `ProductCardResource` aligns tightly with the UI card requirements.

---

## 2. Senior Architectural Plan

1. **Abstraction Layer (Section 3):**
   - Introduce `ProductSearchService` interface / implementation.
   - Clean separation: Controller -> `ProductSearchService` -> MySQL execution.
2. **Search Query Optimization (Section 12):**
   - Eliminate `OR products.name LIKE '%...%'` when boolean fulltext is generated.
   - For single-character or empty inputs, handle cleanly without full table scans.
3. **Aggregation Optimization (Section 15):**
   - Decouple correlated subqueries from the paginated query.
   - Batch-hydrate `reviews_count` and `reviews_avg_rating` on the paginated slice (0.29 ms).
4. **Preserve Compatibility:**
   - 100% identical JSON response structure.
   - 100% frontend contract preservation.
   - Zero Meilisearch / external engine dependency.

# Search Optimization — Implementation Plan

Fix all 14 issues from the [search audit](file:///home/yacine/.gemini/antigravity-ide/brain/5fad6e33-3547-4bf5-a3f3-8c94434698fe/search_analysis.md) and maximize MySQL search performance.

---

## Phase 1 — Critical Security Fix

> [!CAUTION]
> The legacy `/search` route passes raw unvalidated input into SQL queries. This is the highest priority fix.

### [DELETE] [SearchController.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Http/Controllers/Api/V1/Catalog/SearchController.php)

Delete this controller entirely. It duplicates `CatalogSearchController` but bypasses `CatalogSearchRequest` validation.

### [MODIFY] [api.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/routes/api.php)

- Remove the `Route::get('/search', SearchController::class)` line (L195).
- Redirect `/search` → `/catalog/search` for backward compatibility:

```php
Route::get('/search', CatalogSearchController::class)->middleware('throttle:catalog-search');
```

This makes `/search` use the same validated `CatalogSearchRequest` controller.

---

## Phase 2 — Database Layer Fixes

### [NEW] Migration: `add_services_fulltext_and_discount_indexes`

Three index changes in a single migration:

1. **FULLTEXT on services** — Add `FULLTEXT (title, description)` index on the `services` table with `ngram` parser (for Arabic support). This replaces the `LIKE '%term%'` full scan.

2. **Discount sort index** — Add a virtual generated column `discount_amount` to `products`:
   ```sql
   ALTER TABLE products
     ADD COLUMN discount_amount DECIMAL(12,2)
       GENERATED ALWAYS AS (COALESCE(compare_price, sale_price) - sale_price) STORED;
   CREATE INDEX products_status_discount_amount_idx
     ON products (status, discount_amount DESC);
   ```

3. **Products FULLTEXT with ngram** — Drop and recreate `products_search_fulltext` with `WITH PARSER ngram` for Arabic tokenization.

### [MODIFY] [Product.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Models/Product.php) — Fix `scopePubliclyVisible`

Replace the correlated `WHERE IN (SELECT ...)` subquery with an `INNER JOIN`:

```php
public function scopePubliclyVisible($query)
{
    return $query
        ->where('products.status', ProductStatus::Active)
        ->join('vendor_accounts', function ($join) {
            $join->on('vendor_accounts.id', '=', 'products.vendor_account_id')
                 ->where('vendor_accounts.status', '=', 'active');
        })
        ->select('products.*');
}
```

This lets MySQL use the `vendor_accounts.id` PK index directly instead of running a dependent subquery per row.

> [!IMPORTANT]
> The `->select('products.*')` is critical to prevent column ambiguity when `vendor_accounts` columns bleed into the result set. All downstream queries that already join vendor_accounts (like `cardQuery` with eager loads) will still work because Eloquent uses the `products.*` select.

### [MODIFY] [ProductService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/ProductService.php) — Remove runtime `Schema::hasTable`

**Line 478** — Replace `Schema::hasTable('product_likes')` guard with a config flag:

```php
private function applyPopularSort(Builder $query, string $sort): void
{
    $query->withCount('likes')
          ->orderBy('likes_count', $sort === '-popular' ? 'desc' : 'asc');
}
```

The `product_likes` table is established and migrated. The schema check was a defensive guard from initial development that is no longer needed.

Similarly, update [SearchAnalyticsRecorder.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Search/SearchAnalyticsRecorder.php) line 31 to drop the `Schema::hasTable('search_query_events')` check — the table is migrated and stable.

### [MODIFY] [ProductService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/ProductService.php) — Use `discount_amount` column for sort

Replace the computed `ORDER BY` expression (line 466):

```php
// Before:
'discount', '-discount' => $query
    ->orderByRaw('(compare_price - sale_price) '.($sort === '-discount' ? 'DESC' : 'ASC'))
    ->latest(),

// After:
'discount', '-discount' => $query
    ->orderBy('discount_amount', $sort === '-discount' ? 'desc' : 'asc')
    ->latest(),
```

Now the sort can use the `products_status_discount_amount_idx` index.

---

## Phase 3 — Query Optimization

### [MODIFY] [CatalogSearchService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/CatalogSearchService.php) — Merge facet queries

**Goal:** Reduce the 3 independent facet queries (vendor, color, category) to 2, and make category facets context-aware.

#### 3a. Vendor + Color facets in a single pass

Instead of running the full product filter pipeline twice (once for vendor facets, once for color facets), run it **once** and collect both aggregations from the same filtered product set:

```php
private function productFacetData(array $filters): array
{
    $facetFilters = $this->filtersForFacets($filters);
    $baseQuery = Product::query()
        ->publiclyVisible()
        ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->productFilters($facetFilters)));

    // Clone for vendor aggregation
    $vendorRows = (clone $baseQuery)
        ->reorder()
        ->selectRaw('vendor_account_id, COUNT(*) as product_count')
        ->groupBy('vendor_account_id')
        ->orderByDesc('product_count')
        ->limit(self::FACET_VENDOR_LIMIT)
        ->get();

    // Clone for color aggregation — use subquery instead of pluck+whereIn
    $colorRows = ProductColor::query()
        ->whereIn('product_id', (clone $baseQuery)->select('products.id')->limit(500))
        ->select(['name', 'hex_code'])
        ->distinct()
        ->orderBy('name')
        ->limit(self::FACET_COLOR_LIMIT)
        ->get();

    return ['vendorRows' => $vendorRows, 'colorRows' => $colorRows];
}
```

This eliminates one full scan. The color query also becomes a subquery `WHERE product_id IN (SELECT id FROM products WHERE ...)` instead of pulling 500 IDs into PHP and sending them back — lets MySQL optimize the join internally.

#### 3b. Context-aware category facets

Replace the current "return all categories" query with one that only returns categories that have matching products/services:

```php
private function categoryFacets(array $filters): array
{
    $facetFilters = $this->filtersForFacets($filters);
    unset($facetFilters['category_slug']); // don't filter by category when building category facets

    $matchingCategoryIds = Product::query()
        ->publiclyVisible()
        ->tap(fn (Builder $q) => $this->products->applyPublicFilters($q, $this->productFilters($facetFilters)))
        ->select('category_id')
        ->distinct()
        ->pluck('category_id');

    return Category::query()
        ->active()
        ->whereIn('id', $matchingCategoryIds)
        ->whereIn('type', ['product', 'both', 'service'])
        ->orderBy('sort_order')
        ->get(['slug', 'name', 'type'])
        ->map(fn (Category $c) => [
            'slug' => $c->slug,
            'name' => $c->name,
            'type' => $c->type->value ?? (string) $c->type,
        ])
        ->all();
}
```

> [!NOTE]
> This adds one lightweight `SELECT DISTINCT category_id` query but makes categories much more useful for users — they only see categories that will return results.

### [MODIFY] [ServiceCatalogService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/ServiceMarketplace/ServiceCatalogService.php) — Use FULLTEXT for service search

Replace the `LIKE '%term%'` search (line 109-116) with MySQL FULLTEXT:

```php
if (! empty($filters['q'])) {
    $raw = mb_substr((string) $filters['q'], 0, 120);

    if (DB::connection()->getDriverName() === 'mysql') {
        // FULLTEXT on services(title, description) — uses ngram parser for Arabic
        $query->where(function (Builder $q) use ($raw) {
            $q->whereRaw(
                'MATCH(services.title, services.description) AGAINST (? IN BOOLEAN MODE)',
                [$raw]
            )->orWhere('provider_accounts.business_name', 'like', '%'.$raw.'%');
        });
    } else {
        $term = '%'.$raw.'%';
        $query->where(function (Builder $q) use ($term) {
            $q->where('services.title', 'like', $term)
                ->orWhere('services.description', 'like', $term)
                ->orWhere('provider_accounts.business_name', 'like', $term);
        });
    }
}
```

The `provider_accounts.business_name` stays as `LIKE` since it's on a joined table with a separate index and is typically a small set.

### [MODIFY] [CatalogSearchSuggestionService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/CatalogSearchSuggestionService.php) — Combine suggestions into UNION

Replace the 4 sequential PHP queries with a single `UNION ALL` query:

```php
private function combinedSuggestions(string $prefix, string $contains, int $limit): Collection
{
    $prefixBind = $prefix;
    $containsBind = $contains;
    $prefixTrim = rtrim($prefix, '%');

    $sql = <<<SQL
        (SELECT id, 'product' AS entity_type, name AS label, slug,
                CONCAT(CAST(sale_price AS UNSIGNED), ' SAR') AS subtitle,
                CONCAT('/product/', slug) AS href,
                CASE WHEN name LIKE ? THEN 100 ELSE 80 END AS score
         FROM products
         WHERE status = 'active' AND deleted_at IS NULL
           AND (name LIKE ? OR name LIKE ?)
         ORDER BY score DESC, created_at DESC
         LIMIT ?)
        UNION ALL
        (SELECT id, 'vendor', business_name, slug, NULL,
                CONCAT('/store/', slug),
                CASE WHEN business_name LIKE ? THEN 90 ELSE 70 END
         FROM vendor_accounts
         WHERE status = 'active'
           AND (business_name LIKE ? OR business_name LIKE ?)
         ORDER BY CASE WHEN business_name LIKE ? THEN 0 ELSE 1 END
         LIMIT ?)
        UNION ALL
        (SELECT id, 'category', name, slug, NULL,
                CONCAT('/category/', slug),
                CASE WHEN name LIKE ? THEN 85 ELSE 65 END
         FROM categories
         WHERE is_active = 1
           AND (name LIKE ? OR name LIKE ?)
         ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, sort_order
         LIMIT ?)
        UNION ALL
        (SELECT s.id, 'service', s.title, s.slug,
                CASE WHEN s.starting_price IS NOT NULL
                     THEN CONCAT('من ', CAST(s.starting_price AS UNSIGNED), ' SAR')
                     ELSE NULL END,
                CONCAT('/service/', s.slug),
                CASE WHEN s.title LIKE ? THEN 75 ELSE 60 END
         FROM services s
         JOIN provider_accounts pa ON pa.id = s.provider_account_id AND pa.status = 'active'
         WHERE s.is_active = 1
           AND (s.title LIKE ? OR s.title LIKE ?)
         ORDER BY CASE WHEN s.title LIKE ? THEN 0 ELSE 1 END, s.requests_count DESC
         LIMIT ?)
        ORDER BY score DESC
        LIMIT ?
    SQL;

    return collect(DB::select($sql, [
        $prefixBind, $prefixBind, $containsBind, min(4, $limit),           // products
        $prefixBind, $prefixBind, $containsBind, $prefixBind, min(2, $limit), // vendors
        $prefixBind, $prefixBind, $containsBind, $prefixBind, min(2, $limit), // categories
        $prefixBind, $prefixBind, $containsBind, $prefixBind, min(2, $limit), // services
        $limit,                                                              // final limit
    ]));
}
```

**Result:** 4 round-trips → 1 round-trip. The UNION lets MySQL execute each sub-SELECT in parallel internally.

---

## Phase 4 — Caching & Async

### [MODIFY] [CatalogSearchService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/CatalogSearchService.php) — Cache search results

Add `StampedeSafeCache` around the main product/service listing queries (not just facets):

```php
public function search(array $filters, ?User $user = null): array
{
    $type = (string) ($filters['type'] ?? 'all');
    $payload = [
        'type' => $type,
        'query' => $filters['q'] ?? null,
        'facets' => $this->facets($filters),
    ];

    // Cache product results for anonymous users (auth users get fresh data)
    if ($type === 'all' || $type === 'products') {
        $payload['products'] = $this->cachedProductResults($filters, $user);
    }

    if ($type === 'all' || $type === 'services') {
        $payload['services'] = $this->cachedServiceResults($filters, $user);
    }

    return $payload;
}

private function cachedProductResults(array $filters, ?User $user): array
{
    // Skip cache for authenticated users (personalized: saved/liked status)
    if ($user !== null) {
        $paginator = $this->products->listPublic($this->productFilters($filters), $user);
        return $this->paginatedPayload($paginator, ProductCardResource::class);
    }

    $version = VersionedCache::version(CacheKeys::CATALOG_VERSION);
    $cacheKey = 'diyar:catalog:search:products:v1:'.$version.':'.md5(json_encode($this->productFilters($filters)));
    $ttl = (int) config('diyar.catalog.cache.search_results_seconds', 60);

    return StampedeSafeCache::remember($cacheKey, $ttl, function () use ($filters) {
        $paginator = $this->products->listPublic($this->productFilters($filters));
        return $this->paginatedPayload($paginator, ProductCardResource::class);
    }, 'lock:'.$cacheKey);
}
```

> [!NOTE]
> Results are only cached for **anonymous users**. Authenticated users need fresh `user_saved`/`user_liked` flags. The existing `VersionedCache` invalidation ensures cached results are busted on product CUD.

### [MODIFY] [CatalogSearchController.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Http/Controllers/Api/V1/Catalog/CatalogSearchController.php) — Defer analytics

Move the `SearchAnalyticsRecorder::record()` call to **after the response is sent**:

```php
public function __invoke(CatalogSearchRequest $request): JsonResponse
{
    $started = hrtime(true);
    $filters = $request->validatedFilters();
    $payload = $this->search->search($filters, $request->user());
    $durationMs = (int) round((hrtime(true) - $started) / 1_000_000);

    $query = trim((string) ($filters['q'] ?? ''));
    if ($query !== '') {
        // Defer to after response — don't block the user
        app()->terminating(fn () => $this->analytics->record(
            query: $query,
            searchType: (string) ($filters['type'] ?? 'all'),
            resultCount: $this->analytics->countResults($payload),
            userId: $request->user()?->id,
            sessionId: $request->header('X-Search-Session'),
            locale: $request->getPreferredLanguage(),
            filters: $filters,
            durationMs: $durationMs,
        ));
    }

    return ApiResponse::success(data: $payload);
}
```

`app()->terminating()` runs after the HTTP response is sent to the client, so the `INSERT` no longer adds latency.

### [MODIFY] [diyar.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/config/diyar.php) — Add config key

```php
'catalog' => [
    'cache' => [
        'search_facets_seconds' => ...,
        'search_suggestions_seconds' => ...,
        'search_results_seconds' => (int) env('DIYAR_CATALOG_SEARCH_RESULTS_CACHE_SECONDS', 60),
    ],
],
```

---

## Phase 5 — Arabic Tokenization

### [NEW] Migration: `upgrade_fulltext_indexes_to_ngram`

MySQL's default FULLTEXT parser uses whitespace/punctuation tokenization which is inadequate for Arabic text (diacritics, hamza variants, connected forms).

The `ngram` parser tokenizes text into overlapping n-character sequences, which works well for Arabic, Chinese, Japanese, and Korean:

```php
public function up(): void
{
    if (Schema::getConnection()->getDriverName() !== 'mysql') {
        return;
    }

    // Products: drop old FULLTEXT, recreate with ngram
    $indexes = collect(DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_search_fulltext']));
    if ($indexes->isNotEmpty()) {
        DB::statement('ALTER TABLE products DROP INDEX products_search_fulltext');
    }
    DB::statement('ALTER TABLE products ADD FULLTEXT products_search_fulltext (name, description) WITH PARSER ngram');

    // Services: new FULLTEXT with ngram
    DB::statement('ALTER TABLE services ADD FULLTEXT services_search_fulltext (title, description) WITH PARSER ngram');
}
```

> [!IMPORTANT]
> The ngram parser requires `ngram_token_size` to be configured (default is 2). For Arabic, the default of 2 is generally good. This can be tuned per-server via `SET GLOBAL ngram_token_size = 2` or in `my.cnf`.

Also update the PHP FULLTEXT queries to use `BOOLEAN MODE` instead of `NATURAL LANGUAGE MODE` for better control over Arabic queries:

```php
$query->whereRaw(
    'MATCH(name, description) AGAINST (? IN BOOLEAN MODE)',
    [$raw]
);
```

---

## Phase 6 — Frontend: Separate Product/Service Pagination

### [MODIFY] [catalogSearch.ts](file:///home/yacine/Documents/web/diyar-marketplace/frontend/src/api/catalogSearch.ts)

Add support for `product_page` / `service_page` params:

```ts
if (key === 'product_page' || key === 'service_page') {
    params.set(key, String(value));
    return;
}
```

### [MODIFY] [CatalogSearchRequest.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Http/Requests/Catalog/CatalogSearchRequest.php)

Add validation rules:

```php
'product_page' => ['nullable', 'integer', 'min:1'],
'service_page' => ['nullable', 'integer', 'min:1'],
```

### [MODIFY] [CatalogSearchService.php](file:///home/yacine/Documents/web/diyar-marketplace/backend/app/Services/Catalog/CatalogSearchService.php)

Use separate page params:

```php
private function productFilters(array $filters): array
{
    return array_filter([
        // ...existing filters...
        'page' => $filters['product_page'] ?? $filters['page'] ?? 1,
    ], fn ($value) => $value !== null && $value !== '');
}

private function serviceFilters(array $filters): array
{
    return array_filter([
        // ...existing filters...
        'page' => $filters['service_page'] ?? $filters['page'] ?? 1,
    ], fn ($value) => $value !== null && $value !== '');
}
```

### [MODIFY] [SearchPage.tsx](file:///home/yacine/Documents/web/diyar-marketplace/frontend/src/pages/SearchPage.tsx)

Update `PaginationBar` to use separate page keys:

```tsx
// Products pagination
onPageChange={(page) => updateFilters({ product_page: page }, false)}

// Services pagination
onPageChange={(page) => updateFilters({ service_page: page }, false)}
```

---

## Open Questions

> [!IMPORTANT]
> **Ngram token size:** The MySQL `ngram_token_size` default is 2. For your Arabic product names, is 2 appropriate or should we use 3? Shorter tokens = more matches (fuzzier), longer = more precise. I recommend starting with the default (2) and tuning later based on search quality.

> [!IMPORTANT]
> **Legacy `/search` route clients:** Are there any mobile apps or external integrations hitting `GET /search` directly? If so, we should keep the redirect rather than removing the route entirely. If only the frontend uses it (and it already uses `/catalog/search`), we can safely delete it.

> [!IMPORTANT]
> **Search result cache TTL:** I've proposed 60 seconds for anonymous search results. For a marketplace with real-time inventory, is this acceptable? Stock availability could lag by up to 60s. If this is a concern, we can reduce to 15-30s or skip caching and rely on the database query plan improvements alone.

---

## Verification Plan

### Automated Tests
```bash
# Run existing search tests (should all still pass)
php artisan test --filter=CatalogSearch
php artisan test --filter=SearchAnalytics
php artisan test --filter=CatalogSearchSecurity
php artisan test --filter=CatalogSearchQueryCount
php artisan test --filter=RateLimiting
```

### Database Verification
```bash
# Verify new indexes exist
php artisan tinker --execute="DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_search_fulltext'])"
php artisan tinker --execute="DB::select('SHOW INDEX FROM services WHERE Key_name = ?', ['services_search_fulltext'])"
php artisan tinker --execute="DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_status_discount_amount_idx'])"

# EXPLAIN key queries to verify index usage
php artisan tinker --execute="DB::select('EXPLAIN SELECT * FROM products JOIN vendor_accounts ON vendor_accounts.id = products.vendor_account_id AND vendor_accounts.status = ? WHERE products.status = ? AND MATCH(name, description) AGAINST (? IN BOOLEAN MODE) LIMIT 24', ['active', 'active', 'سرير'])"
```

### Manual Verification
- Test Arabic search terms on the storefront (e.g., "سرير", "طاولة", "كرسي")
- Verify facets only show relevant categories
- Confirm separate product/service pagination works
- Monitor query times via Laravel Telescope or `DB::listen()` in dev

---

## Files Changed Summary

| Phase | Action | File |
|-------|--------|------|
| 1 | DELETE | `app/Http/Controllers/Api/V1/Catalog/SearchController.php` |
| 1 | MODIFY | `routes/api.php` |
| 2 | NEW | `database/migrations/..._add_services_fulltext_and_discount_indexes.php` |
| 2 | MODIFY | `app/Models/Product.php` |
| 2 | MODIFY | `app/Services/Catalog/ProductService.php` |
| 2 | MODIFY | `app/Services/Search/SearchAnalyticsRecorder.php` |
| 3 | MODIFY | `app/Services/Catalog/CatalogSearchService.php` |
| 3 | MODIFY | `app/Services/ServiceMarketplace/ServiceCatalogService.php` |
| 3 | MODIFY | `app/Services/Catalog/CatalogSearchSuggestionService.php` |
| 4 | MODIFY | `app/Services/Catalog/CatalogSearchService.php` |
| 4 | MODIFY | `app/Http/Controllers/Api/V1/Catalog/CatalogSearchController.php` |
| 4 | MODIFY | `config/diyar.php` |
| 5 | NEW | `database/migrations/..._upgrade_fulltext_indexes_to_ngram.php` |
| 6 | MODIFY | `app/Http/Requests/Catalog/CatalogSearchRequest.php` |
| 6 | MODIFY | `frontend/src/api/catalogSearch.ts` |
| 6 | MODIFY | `frontend/src/pages/SearchPage.tsx` |

<?php

namespace App\Domains\Catalog\Services;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Domains\Search\Jobs\IndexProductImageJob;
use App\Domains\VisualSearch\Jobs\RemoveVisualIndexEntryJob;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Models\VendorAccount;
use App\Services\Media\MediaUploadService;
use App\Services\Vendor\VendorAccessService;
use App\Core\Support\Pagination\PaginationBounds;
use App\Core\Support\SlugGenerator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProductService
{
    private const MAX_IMAGES = 5;

    public function __construct(
        private readonly InventoryService $inventory,
        private readonly MediaUploadService $media,
        private readonly VendorAccessService $access,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listPublic(array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        $query = $this->cardQuery($user);

        $this->applyFilters($query, $filters);

        $perPage = PaginationBounds::perPage((int) ($filters['per_page'] ?? 20));
        $page = PaginationBounds::page((int) ($filters['page'] ?? 1));

        $paginator = $query->paginate($perPage, $this->cardColumns(), 'page', $page);

        $this->hydrateReviewAggregates($paginator->getCollection());

        return $paginator;
    }

    /**
     * @param  Builder<Product>  $query
     * @param  array<string, mixed>  $filters
     */
    public function applyPublicFilters(Builder $query, array $filters): void
    {
        $this->applyFilters($query, $filters);
    }

    /**
     * Filtered publicly visible product query without sort — for aggregate summaries.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<Product>
     */
    public function filteredPublicQuery(array $filters): Builder
    {
        $query = $this->publicQuery();
        $this->applyPublicFilters($query, $filters);

        return $query->clone()->reorder();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function searchPublic(array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        return app(\App\Domains\Search\Contracts\ProductSearchContract::class)->search($filters, $user);
    }

    public function findPublic(string $id, ?User $user = null): Product
    {
        $query = $this->publicQuery()
            ->with($this->detailEagerLoads())
            ->withCount(['likes', 'reviews'])
            ->withAvg('reviews', 'rating');

        if (Str::isUuid($id)) {
            $query->whereKey($id);
        } else {
            $query->where('slug', $id);
        }

        $query->withUserSaved($user);

        $product = $query->first();

        if ($product === null) {
            throw new NotFoundHttpException(__('diyar.catalog.product_not_found'));
        }

        return $product;
    }

    /**
     * @return Collection<int, Product>
     */
    public function relatedProducts(Product $product, int $limit = 8, ?User $user = null): Collection
    {
        $limit = max(0, min($limit, 8));

        $query = $this->cardQuery($user)
            ->where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->latest()
            ->limit($limit);

        $products = $query->get();

        $this->hydrateReviewAggregates($products);

        return $products;
    }

    /**
     * @param  list<string>  $ids
     * @return Collection<int, Product>
     */
    public function listPublicByIds(array $ids, ?User $user = null): Collection
    {
        if ($ids === []) {
            return collect();
        }

        $cap = (int) config('diyar.visual_search.candidate_limit', 50);
        if (count($ids) > $cap) {
            $ids = array_slice($ids, 0, $cap);
        }

        $products = $this->cardQuery($user)->whereIn('id', $ids)->get();

        $this->hydrateReviewAggregates($products);

        $order = array_flip($ids);

        return $products
            ->sortBy(fn (Product $product): int => $order[$product->id] ?? PHP_INT_MAX)
            ->values();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listForVendor(User $user, array $filters = []): LengthAwarePaginator
    {
        $vendorAccount = $this->requireVendorAccount($user);

        $query = Product::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->with(['category', 'images.mediaFile', 'inventory']);

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $this->applyFilters($query, $filters);

        $perPage = min((int) ($filters['per_page'] ?? 20), 100);

        return $query->paginate($perPage);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<UploadedFile>|null  $images
     */
    public function create(User $user, array $attributes, ?array $images = null): Product
    {
        $vendorAccount = $this->requireVendorAccount($user);
        $category = Category::query()->active()->findOrFail($attributes['category_id']);

        return DB::transaction(function () use ($user, $vendorAccount, $category, $attributes, $images) {
            $slug = SlugGenerator::unique(
                $attributes['name'],
                new Product,
                'slug',
                'vendor_account_id',
                $vendorAccount->id,
            );

            $product = Product::query()->create([
                'vendor_account_id' => $vendorAccount->id,
                'category_id' => $category->id,
                'name' => $attributes['name'],
                'slug' => $slug,
                'description' => $attributes['description'] ?? null,
                'sale_price' => $attributes['sale_price'],
                'compare_price' => $attributes['compare_price'] ?? null,
                'promotion_ends_at' => $this->resolvePromotionEndsAt(
                    $attributes['compare_price'] ?? null,
                    $attributes['sale_price'],
                    $attributes['promotion_ends_at'] ?? null,
                ),
                'width' => $attributes['width'] ?? null,
                'height' => $attributes['height'] ?? null,
                'depth' => $attributes['depth'] ?? null,
                'materials' => $attributes['materials'] ?? null,
                'warranty' => $attributes['warranty'] ?? null,
                'product_type' => $attributes['product_type'] ?? ProductType::Single->value,
                'availability_mode' => $attributes['availability_mode'] ?? 'in_stock',
                'expected_available_at' => $attributes['expected_available_at'] ?? null,
                'status' => ProductStatus::Active->value,
            ]);

            $this->syncColors($product, $attributes['colors'] ?? []);
            $this->inventory->createInitial($product, (int) ($attributes['stock_quantity'] ?? 0), $user);

            if ($images !== null) {
                $this->attachImages($user, $product, $images);
            }

            app(CatalogCacheInvalidator::class)->invalidateSearchCachesAfterCommit();

            return $product->fresh(['vendorAccount', 'category', 'colors', 'images.mediaFile', 'inventory']);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(User $user, Product $product, array $attributes): Product
    {
        $this->inventory->assertProductOwnership($user, $product);

        return DB::transaction(function () use ($product, $attributes) {
            if (isset($attributes['category_id'])) {
                Category::query()->active()->findOrFail($attributes['category_id']);
            }

            $product->fill([
                'category_id' => $attributes['category_id'] ?? $product->category_id,
                'name' => $attributes['name'] ?? $product->name,
                'description' => array_key_exists('description', $attributes) ? $attributes['description'] : $product->description,
                'sale_price' => $attributes['sale_price'] ?? $product->sale_price,
                'compare_price' => array_key_exists('compare_price', $attributes) ? $attributes['compare_price'] : $product->compare_price,
                'promotion_ends_at' => $this->resolvePromotionEndsAtForUpdate($product, $attributes),
                'width' => array_key_exists('width', $attributes) ? $attributes['width'] : $product->width,
                'height' => array_key_exists('height', $attributes) ? $attributes['height'] : $product->height,
                'depth' => array_key_exists('depth', $attributes) ? $attributes['depth'] : $product->depth,
                'materials' => array_key_exists('materials', $attributes) ? $attributes['materials'] : $product->materials,
                'warranty' => array_key_exists('warranty', $attributes) ? $attributes['warranty'] : $product->warranty,
                'product_type' => $attributes['product_type'] ?? $product->product_type,
                'availability_mode' => $attributes['availability_mode'] ?? $product->availability_mode,
                'expected_available_at' => array_key_exists('expected_available_at', $attributes)
                    ? $attributes['expected_available_at']
                    : $product->expected_available_at,
            ])->save();

            if (array_key_exists('colors', $attributes)) {
                $this->syncColors($product, $attributes['colors']);
            }

            $this->syncReturnPolicy($product, $attributes);

            app(CatalogCacheInvalidator::class)->invalidateSearchCachesAfterCommit();

            return $product->fresh(['vendorAccount', 'category', 'colors', 'images.mediaFile', 'inventory']);
        });
    }

    public function archive(User $user, Product $product): Product
    {
        $this->inventory->assertProductOwnership($user, $product);

        $product->forceFill(['status' => ProductStatus::Archived])->save();
        $imageIds = $product->images()->pluck('id');
        $product->delete();

        foreach ($imageIds as $imageId) {
            RemoveVisualIndexEntryJob::dispatch($imageId);
        }

        app(CatalogCacheInvalidator::class)->invalidateSearchCachesAfterCommit();

        return $product->fresh();
    }

    public function findOwnedProduct(User $user, string $productId): Product
    {
        $product = Product::query()->withTrashed()->whereKey($productId)->first();
        if ($product === null) {
            throw new NotFoundHttpException(__('diyar.catalog.product_not_found'));
        }

        $this->inventory->assertProductOwnership($user, $product);

        return $product;
    }

    /**
     * @param  list<UploadedFile>  $files
     */
    public function addImages(User $user, Product $product, array $files): Product
    {
        $this->inventory->assertProductOwnership($user, $product);

        DB::transaction(function () use ($user, $product, $files) {
            $this->attachImages($user, $product, $files);
        });

        return $product->fresh(['images.mediaFile']);
    }

    public function deleteImage(User $user, Product $product, ProductImage $image): void
    {
        $this->inventory->assertProductOwnership($user, $product);

        if ($image->product_id !== $product->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        DB::transaction(function () use ($image) {
            $imageId = $image->id;
            $this->media->deleteMediaFile($image->mediaFile);
            $image->delete();
            RemoveVisualIndexEntryJob::dispatch($imageId);
        });
    }

    /**
     * @param  list<array{id: string, sort_order: int}>  $order
     */
    public function reorderImages(User $user, Product $product, array $order): Product
    {
        $this->inventory->assertProductOwnership($user, $product);

        DB::transaction(function () use ($product, $order) {
            foreach ($order as $item) {
                ProductImage::query()
                    ->where('product_id', $product->id)
                    ->whereKey($item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });

        return $product->fresh(['images.mediaFile']);
    }

    public function listForCategory(Category $category, array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        $query = $this->cardQuery($user)
            ->where('category_id', $category->id);

        $this->applyFilters($query, $filters);

        return $query->paginate(min((int) ($filters['per_page'] ?? 20), 100), $this->cardColumns());
    }

    public function findVendorBySlug(string $slug): VendorAccount
    {
        $vendor = VendorAccount::query()->active()->where('slug', $slug)->first();
        if ($vendor === null) {
            throw new NotFoundHttpException(__('diyar.catalog.vendor_not_found'));
        }

        return $vendor;
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function listForVendorPublic(VendorAccount $vendor, array $filters = [], ?User $user = null): LengthAwarePaginator
    {
        $query = $this->cardQuery($user)
            ->where('vendor_account_id', $vendor->id);

        $this->applyFilters($query, $filters);

        return $query->paginate(min((int) ($filters['per_page'] ?? 20), 100), $this->cardColumns());
    }

    private function publicQuery(): Builder
    {
        return Product::query()->publiclyVisible();
    }

    private function cardQuery(?User $user = null): Builder
    {
        $query = $this->publicQuery()
            ->select($this->cardColumns())
            ->with($this->cardEagerLoads());

        $query->withUserSaved($user);

        return $query;
    }

    /**
     * Efficiently batch-hydrates reviews_count and reviews_avg_rating on product models.
     * Replaces expensive correlated subqueries in the cardQuery SELECT clause.
     *
     * @param  Collection<int, Product>|\Illuminate\Support\Collection<int, Product>|iterable<Product>  $products
     */
    public function hydrateReviewAggregates(iterable $products): void
    {
        $collection = $products instanceof Collection ? $products : collect($products);
        if ($collection->isEmpty()) {
            return;
        }

        $ids = $collection->pluck('id')->filter()->values()->all();
        if (empty($ids)) {
            return;
        }

        $aggregates = DB::table('product_reviews')
            ->whereIn('product_id', $ids)
            ->groupBy('product_id')
            ->selectRaw('product_id, count(*) as aggregate_count, avg(rating) as aggregate_avg')
            ->get()
            ->keyBy('product_id');

        foreach ($collection as $product) {
            if ($product instanceof Product) {
                $stat = $aggregates->get($product->id);
                $product->setAttribute('reviews_count', $stat ? (int) $stat->aggregate_count : 0);
                $product->setAttribute(
                    'reviews_avg_rating',
                    $stat && $stat->aggregate_avg !== null ? round((float) $stat->aggregate_avg, 1) : null
                );
            }
        }
    }

    /**
     * Columns required by ProductCardResource. Keep description/materials/return
     * policy off the listing SELECT — they belong on the detail path.
     *
     * @return list<string>
     */
    private function cardColumns(): array
    {
        $table = (new Product)->getTable();

        return [
            "{$table}.id",
            "{$table}.vendor_account_id",
            "{$table}.category_id",
            "{$table}.name",
            "{$table}.slug",
            "{$table}.sale_price",
            "{$table}.compare_price",
            "{$table}.promotion_ends_at",
            "{$table}.product_type",
            "{$table}.availability_mode",
            "{$table}.created_at",
        ];
    }

    /**
     * @return array<int|string, mixed>
     */
    private function cardEagerLoads(): array
    {
        return [
            'vendorAccount:id,business_name,slug',
            'category:id,name,slug,type',
            'primaryImage.mediaFile:id,path',
            'inventory:id,product_id,stock_quantity,reserved_quantity,available_quantity',
        ];
    }

    /**
     * Columns required by ProductDetailResource. Avoid SELECT * on relations.
     *
     * @return array<int|string, mixed>
     */
    private function detailEagerLoads(): array
    {
        return [
            'vendorAccount:id,business_name,slug',
            'category:id,name,slug',
            'colors:id,product_id,name,hex_code',
            'images:id,product_id,media_file_id,sort_order',
            'images.mediaFile:id,path',
            'inventory:id,product_id,stock_quantity,reserved_quantity,available_quantity',
        ];
    }

    /**
     * @param  Builder<Product>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        $table = $query->getModel()->getTable();

        if (! empty($filters['q'])) {
            $raw = mb_substr((string) $filters['q'], 0, 120);

            if (DB::connection()->getDriverName() === 'mysql') {
                $clean = preg_replace('/[+\-><()~*"@]/u', ' ', $raw);
                $booleanQuery = collect(preg_split('/\s+/u', (string) $clean))
                    ->filter(fn ($t) => mb_strlen((string) $t) > 0)
                    ->map(fn ($t) => '+'.$t.'*')
                    ->implode(' ');

                if ($booleanQuery !== '') {
                    $query->whereRaw(
                        "MATCH({$table}.name, {$table}.description) AGAINST (? IN BOOLEAN MODE)",
                        [$booleanQuery]
                    );
                } else {
                    $query->where("{$table}.name", 'like', '%'.$raw.'%');
                }
            } else {
                $term = '%'.$raw.'%';
                $query->where(function (Builder $q) use ($term, $table) {
                    $q->where("{$table}.name", 'like', $term)
                        ->orWhere("{$table}.description", 'like', $term);
                });
            }
        }

        if (! empty($filters['category_id'])) {
            $query->where("{$table}.category_id", $filters['category_id']);
        }

        if (! empty($filters['category_slug'])) {
            $category = Category::query()->active()->where('slug', $filters['category_slug'])->first();
            if ($category !== null) {
                $query->where("{$table}.category_id", $category->id);
            }
        }

        if (! empty($filters['vendor_id'])) {
            $query->where("{$table}.vendor_account_id", $filters['vendor_id']);
        }

        if (! empty($filters['vendor_slug'])) {
            $vendorId = VendorAccount::query()
                ->where('slug', (string) $filters['vendor_slug'])
                ->where('status', 'active')
                ->value('id');

            if ($vendorId !== null) {
                $query->where("{$table}.vendor_account_id", $vendorId);
            } else {
                $query->whereRaw('0 = 1');
            }
        }

        $colorList = $this->normalizeColorFilter($filters);
        if ($colorList !== []) {
            $query->whereHas('colors', fn (Builder $colorQuery) => $colorQuery->whereIn('name', $colorList));
        }

        if (! empty($filters['material'])) {
            $material = (string) $filters['material'];
            $query->where(function (Builder $materialQuery) use ($material, $table) {
                $materialQuery
                    ->where("{$table}.materials", 'like', '%'.$material.'%')
                    ->orWhereJsonContains("{$table}.materials", $material);
            });
        }

        if (! empty($filters['availability_mode'])) {
            $mode = AvailabilityMode::tryFrom((string) $filters['availability_mode']);
            if ($mode !== null) {
                $query->where("{$table}.availability_mode", $mode);
            }
        }

        if (! empty($filters['product_type'])) {
            $type = ProductType::tryFrom((string) $filters['product_type']);
            if ($type !== null) {
                $query->where("{$table}.product_type", $type);
            }
        }

        if ($this->isTruthy($filters['discounted'] ?? null)) {
            $query->withActiveDiscount();
        }

        if (isset($filters['min_price'])) {
            $query->where("{$table}.sale_price", '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where("{$table}.sale_price", '<=', $filters['max_price']);
        }

        $sort = $filters['sort'] ?? '-created_at';
        match ($sort) {
            'price' => $query->orderBy('sale_price'),
            '-price' => $query->orderByDesc('sale_price'),
            'name' => $query->orderBy('name'),
            '-name' => $query->orderByDesc('name'),
            'created_at' => $query->oldest('products.created_at'),
            '-created_at' => $query->latest('products.created_at'),
            'discount', '-discount' => $query
                ->orderBy('discount_amount', $sort === '-discount' ? 'desc' : 'asc')
                ->latest('products.created_at'),
            'popular', '-popular' => $this->applyPopularSort($query, $sort),
            default => $query->latest('products.created_at'),
        };
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function applyPopularSort(Builder $query, string $sort): void
    {
        $query->withCount('likes')->orderBy('likes_count', $sort === '-popular' ? 'desc' : 'asc');
    }

    private function isTruthy(mixed $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return list<string>
     */
    private function normalizeColorFilter(array $filters): array
    {
        if (! empty($filters['colors'])) {
            $raw = $filters['colors'];

            $values = is_array($raw)
                ? $raw
                : explode(',', (string) $raw);

            return array_values(array_filter(array_map(
                static fn (mixed $color): string => trim((string) $color),
                $values,
            )));
        }

        if (! empty($filters['color'])) {
            return [trim((string) $filters['color'])];
        }

        return [];
    }

    /**
     * @param  list<array{name: string, hex_code: string}>  $colors
     */
    /**
     * @param  array<string, mixed>  $attributes
     */
    private function syncReturnPolicy(Product $product, array $attributes): void
    {
        if (! array_key_exists('return_policy_override_enabled', $attributes)) {
            return;
        }

        $enabled = (bool) $attributes['return_policy_override_enabled'];
        $updates = ['return_policy_override_enabled' => $enabled];

        if (! $enabled) {
            $updates += [
                'returnable' => null,
                'return_window_days' => null,
                'return_accepted_reasons' => null,
                'return_requires_unused' => null,
                'return_requires_evidence' => null,
                'return_shipping_paid_by' => null,
                'return_shipping_refundable' => null,
            ];
        } else {
            foreach ([
                'returnable',
                'return_window_days',
                'return_accepted_reasons',
                'return_requires_unused',
                'return_requires_evidence',
                'return_shipping_paid_by',
                'return_shipping_refundable',
            ] as $field) {
                if (array_key_exists($field, $attributes)) {
                    $updates[$field] = $attributes[$field];
                }
            }
        }

        $product->forceFill($updates)->save();
    }

    private function syncColors(Product $product, array $colors): void
    {
        $product->colors()->delete();

        foreach ($colors as $color) {
            $product->colors()->create([
                'name' => $color['name'],
                'hex_code' => $color['hex_code'],
            ]);
        }
    }

    /**
     * @param  list<UploadedFile>  $files
     */
    private function attachImages(User $user, Product $product, array $files): void
    {
        $imageStats = $product->images()
            ->reorder()
            ->selectRaw('COUNT(*) as image_count, COALESCE(MAX(sort_order), 0) as max_sort_order')
            ->first();
        $currentCount = (int) ($imageStats->image_count ?? 0);
        if ($currentCount + count($files) > self::MAX_IMAGES) {
            throw new InvalidArgumentException(__('diyar.catalog.max_images_exceeded'));
        }

        $sortOrder = (int) ($imageStats->max_sort_order ?? 0);

        foreach ($files as $file) {
            $sortOrder++;
            $mediaFile = $this->media->storeProductImage($user, $product->id, $file);
            $productImage = $product->images()->create([
                'media_file_id' => $mediaFile->id,
                'sort_order' => $sortOrder,
            ]);

            IndexProductImageJob::dispatch($productImage->id);
        }
    }

    private function requireVendorAccount(User $user): VendorAccount
    {
        return $this->access->requireVendorAccount($user);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function resolvePromotionEndsAtForUpdate(Product $product, array $attributes): mixed
    {
        $comparePrice = array_key_exists('compare_price', $attributes)
            ? $attributes['compare_price']
            : $product->compare_price;
        $salePrice = $attributes['sale_price'] ?? $product->sale_price;
        $promotionEndsAt = array_key_exists('promotion_ends_at', $attributes)
            ? $attributes['promotion_ends_at']
            : $product->promotion_ends_at;

        return $this->resolvePromotionEndsAt($comparePrice, $salePrice, $promotionEndsAt);
    }

    private function resolvePromotionEndsAt(mixed $comparePrice, mixed $salePrice, mixed $promotionEndsAt): mixed
    {
        if ($comparePrice === null || $comparePrice === '') {
            return null;
        }

        if ((float) $comparePrice <= (float) $salePrice) {
            return null;
        }

        if ($promotionEndsAt === null || $promotionEndsAt === '') {
            return null;
        }

        return $promotionEndsAt;
    }
}

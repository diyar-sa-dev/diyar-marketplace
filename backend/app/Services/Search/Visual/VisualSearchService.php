<?php

namespace App\Services\Search\Visual;

use App\Http\Resources\ProductCardResource;
use App\Jobs\Search\RecordVisualSearchEventJob;
use App\Models\Product;
use App\Models\User;
use App\Models\VisualIndexEntry;
use App\Services\Catalog\ProductService;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Cache\CacheKeys;
use App\Support\Cache\StampedeSafeCache;
use App\Support\Pagination\PaginationBounds;
use App\Support\Vendor\VendorOwnership;
use App\Support\VisualSearch\Dhash64Generator;
use App\Support\VisualSearch\ProductSimilarityAggregator;
use App\Support\VisualSearch\VisualHashBits;
use App\Support\VisualSearch\VisualSearchCandidate;
use App\Support\VisualSearch\VisualSearchRanker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Throwable;

final class VisualSearchService
{
    public function __construct(
        private readonly Dhash64Generator $generator,
        private readonly VisualCandidateRetriever $retriever,
        private readonly ProductSimilarityAggregator $aggregator,
        private readonly VisualSearchRanker $ranker,
        private readonly ProductService $products,
        private readonly VendorOwnership $vendorOwnership,
        private readonly EffectiveConfigService $config,
    ) {}

    /**
     * @return array{
     *   items: list<array<string, mixed>>,
     *   pagination: array<string, int>,
     *   meta: array<string, mixed>
     * }
     */
    public function search(
        UploadedFile $image,
        int $page = 1,
        int $perPage = 20,
        ?User $user = null,
        ?string $sessionKey = null,
    ): array {
        $startedAt = hrtime(true);
        $this->assertAvailable();

        $path = $image->getRealPath();
        if ($path === false || $path === '') {
            throw new ServiceUnavailableHttpException(__('diyar.visual_search.invalid_upload'));
        }

        $representationVersion = (string) config('diyar.visual_search.representation_version', 'dhash-64-v1');
        $hashBits = $this->generator->fromFilePath($path);
        $fingerprint = VisualHashBits::queryFingerprint($hashBits, $representationVersion);

        $cacheKey = CacheKeys::visualSearchResult($fingerprint);
        $cacheTtl = (int) config('diyar.visual_search.cache_ttl_seconds', 300);
        $cacheStatus = 'miss';

        try {
            $cached = Cache::get($cacheKey);
            if (is_array($cached)) {
                $cacheStatus = 'hit';
            }
        } catch (Throwable) {
            $cached = null;
        }

        if (! is_array($cached)) {
            $cached = StampedeSafeCache::remember($cacheKey, $cacheTtl, fn (): array => $this->buildRankedResults($hashBits));
        }

        $ranked = $cached['ranked'] ?? [];
        $searchId = (string) Str::uuid();
        $page = PaginationBounds::page($page);
        $perPage = min(
            PaginationBounds::perPage($perPage),
            (int) config('diyar.catalog.pagination.max_per_page', 50),
        );

        $total = count($ranked);
        $offset = ($page - 1) * $perPage;
        $pageSlice = array_slice($ranked, $offset, $perPage);
        $productIds = array_column($pageSlice, 'product_id');
        $similarityMap = [];
        foreach ($pageSlice as $row) {
            $similarityMap[$row['product_id']] = $row['similarity'];
        }

        $ownedVendorId = $user !== null ? $this->vendorOwnership->userVendorAccountId($user) : null;
        request()->attributes->set('visual_search_vendor_account_id', $ownedVendorId);

        $products = $this->products->listPublicByIds($productIds, $user);
        $items = [];

        foreach ($products as $product) {
            $card = (new ProductCardResource($product))->toArray(request());
            $card['similarity'] = round($similarityMap[$product->id] ?? 0.0, 2);
            $items[] = $card;
        }

        $pageItemCount = count($items);
        $meta = [
            'search_id' => $searchId,
            'engine_version' => (string) config('diyar.visual_search.engine_version', 'perceptual-v1'),
            'representation_version' => $representationVersion,
            'ranking_version' => (string) config('diyar.visual_search.ranking_version', 'ranking-v1'),
            'index_version' => (string) config('diyar.visual_search.index_version', 'catalog-v1'),
            'result_count' => $total,
            'cache' => $cacheStatus,
        ];

        RecordVisualSearchEventJob::dispatch(
            searchId: $searchId,
            queryFingerprint: $fingerprint,
            resultCount: $total,
            userId: $user?->id,
            sessionKey: $sessionKey,
        );

        $durationMs = (hrtime(true) - $startedAt) / 1_000_000;
        Log::info('visual_search.search.completed', [
            'search_id' => $searchId,
            'cache' => $cacheStatus,
            'candidate_count' => $total,
            'page_item_count' => $pageItemCount,
            'duration_ms' => round($durationMs, 2),
            'fingerprint_prefix' => substr($fingerprint, 0, 8),
        ]);

        return [
            'items' => $items,
            'pagination' => [
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($total / max($perPage, 1))),
                'per_page' => $perPage,
                'total' => $total,
            ],
            'meta' => $meta,
        ];
    }

    /**
     * @return array{ranked: list<array{product_id: string, similarity: float}>, versions: array<string, string>}
     */
    private function buildRankedResults(string $queryHashBits): array
    {
        $maxHamming = (int) config('diyar.visual_search.max_hamming_distance', 19);
        $minSimilarity = max(
            0.1,
            min(
                1.0,
                $this->config->decimal(
                    'feature.visual_search_min_similarity',
                    (float) config('diyar.visual_search.min_similarity', 0.90),
                ),
            ),
        );
        $candidateLimit = (int) config('diyar.visual_search.candidate_limit', 50);

        $imageCandidates = $this->retriever->retrieve($queryHashBits, $maxHamming);
        $productCandidates = $this->aggregator->aggregate($imageCandidates);
        $ranked = $this->ranker->rank($productCandidates);

        $ranked = array_values(array_filter(
            $ranked,
            static fn (VisualSearchCandidate $candidate): bool => $candidate->similarity >= $minSimilarity,
        ));

        if ($ranked !== []) {
            $rankedProductIds = array_map(static fn (VisualSearchCandidate $c): string => $c->productId, $ranked);
            $visibleIds = Product::query()
                ->publiclyVisible()
                ->whereIn('id', $rankedProductIds)
                ->pluck('id')
                ->all();
            $visibleSet = array_flip($visibleIds);
            $ranked = array_values(array_filter(
                $ranked,
                static fn (VisualSearchCandidate $candidate): bool => isset($visibleSet[$candidate->productId]),
            ));
        }

        $ranked = array_slice($ranked, 0, $candidateLimit);

        return [
            'ranked' => array_map(
                static fn (VisualSearchCandidate $candidate): array => [
                    'product_id' => $candidate->productId,
                    'similarity' => round($candidate->similarity, 4),
                ],
                $ranked,
            ),
            'versions' => [
                'engine_version' => (string) config('diyar.visual_search.engine_version', 'perceptual-v1'),
                'representation_version' => (string) config('diyar.visual_search.representation_version', 'dhash-64-v1'),
                'ranking_version' => (string) config('diyar.visual_search.ranking_version', 'ranking-v1'),
                'index_version' => (string) config('diyar.visual_search.index_version', 'catalog-v1'),
            ],
        ];
    }

    private function assertAvailable(): void
    {
        if (! config('diyar.feature.visual_search_enabled', true)
            || ! config('diyar.visual_search.enabled', true)) {
            throw new ServiceUnavailableHttpException(__('diyar.visual_search.disabled'));
        }

        if (! extension_loaded('gd')) {
            throw new ServiceUnavailableHttpException(__('diyar.visual_search.unavailable'));
        }

        if (! Schema::hasTable('visual_index_entries')) {
            throw new ServiceUnavailableHttpException(__('diyar.visual_search.unavailable'));
        }

        if (! VisualIndexEntry::query()->where('is_active', true)->exists()) {
            throw new ServiceUnavailableHttpException(__('diyar.visual_search.index_empty'));
        }
    }
}

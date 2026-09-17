<?php

namespace App\Services\Search\Visual;

use App\Models\VisualIndexEntry;
use App\Support\VisualSearch\BucketProbe;
use App\Support\VisualSearch\VisualHashBits;
use App\Support\VisualSearch\VisualSearchCandidate;
use Illuminate\Support\Facades\Schema;

final class VisualCandidateRetriever
{
    /**
     * @return list<VisualSearchCandidate>
     */
    public function retrieve(string $queryHashBits, int $maxHamming): array
    {
        if (! Schema::hasTable('visual_index_entries')) {
            return [];
        }

        $queryBucket = VisualHashBits::bucketFromHashBits($queryHashBits);
        $probeRadius = (int) config('diyar.visual_search.bucket_probe_radius', 3);
        $buckets = BucketProbe::probeBuckets($queryBucket, $probeRadius);
        $prefetchCap = (int) config('diyar.visual_search.sql_prefetch_cap', 1500);
        $indexVersion = (string) config('diyar.visual_search.index_version', 'catalog-v1');

        if ($buckets === []) {
            return [];
        }

        $rows = VisualIndexEntry::query()
            ->select(['id', 'product_id', 'product_image_id', 'media_file_id', 'hash_bits'])
            ->where('is_active', true)
            ->where('index_version', $indexVersion)
            ->whereIn('hash_bucket', $buckets)
            ->limit($prefetchCap)
            ->get();

        $candidates = [];

        foreach ($rows as $row) {
            $storedHash = (string) $row->getRawOriginal('hash_bits');
            $distance = VisualHashBits::hammingDistance($queryHashBits, $storedHash);

            if ($distance > $maxHamming) {
                continue;
            }

            $candidates[] = new VisualSearchCandidate(
                productId: $row->product_id,
                productImageId: $row->product_image_id,
                mediaFileId: $row->media_file_id,
                hammingDistance: $distance,
                similarity: VisualHashBits::similarity($queryHashBits, $storedHash),
            );
        }

        usort($candidates, static fn (VisualSearchCandidate $a, VisualSearchCandidate $b): int => $a->hammingDistance <=> $b->hammingDistance);

        return $candidates;
    }
}

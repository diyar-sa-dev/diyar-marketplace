<?php

namespace App\Jobs\Search;

use App\Models\ProductImage;
use App\Services\Search\Visual\VisualIndexingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class IndexProductImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $productImageId,
    ) {}

    public function handle(VisualIndexingService $indexing): void
    {
        $productImage = ProductImage::query()->find($this->productImageId);
        if ($productImage === null) {
            return;
        }

        $indexing->indexProductImage($productImage);
    }
}

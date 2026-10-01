<?php

namespace App\Domains\VisualSearch\Jobs;

use App\Domains\VisualSearch\Services\VisualIndexingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class RemoveVisualIndexEntryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly string $productImageId,
    ) {}

    public function handle(VisualIndexingService $indexing): void
    {
        $indexing->deactivateForProductImage($this->productImageId);
    }
}

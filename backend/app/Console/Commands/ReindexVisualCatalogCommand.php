<?php

namespace App\Console\Commands;

use App\Jobs\Search\IndexProductImageJob;
use App\Models\ProductImage;
use Illuminate\Console\Command;

final class ReindexVisualCatalogCommand extends Command
{
    protected $signature = 'visual-search:reindex {--chunk=100 : Product images per dispatch batch}';

    protected $description = 'Dispatch visual index jobs for all product images';

    public function handle(): int
    {
        $chunk = max(1, (int) $this->option('chunk'));
        $count = 0;

        ProductImage::query()
            ->orderBy('id')
            ->chunkById($chunk, function ($images) use (&$count): void {
                foreach ($images as $image) {
                    IndexProductImageJob::dispatch($image->id);
                    $count++;
                }
            });

        $this->info("Dispatched {$count} visual index jobs.");

        return self::SUCCESS;
    }
}

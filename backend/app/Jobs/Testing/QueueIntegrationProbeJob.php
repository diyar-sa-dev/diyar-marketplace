<?php

namespace App\Jobs\Testing;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

/**
 * Probe job for queue worker integration tests.
 */
final class QueueIntegrationProbeJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly string $token,
    ) {}

    public function handle(): void
    {
        Cache::put("queue:integration:probe:{$this->token}", now()->timestamp, 120);
    }
}

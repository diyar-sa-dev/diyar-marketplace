<?php

namespace App\Jobs\Payments;

use App\Services\Payments\PaymentWebhookEventProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class ProcessPaymentWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [10, 30, 60, 120, 300];

    public function __construct(
        public readonly string $webhookEventId,
        public readonly ?string $correlationId = null,
    ) {}

    public function handle(PaymentWebhookEventProcessor $processor): void
    {
        $processor->process($this->webhookEventId);
    }
}

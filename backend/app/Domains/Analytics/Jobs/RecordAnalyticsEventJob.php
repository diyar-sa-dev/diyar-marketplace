<?php

namespace App\Domains\Analytics\Jobs;

use App\Domains\Analytics\Services\AnalyticsEventRecorder;
use App\Enums\AnalyticsEventType;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use InvalidArgumentException;
use Throwable;

final class RecordAnalyticsEventJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly string $eventType,
        public readonly ?string $userId,
        public readonly ?string $sessionId,
        public readonly ?string $subjectType,
        public readonly ?string $subjectId,
        public readonly ?string $vendorAccountId,
        public readonly ?string $providerAccountId,
        public readonly array $payload,
        public readonly string $occurredAtIso,
    ) {
        $this->onQueue('default');
    }

    public function handle(AnalyticsEventRecorder $recorder): void
    {
        $type = AnalyticsEventType::tryFrom($this->eventType);
        if ($type === null) {
            throw new InvalidArgumentException('Unknown analytics event type: '.$this->eventType);
        }

        try {
            $recorder->record(
                $type,
                sessionId: $this->sessionId,
                subjectType: $this->subjectType,
                subjectId: $this->subjectId,
                vendorAccountId: $this->vendorAccountId,
                providerAccountId: $this->providerAccountId,
                payload: $this->payload,
                userId: $this->userId,
                occurredAt: CarbonImmutable::parse($this->occurredAtIso),
            );
        } catch (Throwable $exception) {
            report($exception);

            throw $exception;
        }
    }
}

<?php

namespace App\Console\Commands;

use App\Services\Outbox\DomainOutboxProcessor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

final class ProcessDomainOutboxCommand extends Command
{
    protected $signature = 'outbox:process {--limit=100 : Max events per run}';

    protected $description = 'Claim and process pending domain outbox events';

    public function handle(DomainOutboxProcessor $processor): int
    {
        $lock = Cache::lock('outbox:process', 55);

        if (! $lock->get()) {
            $this->warn('Another outbox processor is running.');

            return self::SUCCESS;
        }

        try {
            $maxAttempts = (int) config('diyar.outbox.max_attempts', 8);
            $backoff = config('diyar.outbox.backoff', [5, 15, 30, 60, 120, 300, 600, 1200]);
            $events = $processor->claimBatch((int) $this->option('limit'));
            $processed = 0;
            $failed = 0;

            foreach ($events as $event) {
                try {
                    $processor->process($event);
                    $processor->markProcessed($event);
                    $processed++;
                } catch (Throwable $exception) {
                    if ($event->attempts >= $maxAttempts) {
                        $processor->markDeadLetter($event, $exception);
                        $failed++;
                        $this->error("Outbox event {$event->id} moved to dead letter: {$exception->getMessage()}");

                        continue;
                    }

                    $index = max(0, min($event->attempts - 1, count($backoff) - 1));
                    $delay = is_array($backoff) ? (int) ($backoff[$index] ?? 60) : 60;
                    $processor->markRetry($event, $exception, $delay);
                    $failed++;
                }
            }

            $this->info("Processed {$processed} outbox event(s); {$failed} failed/retrying.");

            return self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}

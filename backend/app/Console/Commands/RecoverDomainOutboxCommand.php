<?php

namespace App\Console\Commands;

use App\Services\Outbox\DomainOutboxProcessor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class RecoverDomainOutboxCommand extends Command
{
    protected $signature = 'outbox:recover';

    protected $description = 'Recover outbox events stuck in processing state';

    public function handle(DomainOutboxProcessor $processor): int
    {
        $lock = Cache::lock('outbox:recover', 300);

        if (! $lock->get()) {
            $this->warn('Another outbox recovery is running.');

            return self::SUCCESS;
        }

        try {
            $recovered = $processor->recoverExpiredLeases();
            $this->info("Recovered {$recovered} expired outbox lease(s).");

            return self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}

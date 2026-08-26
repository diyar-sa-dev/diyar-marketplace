<?php

namespace App\Console\Commands;

use App\Services\Notifications\NotificationDeliveryRecoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class ReconcileNotificationDeliveriesCommand extends Command
{
    protected $signature = 'notifications:reconcile-deliveries {--minutes=30 : Stuck processing threshold}';

    protected $description = 'Recover stuck deliveries, re-dispatch due retries, and expire abandoned retries';

    public function handle(NotificationDeliveryRecoveryService $recovery): int
    {
        $lock = Cache::lock('notifications:reconcile-deliveries', 600);

        if (! $lock->get()) {
            $this->warn('Another reconciliation run is in progress.');

            return self::SUCCESS;
        }

        try {
            $result = $recovery->reconcile((int) $this->option('minutes'));

            $this->info(sprintf(
                'Reset %d stuck processing deliveries; re-dispatched %d due retries; marked %d expired retries as failed.',
                $result['reset'],
                $result['redispatched'],
                $result['expired'],
            ));
        } finally {
            $lock->release();
        }

        return self::SUCCESS;
    }
}

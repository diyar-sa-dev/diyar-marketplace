<?php

namespace App\Console\Commands;

use App\Services\Payments\PaymentReconciliationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ReconcilePaymentsCommand extends Command
{
    protected $signature = 'payments:reconcile {--minutes=30 : Stuck submitted-payment threshold} {--batch=100 : Payments per run}';

    protected $description = 'Reconcile stuck or uncertain payments against provider status APIs';

    public function handle(PaymentReconciliationService $reconciliation): int
    {
        $lock = Cache::lock('payments:reconcile', 600);

        if (! $lock->get()) {
            $this->warn('Another reconciliation run is in progress.');

            return self::SUCCESS;
        }

        try {
            $result = $reconciliation->reconcile(
                (int) $this->option('minutes'),
                (int) $this->option('batch'),
            );

            $this->info(sprintf(
                'Payments reconciliation complete: scanned=%d reconciled=%d failed=%d skipped=%d',
                $result['scanned'],
                $result['reconciled'],
                $result['failed'],
                $result['skipped'],
            ));

            return self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}

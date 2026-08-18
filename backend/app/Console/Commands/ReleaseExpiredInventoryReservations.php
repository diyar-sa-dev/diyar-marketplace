<?php

namespace App\Console\Commands;

use App\Services\Catalog\InventoryService;
use Illuminate\Console\Command;

class ReleaseExpiredInventoryReservations extends Command
{
    protected $signature = 'inventory:release-expired';

    protected $description = 'Release inventory reservations that have passed their expiration time';

    public function handle(InventoryService $inventory): int
    {
        $expired = $inventory->releaseExpiredReservations();
        $stale = $inventory->releaseStaleOrderReservations();

        $this->info("Released {$expired} expired reservation(s) and {$stale} stale order reservation(s).");

        return self::SUCCESS;
    }
}

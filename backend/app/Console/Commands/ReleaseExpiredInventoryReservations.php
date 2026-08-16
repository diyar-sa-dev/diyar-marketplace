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
        $count = $inventory->releaseExpiredReservations();

        $this->info("Released {$count} expired reservation(s).");

        return self::SUCCESS;
    }
}

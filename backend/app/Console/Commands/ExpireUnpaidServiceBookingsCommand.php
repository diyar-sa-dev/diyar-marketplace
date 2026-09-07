<?php

namespace App\Console\Commands;

use App\Services\ServiceMarketplace\ServiceBookingService;
use Illuminate\Console\Command;

final class ExpireUnpaidServiceBookingsCommand extends Command
{
    protected $signature = 'service-bookings:expire-unpaid';

    protected $description = 'Cancel unpaid service bookings whose payment window has expired';

    public function handle(ServiceBookingService $bookings): int
    {
        $expired = $bookings->expireDueUnpaidBookings();

        $this->info("Expired {$expired} unpaid service booking(s).");

        return self::SUCCESS;
    }
}

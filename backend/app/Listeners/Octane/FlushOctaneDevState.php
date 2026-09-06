<?php

namespace App\Listeners\Octane;

use App\Infrastructure\Mail\LogEmailOtpProvider;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Services\Payments\Gateways\FakePaymentGateway;
use Laravel\Octane\Contracts\OperationTerminated;

/**
 * Clears dev/test static stores that survive across Octane requests.
 */
final class FlushOctaneDevState
{
    public function handle(OperationTerminated $event): void
    {
        if (app()->environment('production')) {
            return;
        }

        LogSmsProvider::flush();
        LogEmailOtpProvider::flush();

        if (config('diyar.payments.use_fake_gateway')) {
            FakePaymentGateway::reset();
        }
    }
}

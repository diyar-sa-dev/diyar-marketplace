<?php

namespace Tests\Concerns;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Services\PaymentGatewayManager;
use Tests\Fakes\FakePaymentGateway;

trait InteractsWithPayments
{
    protected function fakePaymentGateway(): FakePaymentGateway
    {
        FakePaymentGateway::reset();

        config(['diyar.payments.use_fake_gateway' => true]);

        $fake = new FakePaymentGateway;
        $this->app->instance(PaymentGatewayInterface::class, $fake);
        $this->app->instance(PaymentGatewayManager::class, new PaymentGatewayManager($fake));

        return $fake;
    }
}

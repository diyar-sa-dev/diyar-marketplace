<?php

namespace Tests\Concerns;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Services\Payments\PaymentGatewayManager;
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

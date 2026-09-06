<?php

namespace App\Services\Payments;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Services\Payments\Exceptions\PaymentGatewayException;

final class PaymentGatewayManager
{
    public function __construct(
        private readonly PaymentGatewayInterface $gateway,
    ) {}

    public function driver(?string $name = null): PaymentGatewayInterface
    {
        if (config('diyar.payments.use_fake_gateway')) {
            return $this->gateway;
        }

        $name ??= (string) config('diyar.payments.gateway', 'myfatoorah');

        if ($name !== $this->gateway->name()) {
            throw PaymentGatewayException::configuration(__('diyar.payment.unsupported_gateway'));
        }

        return $this->gateway;
    }
}

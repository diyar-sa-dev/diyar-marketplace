<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentCreationResult
{
    public function __construct(
        public string $paymentUrl,
        public ?string $gatewayPaymentId,
        public ?string $gatewayInvoiceId,
    ) {}
}

<?php

namespace App\Domains\Payments\Services\DTO;

final readonly class PaymentCreationResult
{
    public function __construct(
        public string $paymentUrl,
        public ?string $gatewayPaymentId,
        public ?string $gatewayInvoiceId,
    ) {}
}

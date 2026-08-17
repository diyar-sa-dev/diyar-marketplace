<?php

namespace App\Services\Payments\DTO;

use App\Enums\PaymentStatus;

final readonly class PaymentDetailsResult
{
    public function __construct(
        public PaymentStatus $status,
        public string $amount,
        public string $currency,
        public string $paymentReference,
        public ?string $gatewayPaymentId,
        public ?string $gatewayInvoiceId,
        public ?string $failureReason = null,
    ) {}
}

<?php

namespace App\Domains\Payments\Services\DTO;

final readonly class PaymentSessionRequest
{
    /**
     * @param  array<string, string>  $metadata
     */
    public function __construct(
        public string $paymentReference,
        public string $orderNumber,
        public string $amount,
        public string $currency,
        public string $customerName,
        public ?string $customerEmail,
        public string $customerMobile,
        public string $mobileCountryCode,
        public string $language,
        public string $callbackUrl,
        public string $errorUrl,
        public array $metadata = [],
    ) {}
}

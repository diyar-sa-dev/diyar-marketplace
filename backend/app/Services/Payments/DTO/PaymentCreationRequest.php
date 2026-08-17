<?php

namespace App\Services\Payments\DTO;

final readonly class PaymentCreationRequest
{
    /**
     * @param  array<string, string>  $metadata
     * @param  list<array{supplier_code: int|string, invoice_share: float|string, proposed_share?: float|string}>  $suppliers
     */
    public function __construct(
        public string $sessionId,
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
        public array $suppliers = [],
        public ?string $paymentMethod = null,
    ) {}
}

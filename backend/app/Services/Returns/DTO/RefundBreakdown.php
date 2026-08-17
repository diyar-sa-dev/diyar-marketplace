<?php

namespace App\Services\Returns\DTO;

final readonly class RefundBreakdown
{
    public function __construct(
        public string $itemsSubtotal,
        public string $vatAmount,
        public string $shippingAmount,
        public string $totalAmount,
        public string $vendorPayableReversal,
        public string $commissionReversal,
        public string $currency,
        public bool $shippingRefunded,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'items_subtotal' => $this->itemsSubtotal,
            'vat_amount' => $this->vatAmount,
            'shipping_amount' => $this->shippingAmount,
            'total_amount' => $this->totalAmount,
            'vendor_payable_reversal' => $this->vendorPayableReversal,
            'commission_reversal' => $this->commissionReversal,
            'currency' => $this->currency,
            'shipping_refunded' => $this->shippingRefunded,
        ];
    }
}

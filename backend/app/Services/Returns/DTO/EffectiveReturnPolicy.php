<?php

namespace App\Services\Returns\DTO;

final readonly class EffectiveReturnPolicy
{
    /**
     * @param  list<string>  $acceptedReasons
     */
    public function __construct(
        public bool $returnable,
        public int $returnWindowDays,
        public array $acceptedReasons,
        public bool $requiresUnused,
        public bool $requiresEvidence,
        public string $returnShippingPaidBy,
        public bool $shippingRefundable,
        public string $source,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'returnable' => $this->returnable,
            'return_window_days' => $this->returnWindowDays,
            'accepted_reasons' => $this->acceptedReasons,
            'requires_unused' => $this->requiresUnused,
            'requires_evidence' => $this->requiresEvidence,
            'return_shipping_paid_by' => $this->returnShippingPaidBy,
            'shipping_refundable' => $this->shippingRefundable,
            'source' => $this->source,
        ];
    }
}

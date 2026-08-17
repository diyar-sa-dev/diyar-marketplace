<?php

namespace App\Services\Finance\DTO;

final readonly class CommissionResolution
{
    public function __construct(
        public string $ratePercent,
        public string $commissionAmount,
        public string $commissionBase,
        public string $scope,
        public ?string $scopeId = null,
    ) {}
}

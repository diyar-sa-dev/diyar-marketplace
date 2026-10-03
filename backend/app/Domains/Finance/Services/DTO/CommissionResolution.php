<?php

namespace App\Domains\Finance\Services\DTO;

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

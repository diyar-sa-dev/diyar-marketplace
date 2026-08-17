<?php

namespace App\Contracts\Shipping;

/**
 * Future carrier integration boundary (Aramex, SMSA, DHL, etc.).
 *
 * V1 checkout uses {@see ShippingCalculatorInterface} for local flat-rate/pickup quotes only.
 * Stage 11+ carrier adapters implement this contract for live quotes, label creation,
 * and tracking synchronization — without replacing the calculator strategies.
 */
interface ShippingProviderInterface
{
    public function providerCode(): string;
}

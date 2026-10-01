<?php

namespace App\Domains\Checkout\Services;

use App\Domains\Checkout\Contracts\AssemblyCalculator;

final class StubAssemblyCalculator implements AssemblyCalculator
{
    public function calculate(string $vendorSubtotal, int $itemCount): string
    {
        return '0.00';
    }
}

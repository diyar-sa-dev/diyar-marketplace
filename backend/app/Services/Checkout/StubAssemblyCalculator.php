<?php

namespace App\Services\Checkout;

final class StubAssemblyCalculator implements AssemblyCalculator
{
    public function calculate(string $vendorSubtotal, int $itemCount): string
    {
        return '0.00';
    }
}

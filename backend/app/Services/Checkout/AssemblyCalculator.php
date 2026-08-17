<?php

namespace App\Services\Checkout;

interface AssemblyCalculator
{
    public function calculate(string $vendorSubtotal, int $itemCount): string;
}

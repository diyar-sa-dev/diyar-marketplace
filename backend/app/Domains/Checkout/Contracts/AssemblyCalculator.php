<?php

namespace App\Domains\Checkout\Contracts;

interface AssemblyCalculator
{
    public function calculate(string $vendorSubtotal, int $itemCount): string;
}

<?php

namespace App\Services\Checkout;

final class VatCalculator
{
    public function rate(): string
    {
        return (string) config('diyar.tax.vat_rate', '0.15');
    }

    public function calculateForVendor(string $vendorSubtotal, string $vendorShipping): string
    {
        $base = bcadd($vendorSubtotal, $vendorShipping, 2);

        return bcmul($this->rate(), $base, 2);
    }

    /**
     * @param  list<string>  $vendorVatAmounts
     */
    public function sumWithRemainder(array $vendorVatAmounts): string
    {
        $total = '0.00';

        foreach ($vendorVatAmounts as $amount) {
            $total = bcadd($total, $amount, 2);
        }

        return $total;
    }
}

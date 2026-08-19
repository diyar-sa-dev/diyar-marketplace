<?php

namespace App\Services\Checkout;

final class VatCalculator
{
    public function rate(): string
    {
        return (string) config('diyar.tax.vat_rate', '0.15');
    }

    public function calculateForVendor(
        string $vendorSubtotal,
        string $vendorShipping,
        string $discount = '0.00',
    ): string {
        $base = bcsub(bcadd($vendorSubtotal, $vendorShipping, 2), $discount, 2);

        if (bccomp($base, '0', 2) < 0) {
            $base = '0.00';
        }

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

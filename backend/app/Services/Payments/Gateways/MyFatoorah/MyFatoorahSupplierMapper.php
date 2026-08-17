<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Models\Order;

final class MyFatoorahSupplierMapper
{
    /**
     * Multi-vendor supplier allocation requires vendor MyFatoorah supplier codes.
     *
     * @return list<array{SupplierCode: int|string, InvoiceShare: float|string, ProposedShare?: float|string}>
     */
    public function mapOrderSuppliers(Order $order): array
    {
        $order->loadMissing('vendorOrders.vendorAccount');

        $suppliers = [];

        foreach ($order->vendorOrders as $vendorOrder) {
            $supplierCode = $vendorOrder->vendorAccount->myfatoorah_supplier_code ?? null;

            if ($supplierCode === null || $supplierCode === '') {
                continue;
            }

            $suppliers[] = [
                'SupplierCode' => $supplierCode,
                'InvoiceShare' => (float) $vendorOrder->vendor_total,
            ];
        }

        return $suppliers;
    }
}

<?php

namespace App\Services\Finance;

use App\Models\FinancialTransaction;
use App\Models\VendorPayout;
use Illuminate\Support\Str;

final class FinancialReferenceService
{
    public function nextTransactionReference(): string
    {
        do {
            $reference = 'FT-'.now()->format('Ymd').'-'.strtoupper(Str::random(8));
        } while (FinancialTransaction::query()->where('reference', $reference)->exists());

        return $reference;
    }

    public function nextPayoutReference(): string
    {
        do {
            $reference = 'PO-'.now()->format('Ymd').'-'.strtoupper(Str::random(8));
        } while (VendorPayout::query()->where('reference', $reference)->exists());

        return $reference;
    }
}

<?php

namespace App\Http\Resources;

use App\Models\FinancialTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FinancialTransaction */
class FinancialTransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'transaction_type' => $this->transaction_type->value,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'direction' => $this->direction->value,
            'balance_bucket' => $this->balance_bucket->value,
            'description' => $this->description,
            'order_id' => $this->order_id,
            'order_number' => $this->order?->order_number,
            'payment_id' => $this->payment_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

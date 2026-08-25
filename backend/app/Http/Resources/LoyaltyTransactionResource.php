<?php

namespace App\Http\Resources;

use App\Models\LoyaltyTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LoyaltyTransaction */
class LoyaltyTransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type instanceof \BackedEnum ? $this->type->value : (string) $this->type,
            'points' => $this->points,
            'balance_after' => $this->balance_after,
            'description' => $this->reason,
            'order_id' => $this->order_id,
            'eligible_amount' => $this->eligible_amount !== null ? (string) $this->eligible_amount : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'payment' => new PaymentResource($this->resource['payment']),
            'payment_url' => $this->resource['payment_url'],
            'attempt_id' => $this->resource['attempt_id'],
        ];
    }
}

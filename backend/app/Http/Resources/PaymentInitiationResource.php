<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentInitiationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'payment' => new PaymentResource($this->resource['payment']),
            'session' => $this->resource['session'],
            'methods' => $this->resource['methods'],
            'attempt_id' => $this->resource['attempt_id'],
            'simulated' => (bool) ($this->resource['simulated'] ?? false),
        ];
    }
}

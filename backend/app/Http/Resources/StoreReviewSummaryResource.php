<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreReviewSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'average_rating' => $this->resource['average_rating'] ?? null,
            'review_count' => $this->resource['review_count'] ?? 0,
            'distribution' => $this->resource['distribution'] ?? [],
        ];
    }
}
